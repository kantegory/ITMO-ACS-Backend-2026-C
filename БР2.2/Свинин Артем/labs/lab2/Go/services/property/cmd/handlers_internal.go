package main

import (
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
)

type validatePropertiesRequest struct {
	PropertyIDs []int64 `json:"propertyIds"`
}

func (s *propertyService) handleInternalPropertyRoutes(w http.ResponseWriter, r *http.Request) {
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/internal")
	if strings.HasSuffix(path, "/owner") {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		id, ok := parsePathID(strings.TrimSuffix(path, "/owner"), "/properties/")
		if !ok {
			writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
			return
		}
		s.handleInternalPropertyOwner(w, id)
		return
	}

	if strings.HasSuffix(path, "/availability") {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		id, ok := parsePathID(strings.TrimSuffix(path, "/availability"), "/properties/")
		if !ok {
			writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
			return
		}
		s.handleInternalPropertyAvailability(w, r, id)
		return
	}

	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	id, ok := parsePathID(path, "/properties/")
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	rec, exists := s.store.getProperty(id)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, s.buildPropertyResponse(rec))
}

func (s *propertyService) handleInternalPropertyAvailability(w http.ResponseWriter, r *http.Request, id int64) {
	rec, exists := s.store.getProperty(id)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	startRaw := strings.TrimSpace(r.URL.Query().Get("startDate"))
	endRaw := strings.TrimSpace(r.URL.Query().Get("endDate"))
	if startRaw == "" || endRaw == "" {
		writeAPIError(w, http.StatusBadRequest, "startDate и endDate обязательны")
		return
	}

	startDate, err := time.Parse(time.RFC3339, startRaw)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный startDate")
		return
	}
	endDate, err := time.Parse(time.RFC3339, endRaw)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный endDate")
		return
	}
	if !endDate.After(startDate) {
		writeAPIError(w, http.StatusBadRequest, "Дата окончания должна быть позже даты начала")
		return
	}

	if !rec.IsAvailable {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"available":  false,
			"propertyId": rec.ID,
			"startDate":  startDate.UTC().Format(time.RFC3339),
			"endDate":    endDate.UTC().Format(time.RFC3339),
			"reason":     "PROPERTY_NOT_AVAILABLE",
			"message":    "Объект временно недоступен",
		})
		return
	}

	hours := endDate.Sub(startDate).Hours()
	nights := int(math.Ceil(hours / 24))
	if nights < 1 {
		nights = 1
	}
	totalPrice := float64(nights) * rec.PricePerDay

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"available":   true,
		"propertyId":  rec.ID,
		"startDate":   startDate.UTC().Format(time.RFC3339),
		"endDate":     endDate.UTC().Format(time.RFC3339),
		"pricePerDay": rec.PricePerDay,
		"totalPrice":  totalPrice,
		"minRentDays": rec.MinRentDays,
		"maxRentDays": rec.MaxRentDays,
	})
}

func (s *propertyService) handleInternalPropertyOwner(w http.ResponseWriter, id int64) {
	rec, exists := s.store.getProperty(id)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	owner, status, err := s.auth.getUserByID(rec.OwnerID)
	if err != nil {
		writeAPIError(w, status, err.Error())
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"ownerId":        owner.ID,
		"ownerEmail":     owner.Email,
		"ownerFirstName": owner.FirstName,
		"ownerLastName":  owner.LastName,
		"ownerPhone":     "",
		"isVerified":     owner.IsVerified,
	})
}

func (s *propertyService) handleInternalPropertiesValidate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	var req validatePropertiesRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}
	if len(req.PropertyIDs) == 0 {
		writeAPIError(w, http.StatusBadRequest, "propertyIds обязательны")
		return
	}

	valid := make([]map[string]any, 0)
	invalid := make([]int64, 0)
	for _, propertyID := range req.PropertyIDs {
		rec, ok := s.store.getProperty(propertyID)
		if !ok {
			invalid = append(invalid, propertyID)
			continue
		}
		valid = append(valid, map[string]any{
			"propertyId":  rec.ID,
			"isAvailable": rec.IsAvailable,
			"ownerId":     rec.OwnerID,
		})
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"valid":   valid,
		"invalid": invalid,
	})
}

func (s *propertyService) handleInternalPropertiesByOwner(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	idPart := strings.TrimPrefix(r.URL.Path, "/internal/properties/by-owner/")
	idPart = strings.Trim(strings.TrimSpace(idPart), "/")
	ownerID, err := strconv.ParseInt(idPart, 10, 64)
	if err != nil || ownerID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "Некорректный ownerId")
		return
	}

	availableFilter, err := parseOptionalBool(r.URL.Query().Get("isAvailable"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр isAvailable")
		return
	}
	limit := parseQueryInt(r, "limit", 100, 1, 1000)

	items := s.store.listProperties(func(rec *propertyRecord) bool {
		if rec.OwnerID != ownerID {
			return false
		}
		if availableFilter != nil && rec.IsAvailable != *availableFilter {
			return false
		}
		return true
	})

	responses := make([]propertyResponse, 0, len(items))
	for _, rec := range items {
		responses = append(responses, s.buildPropertyResponse(rec))
		if len(responses) >= limit {
			break
		}
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"properties": responses,
		"total":      len(responses),
	})
}

func validateServiceToken(r *http.Request, expected string) bool {
	token := strings.TrimSpace(r.Header.Get("X-Service-Token"))
	if token == "" {
		return false
	}
	return token == strings.TrimSpace(expected)
}
