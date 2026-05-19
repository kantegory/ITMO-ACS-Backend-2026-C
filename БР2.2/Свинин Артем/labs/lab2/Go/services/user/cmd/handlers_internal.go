package main

import (
	"net/http"
	"strconv"
	"strings"

	"rental-platform/pkg/shared/httputil"
)

type ownershipValidationRequest struct {
	UserID     int64 `json:"userId"`
	PropertyID int64 `json:"propertyId"`
}

func (s *userService) handleInternalUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	trimmed := strings.TrimPrefix(r.URL.Path, "/internal/users/")
	trimmed = strings.TrimSpace(strings.Trim(trimmed, "/"))
	parts := strings.Split(trimmed, "/")
	if len(parts) != 2 {
		writeAPIError(w, http.StatusNotFound, "Пользователь не найден")
		return
	}

	userID, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || userID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "Некорректный ID пользователя")
		return
	}

	switch parts[1] {
	case "profile":
		s.handleInternalUserProfile(w, userID)
	case "properties":
		s.handleInternalUserProperties(w, r, userID)
	default:
		writeAPIError(w, http.StatusNotFound, "Пользователь не найден")
	}
}

func (s *userService) handleInternalUserProfile(w http.ResponseWriter, userID int64) {
	resp, status, err := s.buildUserResponse(userID)
	if err != nil {
		writeAPIError(w, status, err.Error())
		return
	}

	propertyIDs, _, propertyErr := s.property.listPropertyIDsByOwner(userID, 1000, s.serviceToken)
	propertiesCount := 0
	if propertyErr == nil {
		propertiesCount = len(propertyIDs)
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"id":              resp["id"],
		"email":           resp["email"],
		"firstName":       resp["firstName"],
		"lastName":        resp["lastName"],
		"middleName":      resp["middleName"],
		"phone":           resp["phone"],
		"role":            resp["role"],
		"isVerified":      resp["isVerified"],
		"isActive":        resp["isActive"],
		"propertiesCount": propertiesCount,
		"bookingsCount":   0,
		"averageRating":   0,
		"totalReviews":    0,
		"createdAt":       resp["createdAt"],
	})
}

func (s *userService) handleInternalUserProperties(w http.ResponseWriter, r *http.Request, userID int64) {
	_, status, err := s.auth.getUserByID(userID)
	if err != nil {
		writeAPIError(w, status, err.Error())
		return
	}

	limit := parseQueryInt(r, "limit", 100, 1, 1000)
	propertyIDs, propertyStatus, propertyErr := s.property.listPropertyIDsByOwner(userID, limit, s.serviceToken)
	if propertyErr != nil {
		if propertyStatus == http.StatusNotFound {
			httputil.WriteJSON(w, http.StatusOK, map[string]any{"propertyIds": []int64{}, "total": 0})
			return
		}
		writeAPIError(w, propertyStatus, propertyErr.Error())
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"propertyIds": propertyIDs,
		"total":       len(propertyIDs),
	})
}

func (s *userService) handleInternalValidateOwnership(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	var req ownershipValidationRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}
	if req.UserID <= 0 || req.PropertyID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "userId и propertyId обязательны")
		return
	}

	ownerID, status, err := s.property.getOwnerID(req.PropertyID, s.serviceToken)
	if err != nil {
		if status == http.StatusNotFound {
			httputil.WriteJSON(w, http.StatusOK, map[string]any{
				"isOwner":    false,
				"propertyId": req.PropertyID,
				"userId":     req.UserID,
			})
			return
		}
		writeAPIError(w, status, err.Error())
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"isOwner":    ownerID == req.UserID,
		"propertyId": req.PropertyID,
		"userId":     req.UserID,
	})
}

func validateServiceToken(r *http.Request, expected string) bool {
	token := strings.TrimSpace(r.Header.Get("X-Service-Token"))
	return token != "" && token == strings.TrimSpace(expected)
}
