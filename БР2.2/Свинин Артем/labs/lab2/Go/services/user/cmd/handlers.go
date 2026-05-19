package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
)

func (s *userService) handleUsersMe(w http.ResponseWriter, r *http.Request) {
	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		resp, status, err := s.buildUserResponse(p.UserID)
		if err != nil {
			writeAPIError(w, status, err.Error())
			return
		}

		httputil.WriteJSON(w, http.StatusOK, resp)
	case http.MethodPatch:
		var req userUpdateRequest
		if err := httputil.ReadJSON(r, &req); err != nil {
			writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
			return
		}

		if err := s.validator.Validate(req); err != nil {
			writeAPIError(w, http.StatusBadRequest, err.Error())
			return
		}

		if req.Email != nil {
			if !s.store.isEmailAvailable(p.UserID, strings.ToLower(strings.TrimSpace(*req.Email))) {
				writeAPIError(w, http.StatusConflict, "Email уже занят")
				return
			}
		}

		s.store.updateProfile(p.UserID, req)

		resp, status, err := s.buildUserResponse(p.UserID)
		if err != nil {
			writeAPIError(w, status, err.Error())
			return
		}

		httputil.WriteJSON(w, http.StatusOK, resp)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *userService) handleUserByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	idPart := strings.TrimPrefix(r.URL.Path, "/users/")
	idPart = strings.TrimSpace(idPart)
	if idPart == "" || strings.Contains(idPart, "/") {
		writeAPIError(w, http.StatusNotFound, "Пользователь не найден")
		return
	}

	userID, err := strconv.ParseInt(idPart, 10, 64)
	if err != nil || userID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "Некорректный ID пользователя")
		return
	}

	if p.Role != "ADMIN" && p.UserID != userID {
		writeAPIError(w, http.StatusForbidden, "Доступ к профилю другого пользователя запрещен")
		return
	}

	resp, status, buildErr := s.buildUserResponse(userID)
	if buildErr != nil {
		writeAPIError(w, status, buildErr.Error())
		return
	}

	httputil.WriteJSON(w, http.StatusOK, resp)
}

func (s *userService) handleFavourites(w http.ResponseWriter, r *http.Request) {
	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		page := parseQueryInt(r, "page", 1, 1, 100000)
		pageSize := parseQueryInt(r, "pageSize", 10, 1, 100)
		items, total, err := s.store.listFavouritesPage(favouritesListParams{
			UserID:   p.UserID,
			Page:     page,
			PageSize: pageSize,
		})
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, "Не удалось получить избранное")
			return
		}

		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"items":    items,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		})
	case http.MethodPost:
		var req addFavouriteRequest
		if err := httputil.ReadJSON(r, &req); err != nil {
			writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
			return
		}

		if err := s.validator.Validate(req); err != nil {
			writeAPIError(w, http.StatusBadRequest, err.Error())
			return
		}

		if _, status, err := s.property.getOwnerID(req.PropertyID, s.serviceToken); err != nil {
			writeAPIError(w, status, err.Error())
			return
		}

		fav, err := s.store.addFavourite(p.UserID, req.PropertyID)
		if err != nil {
			writeAPIError(w, http.StatusConflict, "Объект уже находится в избранном")
			return
		}

		httputil.WriteJSON(w, http.StatusCreated, fav)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *userService) handleFavouriteByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeMethodNotAllowed(w)
		return
	}

	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	idPart := strings.TrimPrefix(r.URL.Path, "/favourites/")
	idPart = strings.TrimSpace(idPart)
	if idPart == "" || strings.Contains(idPart, "/") {
		writeAPIError(w, http.StatusNotFound, "Запись не найдена")
		return
	}

	favID, err := strconv.ParseInt(idPart, 10, 64)
	if err != nil || favID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "Некорректный ID избранного")
		return
	}

	if !s.store.deleteFavourite(p.UserID, favID) {
		writeAPIError(w, http.StatusNotFound, "Запись не найдена")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *userService) buildUserResponse(userID int64) (map[string]any, int, error) {
	authUser, status, err := s.auth.getUserByID(userID)
	if err != nil {
		return nil, status, err
	}

	profile := s.store.getOrInitProfile(userID)
	firstName := pickString(profile.FirstName, authUser.FirstName)
	lastName := pickString(profile.LastName, authUser.LastName)
	email := pickString(profile.Email, authUser.Email)
	middleName := pickString(profile.MiddleName, "")
	phone := pickString(profile.Phone, "")

	updatedAt := authUser.UpdatedAt
	if !profile.UpdatedAt.IsZero() {
		updatedAt = profile.UpdatedAt.UTC().Format(time.RFC3339)
	}

	resp := map[string]any{
		"id":         authUser.ID,
		"firstName":  firstName,
		"lastName":   lastName,
		"email":      email,
		"role":       authUser.Role,
		"isVerified": authUser.IsVerified,
		"isActive":   authUser.IsActive,
		"createdAt":  authUser.CreatedAt,
		"updatedAt":  updatedAt,
	}

	if middleName != "" {
		resp["middleName"] = middleName
	}

	if phone != "" {
		resp["phone"] = phone
	}

	return resp, http.StatusOK, nil
}

func pickString(value *string, fallback string) string {
	if value == nil {
		return fallback
	}

	return *value
}
