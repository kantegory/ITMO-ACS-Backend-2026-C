package main

import (
	"net/http"
	"strconv"
	"strings"

	"rental-platform/pkg/shared/httputil"
)

type internalCanCreateReviewRequest struct {
	BookingID  int64            `json:"bookingId"`
	UserID     int64            `json:"userId"`
	TargetType reviewTargetType `json:"targetType"`
}

func (s *reviewService) handleInternalCanCreate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	var req internalCanCreateReviewRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}
	if req.BookingID <= 0 || req.UserID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "bookingId и userId обязательны")
		return
	}
	req.TargetType = reviewTargetType(strings.ToUpper(strings.TrimSpace(string(req.TargetType))))
	if !isValidReviewTargetType(req.TargetType) {
		writeAPIError(w, http.StatusBadRequest, "Недопустимый targetType")
		return
	}

	booking, status, msg := s.booking.getByIDInternal(req.BookingID, s.serviceToken)
	if status != http.StatusOK {
		writeAPIError(w, status, msg)
		return
	}

	if !canCreateReviewByRole(req.UserID, *booking, req.TargetType) {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"canCreate": false,
			"reason":    "Недостаточно прав для выбранного типа отзыва",
		})
		return
	}

	if strings.ToUpper(strings.TrimSpace(booking.Status)) != "COMPLETED" {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"canCreate": false,
			"reason":    "Booking not completed yet",
		})
		return
	}

	if existingID, exists := s.findDuplicateReview(req.BookingID, req.UserID, req.TargetType); exists {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"canCreate":        false,
			"reason":           "Review already exists",
			"existingReviewId": existingID,
		})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"canCreate": true,
		"reason":    "Booking completed, no existing review",
	})
}

func (s *reviewService) handleInternalPropertyRating(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	propertyID, ok := parseInternalID(r.URL.Path, "/internal/reviews/property-rating/")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный propertyId")
		return
	}

	reviews := s.store.list(func(rec *reviewRecord) bool {
		return rec.PropertyID == propertyID && rec.TargetType == reviewTargetTypeProperty
	})
	distribution := map[string]int{"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
	total := len(reviews)
	ratingSum := 0
	for _, rec := range reviews {
		ratingSum += rec.Rating
		if rec.Rating >= 1 && rec.Rating <= 5 {
			key := strconv.Itoa(rec.Rating)
			distribution[key] = distribution[key] + 1
		}
	}

	average := 0.0
	if total > 0 {
		average = float64(ratingSum) / float64(total)
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"propertyId":         propertyID,
		"averageRating":      average,
		"totalReviews":       total,
		"ratingDistribution": distribution,
	})
}

func (s *reviewService) handleInternalUserRating(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	userID, ok := parseInternalID(r.URL.Path, "/internal/reviews/user-rating/")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный userId")
		return
	}

	target := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("targetType")))
	if target == "" {
		target = string(reviewTargetTypeOwner)
	}
	if target != string(reviewTargetTypeOwner) && target != string(reviewTargetTypeOccupier) {
		writeAPIError(w, http.StatusBadRequest, "Некорректный targetType")
		return
	}

	reviews := s.store.list(func(rec *reviewRecord) bool {
		if target == string(reviewTargetTypeOwner) {
			return rec.TargetType == reviewTargetTypeOwner && rec.PropertyOwnerID == userID
		}
		return rec.TargetType == reviewTargetTypeOccupier && rec.OccupierID == userID
	})

	total := len(reviews)
	ratingSum := 0
	for _, rec := range reviews {
		ratingSum += rec.Rating
	}
	average := 0.0
	if total > 0 {
		average = float64(ratingSum) / float64(total)
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"userId":        userID,
		"targetType":    target,
		"averageRating": average,
		"totalReviews":  total,
	})
}

func (s *reviewService) handleInternalReviewsByBooking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	bookingID, ok := parseInternalID(r.URL.Path, "/internal/reviews/by-booking/")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный bookingId")
		return
	}

	_, status, msg := s.booking.getByIDInternal(bookingID, s.serviceToken)
	if status != http.StatusOK {
		writeAPIError(w, status, msg)
		return
	}

	reviews := s.store.list(func(rec *reviewRecord) bool {
		return rec.BookingID == bookingID
	})
	items := make([]map[string]any, 0, len(reviews))
	for _, rec := range reviews {
		items = append(items, map[string]any{
			"id":         rec.ID,
			"targetType": rec.TargetType,
			"rating":     rec.Rating,
			"reviewerId": rec.ReviewerID,
			"createdAt":  rec.CreatedAt.Format(timeLayoutRFC3339()),
		})
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"reviews": items})
}

func findTargetByRole(target reviewTargetType) string {
	if target == reviewTargetTypeOccupier {
		return "OWNER"
	}
	return "OCCUPIER"
}

func canCreateReviewByRole(userID int64, booking bookingResponse, target reviewTargetType) bool {
	reviewerRole := findTargetByRole(target)
	if reviewerRole == "OWNER" {
		return userID == booking.OwnerID
	}
	return userID == booking.OccupierID
}

func (s *reviewService) findDuplicateReview(bookingID int64, reviewerID int64, targetType reviewTargetType) (int64, bool) {
	reviews := s.store.list(func(rec *reviewRecord) bool {
		return rec.BookingID == bookingID && rec.ReviewerID == reviewerID && rec.TargetType == targetType
	})
	if len(reviews) == 0 {
		return 0, false
	}
	return reviews[0].ID, true
}

func validateServiceToken(r *http.Request, expected string) bool {
	token := strings.TrimSpace(r.Header.Get("X-Service-Token"))
	return token != "" && token == strings.TrimSpace(expected)
}

func parseInternalID(path string, prefix string) (int64, bool) {
	part := strings.TrimPrefix(strings.TrimSpace(path), prefix)
	part = strings.Trim(part, "/")
	if part == "" || strings.Contains(part, "/") {
		return 0, false
	}
	id, err := strconv.ParseInt(part, 10, 64)
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}

func timeLayoutRFC3339() string {
	return "2006-01-02T15:04:05Z07:00"
}
