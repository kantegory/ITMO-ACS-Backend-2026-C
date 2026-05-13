package main

import (
	"fmt"
	"strconv"
	"strings"

	"rental-platform/pkg/shared/httputil"
)

var writeAPIError = httputil.WriteError
var writeMethodNotAllowed = httputil.WriteMethodNotAllowed
var parsePathID = httputil.ParsePathIDWithPrefix
var parseQueryInt = httputil.ParseQueryInt

func validatePropertyCreate(req propertyCreateRequest) error {
	if req.AddressID <= 0 {
		return fmt.Errorf("Поле addressId обязательно")
	}

	if len(strings.TrimSpace(req.Title)) < 5 {
		return fmt.Errorf("Название должно содержать минимум 5 символов")
	}

	if len(strings.TrimSpace(req.Description)) < 20 {
		return fmt.Errorf("Описание должно содержать минимум 20 символов")
	}

	if req.PricePerDay < 0 || req.PricePerMonth < 0 {
		return fmt.Errorf("pricePerDay и pricePerMonth должны быть >= 0")
	}

	if req.AreaSqM < 1 || req.MaxGuests < 1 || req.MinRentDays < 1 {
		return fmt.Errorf("areaSqM, maxGuests и minRentDays должны быть положительными")
	}

	if req.Bedrooms < 0 || req.Bathrooms < 0 {
		return fmt.Errorf("bedrooms и bathrooms должны быть >= 0")
	}

	if req.MaxRentDays > 0 && req.MaxRentDays < req.MinRentDays {
		return fmt.Errorf("maxRentDays не может быть меньше minRentDays")
	}

	return nil
}

func validatePropertyUpdate(req propertyUpdateRequest) error {
	if req.Title != nil && len(strings.TrimSpace(*req.Title)) < 5 {
		return fmt.Errorf("Название должно содержать минимум 5 символов")
	}

	if req.Description != nil && len(strings.TrimSpace(*req.Description)) < 20 {
		return fmt.Errorf("Описание должно содержать минимум 20 символов")
	}

	if req.PricePerDay != nil && *req.PricePerDay < 0 {
		return fmt.Errorf("pricePerDay должен быть >= 0")
	}

	if req.PricePerMonth != nil && *req.PricePerMonth < 0 {
		return fmt.Errorf("pricePerMonth должен быть >= 0")
	}

	if req.AreaSqM != nil && *req.AreaSqM < 1 {
		return fmt.Errorf("areaSqM должен быть >= 1")
	}

	if req.MaxGuests != nil && *req.MaxGuests < 1 {
		return fmt.Errorf("maxGuests должен быть >= 1")
	}

	if req.Bedrooms != nil && *req.Bedrooms < 0 {
		return fmt.Errorf("bedrooms должен быть >= 0")
	}

	if req.Bathrooms != nil && *req.Bathrooms < 0 {
		return fmt.Errorf("bathrooms должен быть >= 0")
	}

	if req.MinRentDays != nil && *req.MinRentDays < 1 {
		return fmt.Errorf("minRentDays должен быть >= 1")
	}

	if req.AddressID != nil && *req.AddressID <= 0 {
		return fmt.Errorf("addressId должен быть положительным")
	}

	if req.TypeID != nil && *req.TypeID <= 0 {
		return fmt.Errorf("typeId должен быть положительным")
	}

	if req.MinRentDays != nil && req.MaxRentDays != nil && *req.MaxRentDays > 0 && *req.MaxRentDays < *req.MinRentDays {
		return fmt.Errorf("maxRentDays не может быть меньше minRentDays")
	}

	return nil
}

func validateAddressCreate(req addressCreateRequest) error {
	if len(strings.TrimSpace(req.Country)) < 2 {
		return fmt.Errorf("country должен содержать минимум 2 символа")
	}

	if len(strings.TrimSpace(req.City)) < 2 {
		return fmt.Errorf("city должен содержать минимум 2 символа")
	}

	if strings.TrimSpace(req.HouseNumber) == "" {
		return fmt.Errorf("houseNumber обязателен")
	}

	if req.Lat != nil && (*req.Lat < -90 || *req.Lat > 90) {
		return fmt.Errorf("lat должен быть в диапазоне [-90, 90]")
	}

	if req.Lon != nil && (*req.Lon < -180 || *req.Lon > 180) {
		return fmt.Errorf("lon должен быть в диапазоне [-180, 180]")
	}

	return nil
}

func parseOptionalFloat(raw string) (*float64, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	v, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return nil, err
	}

	return &v, nil
}

func parseOptionalInt(raw string) (*int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	v, err := strconv.Atoi(raw)
	if err != nil {
		return nil, err
	}

	return &v, nil
}

func parseOptionalBool(raw string) (*bool, error) {
	raw = strings.TrimSpace(strings.ToLower(raw))
	if raw == "" {
		return nil, nil
	}

	v, err := strconv.ParseBool(raw)
	if err != nil {
		return nil, err
	}

	return &v, nil
}

func parseOptionalInt64CSV(raw string) ([]int64, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, nil
	}

	parts := strings.Split(trimmed, ",")
	out := make([]int64, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value == "" {
			return nil, fmt.Errorf("empty value")
		}
		id, err := strconv.ParseInt(value, 10, 64)
		if err != nil || id <= 0 {
			return nil, fmt.Errorf("invalid value")
		}
		out = append(out, id)
	}

	return out, nil
}

func containsAllIDs(have []int64, required []int64) bool {
	if len(required) == 0 {
		return true
	}
	if len(have) == 0 {
		return false
	}
	set := make(map[int64]struct{}, len(have))
	for _, id := range have {
		set[id] = struct{}{}
	}
	for _, id := range required {
		if _, ok := set[id]; !ok {
			return false
		}
	}
	return true
}

func buildFullAddress(addr *address) string {
	parts := []string{}

	if addr.Country != "" {
		parts = append(parts, addr.Country)
	}
	if addr.City != "" {
		parts = append(parts, addr.City)
	}
	if addr.District != "" {
		parts = append(parts, addr.District)
	}
	if addr.HouseNumber != "" {
		parts = append(parts, addr.HouseNumber)
	}
	if addr.Apartment != "" {
		parts = append(parts, "кв. "+addr.Apartment)
	}
	if addr.PostalCode != "" {
		parts = append(parts, addr.PostalCode)
	}

	return strings.Join(parts, ", ")
}

func toNullFloat(v *float64) any {
	if v == nil {
		return nil
	}
	return *v
}
