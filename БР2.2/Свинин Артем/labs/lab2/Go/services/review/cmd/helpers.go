package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
	"rental-platform/pkg/shared/pagination"
)

var writeAPIError = httputil.WriteError
var writeMethodNotAllowed = httputil.WriteMethodNotAllowed
var parsePositiveIntQuery = httputil.ParsePositiveIntQuery
var parseBearerToken = httputil.ParseBearerToken
var parseReviewPathID = func(path string) (int64, error) {
	return httputil.ParsePathID(path, "reviews")
}
var parseOptionalInt64Query = httputil.ParseOptionalInt64

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
		return ":8086"
	}
	if strings.HasPrefix(p, ":") {
		return p
	}
	return ":" + p
}

func parseOptionalTargetType(values map[string][]string, key string) (*reviewTargetType, bool) {
	raw := strings.TrimSpace(firstQueryValue(values, key))
	if raw == "" {
		return nil, true
	}
	targetType := reviewTargetType(strings.ToUpper(raw))
	if !isValidReviewTargetType(targetType) {
		return nil, false
	}
	return &targetType, true
}

func firstQueryValue(values map[string][]string, key string) string {
	list := values[key]
	if len(list) == 0 {
		return ""
	}
	return list[0]
}

func parseCreateReviewRequest(r *http.Request) (reviewCreateRequest, error) {
	var req reviewCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return reviewCreateRequest{}, errors.New("Некорректный JSON")
	}

	if req.BookingID <= 0 {
		return reviewCreateRequest{}, errors.New("Поле bookingId обязательно")
	}

	req.TargetType = reviewTargetType(strings.ToUpper(strings.TrimSpace(string(req.TargetType))))
	if !isValidReviewTargetType(req.TargetType) {
		return reviewCreateRequest{}, errors.New("Недопустимый targetType")
	}

	if req.Rating < 1 || req.Rating > 5 {
		return reviewCreateRequest{}, errors.New("Рейтинг должен быть от 1 до 5")
	}

	req.Comment = strings.TrimSpace(req.Comment)
	if req.Comment != "" {
		if len(req.Comment) < 10 {
			return reviewCreateRequest{}, errors.New("Комментарий должен быть не короче 10 символов")
		}
		if len(req.Comment) > 2000 {
			return reviewCreateRequest{}, errors.New("Комментарий слишком длинный")
		}
	}

	if req.PropertyID < 0 {
		return reviewCreateRequest{}, errors.New("Некорректный propertyId")
	}

	return req, nil
}

func parseRespondReviewRequest(r *http.Request) (reviewRespondRequest, error) {
	var req reviewRespondRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return reviewRespondRequest{}, errors.New("Некорректный JSON")
	}

	req.ResponseText = strings.TrimSpace(req.ResponseText)
	if req.ResponseText == "" {
		return reviewRespondRequest{}, errors.New("Поле responseText обязательно")
	}
	if len(req.ResponseText) > 2000 {
		return reviewRespondRequest{}, errors.New("Ответ слишком длинный")
	}

	return req, nil
}

func isValidReviewTargetType(targetType reviewTargetType) bool {
	switch targetType {
	case reviewTargetTypeProperty, reviewTargetTypeOwner, reviewTargetTypeOccupier:
		return true
	default:
		return false
	}
}

func isAdmin(p principal) bool {
	return strings.EqualFold(p.Role, "ADMIN")
}

func canCreateReviewForTarget(reviewerID int64, booking bookingResponse, property propertyResponse, targetType reviewTargetType) bool {
	isOccupier := reviewerID == booking.OccupierID
	isOwner := reviewerID == property.OwnerID

	switch targetType {
	case reviewTargetTypeProperty, reviewTargetTypeOwner:
		return isOccupier
	case reviewTargetTypeOccupier:
		return isOwner
	default:
		return false
	}
}

func toReviewResponse(rec reviewRecord) reviewResponse {
	response := reviewResponse{
		ID:         rec.ID,
		BookingID:  rec.BookingID,
		PropertyID: rec.PropertyID,
		ReviewerID: rec.ReviewerID,
		TargetType: rec.TargetType,
		Rating:     rec.Rating,
		Comment:    rec.Comment,
		CreatedAt:  rec.CreatedAt.Format(time.RFC3339),
	}

	if rec.ResponseText != "" {
		response.ResponseText = rec.ResponseText
	}
	if rec.ResponseDate != nil {
		response.ResponseDate = rec.ResponseDate.UTC().Format(time.RFC3339)
	}

	return response
}

func sortReviewsNewest(items []reviewRecord) {
	sort.Slice(items, func(i int, j int) bool {
		if items[i].CreatedAt.Equal(items[j].CreatedAt) {
			return items[i].ID > items[j].ID
		}
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})
}

func paginateReviews(items []reviewRecord, page int, pageSize int) ([]reviewRecord, int) {
	return pagination.Paginate(items, page, pageSize)
}
