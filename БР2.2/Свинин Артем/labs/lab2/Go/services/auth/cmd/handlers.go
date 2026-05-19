package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
)

func (a *authService) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	var req registerRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := a.validator.Validate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	u, err := a.store.createUser(req.FirstName, req.LastName, req.Email, req.Password)
	if err != nil {
		writeAPIError(w, http.StatusConflict, "Пользователь с таким email уже существует")
		return
	}

	tokens, tokenErr := a.issueTokens(u)
	if tokenErr != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось сгенерировать токены")
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, tokens)
}

func (a *authService) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	var req loginRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := a.validator.Validate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	u, ok := a.store.getUserByEmail(req.Email)
	if !ok || !verifyPassword(u.PasswordHash, req.Password) {
		writeAPIError(w, http.StatusUnauthorized, "Неверный email или пароль")
		return
	}

	if !u.IsActive {
		writeAPIError(w, http.StatusUnauthorized, "Пользователь деактивирован")
		return
	}

	tokens, tokenErr := a.issueTokens(u)
	if tokenErr != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось сгенерировать токены")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, tokens)
}

func (a *authService) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	accessClaims, err := a.authorizeAccessToken(r)
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	var req refreshRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := a.validator.Validate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	accessUserID, err := accessClaims.userID()
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "Требуется аутентификация")
		return
	}

	if !a.store.consumeRefreshToken(req.RefreshToken, accessUserID) {
		writeAPIError(w, http.StatusBadRequest, "Неверный refresh токен")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *authService) handleRefresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	var req refreshRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := a.validator.Validate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	claims, err := a.parseAndVerifyToken(req.RefreshToken, "refresh")
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "Refresh токен истек или недействителен")
		return
	}

	userID, err := claims.userID()
	if err != nil {
		writeAPIError(w, http.StatusUnauthorized, "Refresh токен истек или недействителен")
		return
	}

	if !a.store.consumeRefreshToken(req.RefreshToken, userID) {
		writeAPIError(w, http.StatusUnauthorized, "Refresh токен истек или недействителен")
		return
	}

	u, ok := a.store.getUserByID(userID)
	if !ok {
		writeAPIError(w, http.StatusUnauthorized, "Пользователь не найден")
		return
	}

	tokens, tokenErr := a.issueTokens(u)
	if tokenErr != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось сгенерировать токены")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, tokens)
}

func (a *authService) handleValidateToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	if !a.checkServiceToken(r) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	var req validateTokenRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := a.validator.Validate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	claims, err := a.parseAndVerifyToken(req.Token, "access")
	if err != nil {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"valid":  false,
			"reason": err.Error(),
		})
		return
	}

	userID, err := claims.userID()
	if err != nil {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"valid":  false,
			"reason": "Invalid subject",
		})
		return
	}

	u, ok := a.store.getUserByID(userID)
	if !ok {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"valid":  false,
			"reason": "User not found",
		})
		return
	}

	expiresAt := ""
	if claims.ExpiresAt != nil {
		expiresAt = claims.ExpiresAt.Time.UTC().Format(time.RFC3339)
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"valid":     true,
		"userId":    u.ID,
		"email":     u.Email,
		"role":      u.Role,
		"expiresAt": expiresAt,
		"isActive":  u.IsActive,
	})
}

func (a *authService) handleGetUserByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	if !a.checkServiceToken(r) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	idPart := strings.TrimPrefix(r.URL.Path, "/auth/users/")
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

	u, ok := a.store.getUserByID(userID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Пользователь не найден")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"id":         u.ID,
		"email":      u.Email,
		"firstName":  u.FirstName,
		"lastName":   u.LastName,
		"role":       u.Role,
		"isActive":   u.IsActive,
		"isVerified": u.IsVerified,
		"createdAt":  u.CreatedAt.Format(time.RFC3339),
		"updatedAt":  u.UpdatedAt.Format(time.RFC3339),
	})
}

func (a *authService) handleValidateUsersBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	if !a.checkServiceToken(r) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	var req validateUsersRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := a.validator.Validate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	valid := make([]validatedUser, 0, len(req.UserIDs))
	invalid := make([]int64, 0)

	for _, id := range req.UserIDs {
		u, ok := a.store.getUserByID(id)
		if !ok {
			invalid = append(invalid, id)
			continue
		}

		valid = append(valid, validatedUser{UserID: u.ID, IsActive: u.IsActive})
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"valid":   valid,
		"invalid": invalid,
	})
}
