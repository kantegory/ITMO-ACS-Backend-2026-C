package main

import (
	"net/http"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
)

func (s *reviewService) handleReviews(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		s.handleCreateReview(w, r)
	case http.MethodGet:
		s.handleListReviews(w, r)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *reviewService) handleReviewByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseReviewPathID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	review, ok := s.store.get(id)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Отзыв не найден")
		return
	}

	switch r.Method {
	case http.MethodGet:
		httputil.WriteJSON(w, http.StatusOK, toReviewResponse(*review))
	case http.MethodPatch:
		s.handleRespondToReview(w, r, review)
	case http.MethodDelete:
		s.handleDeleteReview(w, r, review)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *reviewService) handleCreateReview(w http.ResponseWriter, r *http.Request) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	req, err := parseCreateReviewRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	booking, code, msg := s.booking.getByID(req.BookingID, token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}
	if !strings.EqualFold(strings.TrimSpace(booking.Status), "COMPLETED") {
		writeAPIError(w, http.StatusForbidden, "Отзыв можно оставить только после завершения бронирования")
		return
	}

	propertyID := req.PropertyID
	if propertyID == 0 {
		propertyID = booking.PropertyID
	}
	if propertyID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "Не удалось определить propertyId")
		return
	}
	if booking.PropertyID > 0 && propertyID != booking.PropertyID {
		writeAPIError(w, http.StatusBadRequest, "propertyId не соответствует бронированию")
		return
	}

	property, code, msg := s.property.getByID(propertyID)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	if actor.UserID != booking.OccupierID && actor.UserID != property.OwnerID && !isAdmin(actor) {
		writeAPIError(w, http.StatusForbidden, "Недостаточно прав")
		return
	}

	if !isAdmin(actor) && !canCreateReviewForTarget(actor.UserID, *booking, *property, req.TargetType) {
		writeAPIError(w, http.StatusForbidden, "Недостаточно прав")
		return
	}

	if s.store.hasDuplicate(req.BookingID, actor.UserID, req.TargetType) {
		writeAPIError(w, http.StatusConflict, "Отзыв на это бронирование уже существует")
		return
	}

	created := s.store.create(reviewRecord{
		BookingID:       req.BookingID,
		PropertyID:      propertyID,
		ReviewerID:      actor.UserID,
		PropertyOwnerID: property.OwnerID,
		OccupierID:      booking.OccupierID,
		TargetType:      req.TargetType,
		Rating:          req.Rating,
		Comment:         req.Comment,
	})
	if created == nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось создать отзыв")
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, toReviewResponse(*created))
}

func (s *reviewService) handleListReviews(w http.ResponseWriter, r *http.Request) {
	propertyIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "propertyId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр propertyId")
		return
	}
	reviewerIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "reviewerId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр reviewerId")
		return
	}
	targetTypeFilter, ok := parseOptionalTargetType(r.URL.Query(), "targetType")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр targetType")
		return
	}
	page, ok := parsePositiveIntQuery(r.URL.Query(), "page", 1)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр page")
		return
	}
	pageSize, ok := parsePositiveIntQuery(r.URL.Query(), "pageSize", 10)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр pageSize")
		return
	}

	items, total, err := s.store.listPage(reviewListParams{
		PropertyID: propertyIDFilter,
		ReviewerID: reviewerIDFilter,
		TargetType: targetTypeFilter,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список отзывов")
		return
	}

	responseItems := make([]reviewResponse, 0, len(items))
	for _, item := range items {
		responseItems = append(responseItems, toReviewResponse(item))
	}

	httputil.WriteJSON(w, http.StatusOK, paginatedReviewsResponse{
		Items:    responseItems,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (s *reviewService) handleRespondToReview(w http.ResponseWriter, r *http.Request, rec *reviewRecord) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	if !isAdmin(actor) && actor.UserID != rec.PropertyOwnerID {
		writeAPIError(w, http.StatusForbidden, "Только владелец объекта может ответить на отзыв")
		return
	}

	if strings.TrimSpace(rec.ResponseText) != "" {
		writeAPIError(w, http.StatusConflict, "Ответ на этот отзыв уже существует")
		return
	}

	req, err := parseRespondReviewRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := s.store.update(rec.ID, func(target *reviewRecord) error {
		now := time.Now().UTC()
		target.ResponseText = req.ResponseText
		target.ResponseDate = &now
		return nil
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось обновить отзыв")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, toReviewResponse(*updated))
}

func (s *reviewService) handleDeleteReview(w http.ResponseWriter, r *http.Request, rec *reviewRecord) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	if !isAdmin(actor) && actor.UserID != rec.ReviewerID {
		writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
		return
	}

	if !s.store.delete(rec.ID) {
		writeAPIError(w, http.StatusNotFound, "Отзыв не найден")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
