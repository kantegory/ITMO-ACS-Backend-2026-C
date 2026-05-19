package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

type propertyClient struct {
	baseURL    string
	httpClient *http.Client
}

func (c *propertyClient) getByID(propertyID int64) (*propertyResponse, int, string) {
	url := strings.TrimRight(c.baseURL, "/") + "/properties/" + strconv.FormatInt(propertyID, 10)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, http.StatusServiceUnavailable, "Не удалось проверить доступность объекта"
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, http.StatusServiceUnavailable, "Не удалось проверить доступность объекта"
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, http.StatusNotFound, "Объект не найден"
	}
	if resp.StatusCode != http.StatusOK {
		return nil, http.StatusServiceUnavailable, "Не удалось проверить доступность объекта"
	}

	var body propertyResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, http.StatusServiceUnavailable, "Не удалось проверить доступность объекта"
	}

	return &body, http.StatusOK, ""
}
