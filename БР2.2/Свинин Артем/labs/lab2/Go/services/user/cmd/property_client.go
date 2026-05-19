package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

type internalPropertyOwnerResponse struct {
	OwnerID int64 `json:"ownerId"`
}

type internalPropertyListItem struct {
	ID int64 `json:"id"`
}

type internalPropertiesByOwnerResponse struct {
	Properties []internalPropertyListItem `json:"properties"`
	Total      int                        `json:"total"`
}

func (c *propertyClient) getOwnerID(propertyID int64, serviceToken string) (int64, int, error) {
	url := fmt.Sprintf("%s/internal/properties/%d/owner", c.baseURL, propertyID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return 0, http.StatusInternalServerError, fmt.Errorf("не удалось создать запрос к property-service")
	}
	req.Header.Set("X-Service-Token", strings.TrimSpace(serviceToken))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return 0, http.StatusServiceUnavailable, fmt.Errorf("property-service недоступен")
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return 0, http.StatusNotFound, fmt.Errorf("объект недвижимости не найден")
	}
	if resp.StatusCode == http.StatusUnauthorized {
		return 0, http.StatusUnauthorized, fmt.Errorf("неавторизован")
	}
	if resp.StatusCode != http.StatusOK {
		return 0, http.StatusServiceUnavailable, fmt.Errorf("ошибка property-service")
	}

	var body internalPropertyOwnerResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return 0, http.StatusServiceUnavailable, fmt.Errorf("невалидный ответ property-service")
	}
	if body.OwnerID <= 0 {
		return 0, http.StatusServiceUnavailable, fmt.Errorf("ownerId не найден")
	}

	return body.OwnerID, http.StatusOK, nil
}

func (c *propertyClient) listPropertyIDsByOwner(ownerID int64, limit int, serviceToken string) ([]int64, int, error) {
	url := fmt.Sprintf("%s/internal/properties/by-owner/%d?limit=%s", c.baseURL, ownerID, strconv.Itoa(limit))
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("не удалось создать запрос к property-service")
	}
	req.Header.Set("X-Service-Token", strings.TrimSpace(serviceToken))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("property-service недоступен")
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, http.StatusNotFound, fmt.Errorf("владелец не найден")
	}
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, http.StatusUnauthorized, fmt.Errorf("неавторизован")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("ошибка property-service")
	}

	var body internalPropertiesByOwnerResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("невалидный ответ property-service")
	}

	ids := make([]int64, 0, len(body.Properties))
	for _, item := range body.Properties {
		if item.ID > 0 {
			ids = append(ids, item.ID)
		}
	}

	return ids, http.StatusOK, nil
}
