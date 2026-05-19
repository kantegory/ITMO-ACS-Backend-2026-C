package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

type internalBookingsByPropertyResponse struct {
	Total int `json:"total"`
}

func (c *bookingClient) hasActiveBookings(propertyID int64) (bool, int, error) {
	qs := url.Values{}
	qs.Set("status", "PENDING,CONFIRMED,ACTIVE")
	qs.Set("limit", "1")
	endpoint := fmt.Sprintf("%s/internal/bookings/by-property/%d?%s", c.baseURL, propertyID, qs.Encode())

	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return false, http.StatusInternalServerError, fmt.Errorf("не удалось создать запрос к booking-service")
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, http.StatusServiceUnavailable, fmt.Errorf("booking-service недоступен")
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return false, http.StatusNotFound, fmt.Errorf("объект недвижимости не найден")
	}
	if resp.StatusCode == http.StatusUnauthorized {
		return false, http.StatusUnauthorized, fmt.Errorf("неавторизован")
	}
	if resp.StatusCode != http.StatusOK {
		return false, http.StatusServiceUnavailable, fmt.Errorf("ошибка booking-service")
	}

	var body internalBookingsByPropertyResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return false, http.StatusServiceUnavailable, fmt.Errorf("невалидный ответ booking-service")
	}
	if body.Total < 0 {
		return false, http.StatusServiceUnavailable, fmt.Errorf("некорректный total от booking-service")
	}

	return body.Total > 0, http.StatusOK, nil
}
