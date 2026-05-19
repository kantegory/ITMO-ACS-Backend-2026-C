package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
)

type authClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

func (c *authClient) authenticate(accessToken string) (principal, int, string) {
	if strings.TrimSpace(accessToken) == "" {
		return principal{}, http.StatusUnauthorized, "Отсутствует токен авторизации"
	}

	payload, _ := json.Marshal(authTokenValidationRequest{Token: accessToken})

	req, err := http.NewRequest(http.MethodPost, strings.TrimRight(c.baseURL, "/")+"/auth/tokens/validate", bytes.NewReader(payload))
	if err != nil {
		return principal{}, http.StatusServiceUnavailable, "Не удалось обратиться к сервису авторизации"
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return principal{}, http.StatusServiceUnavailable, "Сервис авторизации недоступен"
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized {
			return principal{}, http.StatusUnauthorized, "Невалидный токен"
		}
		return principal{}, http.StatusServiceUnavailable, "Сервис авторизации недоступен"
	}

	var body authTokenValidationResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return principal{}, http.StatusServiceUnavailable, "Ошибка ответа сервиса авторизации"
	}

	if !body.Valid || body.UserID <= 0 {
		return principal{}, http.StatusUnauthorized, "Невалидный токен"
	}

	return principal{
		UserID: body.UserID,
		Role:   strings.ToUpper(strings.TrimSpace(body.Role)),
		Email:  strings.TrimSpace(body.Email),
	}, http.StatusOK, ""
}
