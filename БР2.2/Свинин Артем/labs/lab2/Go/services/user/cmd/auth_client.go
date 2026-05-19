package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

func (s *userService) authenticate(w http.ResponseWriter, r *http.Request) (principal, bool) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(authHeader, "Bearer ") {
		writeAPIError(w, http.StatusUnauthorized, "Требуется аутентификация")
		return principal{}, false
	}

	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if token == "" {
		writeAPIError(w, http.StatusUnauthorized, "Требуется аутентификация")
		return principal{}, false
	}

	validation, status, err := s.auth.validateToken(token)
	if err != nil {
		writeAPIError(w, status, err.Error())
		return principal{}, false
	}

	if !validation.Valid || !validation.IsActive {
		writeAPIError(w, http.StatusUnauthorized, "Требуется аутентификация")
		return principal{}, false
	}

	return principal{
		UserID: validation.UserID,
		Email:  validation.Email,
		Role:   validation.Role,
	}, true
}

func (a *authClient) validateToken(token string) (*authValidationResponse, int, error) {
	payload, _ := json.Marshal(map[string]string{"token": token})
	req, err := http.NewRequest(http.MethodPost, a.baseURL+"/auth/tokens/validate", bytes.NewReader(payload))
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("не удалось создать запрос к auth-service")
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Service-Token", a.serviceToken)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("auth-service недоступен")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("ошибка валидации токена")
	}

	var out authValidationResponse
	if decodeErr := json.NewDecoder(resp.Body).Decode(&out); decodeErr != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("невалидный ответ auth-service")
	}

	if !out.Valid {
		return nil, http.StatusUnauthorized, fmt.Errorf("требуется аутентификация")
	}

	return &out, http.StatusOK, nil
}

func (a *authClient) getUserByID(userID int64) (*authUserResponse, int, error) {
	url := fmt.Sprintf("%s/auth/users/%d", a.baseURL, userID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("не удалось создать запрос к auth-service")
	}

	req.Header.Set("X-Service-Token", a.serviceToken)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("auth-service недоступен")
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, http.StatusNotFound, fmt.Errorf("пользователь не найден")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("ошибка получения пользователя")
	}

	var out authUserResponse
	if decodeErr := json.NewDecoder(resp.Body).Decode(&out); decodeErr != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("невалидный ответ auth-service")
	}

	return &out, http.StatusOK, nil
}
