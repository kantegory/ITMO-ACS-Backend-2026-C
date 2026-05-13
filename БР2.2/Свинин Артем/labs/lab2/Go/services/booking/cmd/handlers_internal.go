package main

import (
	"strings"
	"time"

	"net/http"
	"strconv"

	"rental-platform/pkg/shared/httputil"
)

type internalBookingStatusUpdateRequest struct {
	Status             bookingStatus `json:"status"`
	PaymentID          string        `json:"paymentId"`
	CancellationReason string        `json:"cancellationReason"`
}

type internalReviewEligibilityRequest struct {
	BookingID int64 `json:"bookingId"`
	UserID    int64 `json:"userId"`
}

func (s *bookingService) handleInternalBookingRoutes(w http.ResponseWriter, r *http.Request) {
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/internal")
	if strings.HasSuffix(path, "/status") {
		if r.Method != http.MethodPatch {
			writeMethodNotAllowed(w)
			return
		}
		id, ok := parseInternalID(strings.TrimSuffix(path, "/status"), "/bookings/")
		if !ok {
			writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
			return
		}
		s.handleInternalBookingStatusUpdate(w, r, id)
		return
	}

	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	id, ok := parseInternalID(path, "/bookings/")
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
		return
	}

	rec, exists := s.store.get(id)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
		return
	}

	payload := map[string]any{
		"id":          rec.ID,
		"propertyId":  rec.PropertyID,
		"occupierId":  rec.OccupierID,
		"ownerId":     rec.PropertyOwnerID,
		"startDate":   rec.StartDate.Format(time.RFC3339),
		"endDate":     rec.EndDate.Format(time.RFC3339),
		"status":      rec.Status,
		"totalPrice":  rec.TotalPrice,
		"guestsCount": rec.GuestsCount,
		"createdAt":   rec.CreatedAt.Format(time.RFC3339),
	}

	httputil.WriteJSON(w, http.StatusOK, payload)
}

func (s *bookingService) handleInternalBookingStatusUpdate(w http.ResponseWriter, r *http.Request, id int64) {
	var req internalBookingStatusUpdateRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	req.Status = bookingStatus(strings.ToUpper(strings.TrimSpace(string(req.Status))))
	if !isValidBookingStatus(req.Status) {
		writeAPIError(w, http.StatusBadRequest, "Недопустимый статус бронирования")
		return
	}
	cancelReason := strings.TrimSpace(req.CancellationReason)

	updated, err := s.store.update(id, func(rec *bookingRecord) error {
		if !canTransitionStatus(rec.Status, req.Status) {
			if rec.Status == bookingStatusCompleted || rec.Status == bookingStatusCancelled || rec.Status == bookingStatusRejected {
				return strconv.ErrSyntax
			}
			return strconv.ErrRange
		}
		rec.Status = req.Status
		if req.Status == bookingStatusCancelled && cancelReason != "" {
			rec.CancellationReason = cancelReason
		}
		return nil
	})
	if err != nil {
		if err == errNotFound {
			writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
			return
		}
		if err == strconv.ErrSyntax {
			writeAPIError(w, http.StatusConflict, "Нельзя изменить статус завершенного бронирования")
			return
		}
		if err == strconv.ErrRange {
			writeAPIError(w, http.StatusBadRequest, "Недопустимый переход статуса")
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "Не удалось обновить статус")
		return
	}
	s.publishBookingStatusEvent(*updated)

	httputil.WriteJSON(w, http.StatusOK, toBookingResponse(*updated))
}

func (s *bookingService) handleInternalBookingsByProperty(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	propertyID, ok := parseInternalID(strings.TrimPrefix(r.URL.Path, "/internal"), "/bookings/by-property/")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный propertyId")
		return
	}

	startDate, startSet, err := parseRFC3339Query(r, "startDate")
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный startDate")
		return
	}
	endDate, endSet, err := parseRFC3339Query(r, "endDate")
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный endDate")
		return
	}
	statuses := parseStatusList(r.URL.Query().Get("status"))
	limit := parseIntLimit(r.URL.Query().Get("limit"), 100, 1, 1000)

	params := bookingListParams{
		PropertyID: &propertyID,
		Statuses:   statusMapToSlice(statuses),
		Page:       1,
		PageSize:   limit,
	}
	if startSet {
		params.OverlapFrom = &startDate
	}
	if endSet {
		params.OverlapTo = &endDate
	}

	bookings, _, err := s.store.listPage(params)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить бронирования")
		return
	}

	rows := make([]map[string]any, 0, len(bookings))
	for _, rec := range bookings {
		rows = append(rows, map[string]any{
			"id":         rec.ID,
			"startDate":  rec.StartDate.Format(time.RFC3339),
			"endDate":    rec.EndDate.Format(time.RFC3339),
			"status":     rec.Status,
			"occupierId": rec.OccupierID,
		})
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"bookings": rows,
		"total":    len(rows),
	})
}

