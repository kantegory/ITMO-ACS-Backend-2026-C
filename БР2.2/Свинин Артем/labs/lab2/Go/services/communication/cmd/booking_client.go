package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

type bookingClient struct {
	baseURL    string
	httpClient *http.Client
}

func (c *bookingClient) getByID(bookingID int64, accessToken string) (*bookingResponse, int, string) {
	url := strings.TrimRight(c.baseURL, "/") + "/bookings/" + strconv.FormatInt(bookingID, 10)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, http.StatusServiceUnavailable, "Не удалось проверить бронирование"
	}
	if strings.TrimSpace(accessToken) != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(accessToken))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, http.StatusServiceUnavailable, "Сервис бронирования недоступен"
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, http.StatusNotFound, "Бронирование не найдено"
	}
	if resp.StatusCode == http.StatusForbidden {
		return nil, http.StatusForbidden, "Недостаточно прав для работы с бронированием"
	}
	if resp.StatusCode != http.StatusOK {
		return nil, http.StatusServiceUnavailable, "Не удалось проверить бронирование"
	}

	var body bookingResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, http.StatusServiceUnavailable, "Ошибка ответа сервиса бронирования"
	}
	if body.ID <= 0 {
		return nil, http.StatusNotFound, "Бронирование не найдено"
	}

	return &body, http.StatusOK, ""
}
