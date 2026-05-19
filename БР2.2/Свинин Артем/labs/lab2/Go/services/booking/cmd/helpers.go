package main

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"os"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
)

var parsePathID = func(path string) (int64, error) {
	return httputil.ParsePathID(path, "bookings")
}

var writeAPIError = httputil.WriteError
var writeMethodNotAllowed = httputil.WriteMethodNotAllowed
var parsePositiveIntQuery = httputil.ParsePositiveIntQuery
var parseBearerToken = httputil.ParseBearerToken
var parseOptionalInt64Query = httputil.ParseOptionalInt64
var parseOptionalDateQuery = httputil.ParseOptionalTime

func getenv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func normalizePort(port string) string {
	p := strings.TrimSpace(port)
	if p == "" {
		return ":8084"
	}
	if strings.HasPrefix(p, ":") {
		return p
	}
	return ":" + p
}

func parseOptionalStatusQuery(values map[string][]string, key string) (*bookingStatus, bool) {
	raw := strings.TrimSpace(firstQueryValue(values, key))
	if raw == "" {
		return nil, true
	}
	status := bookingStatus(strings.ToUpper(raw))
	if !isValidBookingStatus(status) {
		return nil, false
	}
	return &status, true
}

func firstQueryValue(values map[string][]string, key string) string {
	list := values[key]
	if len(list) == 0 {
		return ""
	}
	return list[0]
}

func parseCreateBookingRequest(r *http.Request) (bookingCreateRequest, time.Time, time.Time, error) {
	var req bookingCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return bookingCreateRequest{}, time.Time{}, time.Time{}, errors.New("Некорректный JSON")
	}

	req.SpecialRequest = strings.TrimSpace(req.SpecialRequest)
	if req.PropertyID <= 0 {
		return bookingCreateRequest{}, time.Time{}, time.Time{}, errors.New("Поле propertyId обязательно")
	}
	if req.GuestsCount <= 0 {
		return bookingCreateRequest{}, time.Time{}, time.Time{}, errors.New("Поле guestsCount должно быть больше 0")
	}
	if len(req.SpecialRequest) > 1000 {
		return bookingCreateRequest{}, time.Time{}, time.Time{}, errors.New("Поле specialRequest слишком длинное")
	}

	startDate, err := time.Parse(time.RFC3339, strings.TrimSpace(req.StartDate))
	if err != nil {
		return bookingCreateRequest{}, time.Time{}, time.Time{}, errors.New("Некорректная дата начала")
	}
	endDate, err := time.Parse(time.RFC3339, strings.TrimSpace(req.EndDate))
	if err != nil {
		return bookingCreateRequest{}, time.Time{}, time.Time{}, errors.New("Некорректная дата окончания")
	}

	startDate = startDate.UTC()
	endDate = endDate.UTC()
	if !endDate.After(startDate) {
		return bookingCreateRequest{}, time.Time{}, time.Time{}, errors.New("Дата окончания должна быть позже даты начала")
	}

	return req, startDate, endDate, nil
}

func parseUpdateBookingRequest(r *http.Request) (bookingUpdateRequest, error) {
	var req bookingUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return bookingUpdateRequest{}, errors.New("Некорректный JSON")
	}

	if req.Status == nil && req.SpecialRequest == nil && req.CancellationReason == nil {
		return bookingUpdateRequest{}, errors.New("Нет данных для обновления")
	}

	if req.Status != nil {
		status := bookingStatus(strings.ToUpper(strings.TrimSpace(string(*req.Status))))
		if !isValidBookingStatus(status) {
			return bookingUpdateRequest{}, errors.New("Недопустимый статус бронирования")
		}
		req.Status = &status
	}

	if req.SpecialRequest != nil {
		trimmed := strings.TrimSpace(*req.SpecialRequest)
		if len(trimmed) > 1000 {
			return bookingUpdateRequest{}, errors.New("Поле specialRequest слишком длинное")
		}
		req.SpecialRequest = &trimmed
	}

	if req.CancellationReason != nil {
		trimmed := strings.TrimSpace(*req.CancellationReason)
		if len(trimmed) > 1000 {
			return bookingUpdateRequest{}, errors.New("Поле cancellationReason слишком длинное")
		}
		req.CancellationReason = &trimmed
	}

	return req, nil
}