func (s *bookingService) handleInternalBookingsByUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	userID, ok := parseInternalID(strings.TrimPrefix(r.URL.Path, "/internal"), "/bookings/by-user/")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный userId")
		return
	}

	role := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("role")))
	if role == "" {
		role = "OCCUPIER"
	}
	if role != "OCCUPIER" && role != "OWNER" {
		writeAPIError(w, http.StatusBadRequest, "Некорректный role")
		return
	}
	statuses := parseStatusList(r.URL.Query().Get("status"))
	limit := parseIntLimit(r.URL.Query().Get("limit"), 100, 1, 1000)

	params := bookingListParams{
		Statuses: statusMapToSlice(statuses),
		Page:     1,
		PageSize: limit,
	}
	if role == "OCCUPIER" {
		params.OccupierID = &userID
	} else {
		params.OwnerID = &userID
	}

	bookings, _, err := s.store.listPage(params)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить бронирования")
		return
	}

	rows := make([]map[string]any, 0, len(bookings))
	for _, rec := range bookings {
		rows = append(rows, map[string]any{
			"id":         rec.ID,
			"propertyId": rec.PropertyID,
			"startDate":  rec.StartDate.Format(time.RFC3339),
			"endDate":    rec.EndDate.Format(time.RFC3339),
			"status":     rec.Status,
		})
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"bookings": rows,
		"total":    len(rows),
	})
}

func (s *bookingService) handleInternalValidateReviewEligibility(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	var req internalReviewEligibilityRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}
	if req.BookingID <= 0 || req.UserID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "bookingId и userId обязательны")
		return
	}

	rec, exists := s.store.get(req.BookingID)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
		return
	}

	if rec.OccupierID != req.UserID && rec.PropertyOwnerID != req.UserID {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"canReview":     false,
			"reason":        "User is not a booking participant",
			"bookingStatus": rec.Status,
		})
		return
	}

	if rec.Status != bookingStatusCompleted {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"canReview":     false,
			"reason":        "Booking not completed yet",
			"bookingStatus": rec.Status,
		})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"canReview":     true,
		"reason":        "Booking completed",
		"bookingStatus": rec.Status,
		"completedAt":   rec.EndDate.Format(time.RFC3339),
	})
}

func validateServiceToken(r *http.Request, expected string) bool {
	token := strings.TrimSpace(r.Header.Get("X-Service-Token"))
	return token != "" && token == strings.TrimSpace(expected)
}

func parseInternalID(path string, prefix string) (int64, bool) {
	part := strings.TrimPrefix(path, prefix)
	part = strings.Trim(strings.TrimSpace(part), "/")
	if part == "" || strings.Contains(part, "/") {
		return 0, false
	}
	id, err := strconv.ParseInt(part, 10, 64)
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}

func parseStatusList(raw string) map[bookingStatus]struct{} {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil
	}
	parts := strings.Split(trimmed, ",")
	result := make(map[bookingStatus]struct{})
	for _, part := range parts {
		status := bookingStatus(strings.ToUpper(strings.TrimSpace(part)))
		if isValidBookingStatus(status) {
			result[status] = struct{}{}
		}
	}
	return result
}

func statusMapToSlice(values map[bookingStatus]struct{}) []bookingStatus {
	if len(values) == 0 {
		return nil
	}
	out := make([]bookingStatus, 0, len(values))
	for status := range values {
		out = append(out, status)
	}
	return out
}

func parseRFC3339Query(r *http.Request, key string) (time.Time, bool, error) {
	raw := strings.TrimSpace(r.URL.Query().Get(key))
	if raw == "" {
		return time.Time{}, false, nil
	}
	value, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		return time.Time{}, false, err
	}
	return value.UTC(), true, nil
}

func parseIntLimit(raw string, fallback int, minValue int, maxValue int) int {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return fallback
	}
	value, err := strconv.Atoi(trimmed)
	if err != nil {
		return fallback
	}
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}