func isValidBookingStatus(status bookingStatus) bool {
	switch status {
	case bookingStatusPending,
		bookingStatusConfirmed,
		bookingStatusActive,
		bookingStatusCompleted,
		bookingStatusCancelled,
		bookingStatusRejected:
		return true
	default:
		return false
	}
}

func isAdmin(p principal) bool {
	return p.Role == "ADMIN"
}

func isParticipant(p principal, rec *bookingRecord) bool {
	if p.UserID == rec.OccupierID {
		return true
	}
	if p.UserID == rec.PropertyOwnerID {
		return true
	}
	return false
}

func datesOverlap(startA time.Time, endA time.Time, startB time.Time, endB time.Time) bool {
	return startA.Before(endB) && endA.After(startB)
}

func calcTotalPrice(startDate time.Time, endDate time.Time, pricePerDay float64) float64 {
	if pricePerDay < 0 {
		pricePerDay = 0
	}
	hours := endDate.Sub(startDate).Hours()
	nights := int(math.Ceil(hours / 24))
	if nights < 1 {
		nights = 1
	}
	return float64(nights) * pricePerDay
}

func toBookingResponse(rec bookingRecord) bookingResponse {
	response := bookingResponse{
		ID:                 rec.ID,
		PropertyID:         rec.PropertyID,
		OccupierID:         rec.OccupierID,
		StartDate:          rec.StartDate.Format(time.RFC3339),
		EndDate:            rec.EndDate.Format(time.RFC3339),
		TotalPrice:         rec.TotalPrice,
		Status:             rec.Status,
		GuestsCount:        rec.GuestsCount,
		SpecialRequest:     rec.SpecialRequest,
		CancellationReason: rec.CancellationReason,
		CreatedAt:          rec.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          rec.UpdatedAt.Format(time.RFC3339),
	}

	property := map[string]any{
		"id": rec.PropertyID,
	}
	if rec.PropertyTitle != "" {
		property["title"] = rec.PropertyTitle
	}
	if rec.PropertyCity != "" {
		property["address"] = map[string]any{"city": rec.PropertyCity}
	}
	response.Property = property

	return response
}

func canTransitionStatus(from bookingStatus, to bookingStatus) bool {
	if from == to {
		return true
	}

	switch from {
	case bookingStatusPending:
		return to == bookingStatusConfirmed || to == bookingStatusRejected || to == bookingStatusCancelled
	case bookingStatusConfirmed:
		return to == bookingStatusActive || to == bookingStatusCancelled
	case bookingStatusActive:
		return to == bookingStatusCompleted || to == bookingStatusCancelled
	default:
		return false
	}
}

func canActorSetStatus(actor principal, rec *bookingRecord, target bookingStatus) bool {
	if isAdmin(actor) {
		return true
	}

	isOwner := actor.UserID == rec.PropertyOwnerID
	isOccupier := actor.UserID == rec.OccupierID

	if isOwner {
		switch rec.Status {
		case bookingStatusPending:
			return target == bookingStatusConfirmed || target == bookingStatusRejected || target == bookingStatusCancelled
		case bookingStatusConfirmed:
			return target == bookingStatusActive || target == bookingStatusCancelled
		case bookingStatusActive:
			return target == bookingStatusCompleted || target == bookingStatusCancelled
		default:
			return false
		}
	}

	if isOccupier {
		if target == bookingStatusCancelled {
			return rec.Status == bookingStatusPending || rec.Status == bookingStatusConfirmed
		}
		return false
	}

	return false
}
