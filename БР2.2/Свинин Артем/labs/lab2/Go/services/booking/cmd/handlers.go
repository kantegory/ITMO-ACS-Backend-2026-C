package main

import (
	"errors"
	"net/http"
	"strings"

	"rental-platform/pkg/shared/httputil"
)

func (s *bookingService) handleBookings(w http.ResponseWriter, r *http.Request) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	switch r.Method {
	case http.MethodPost:
		s.handleCreateBooking(w, r, actor)
	case http.MethodGet:
		s.handleListBookings(w, r, actor)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *bookingService) handleMyBookings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	actor, ok := s.authenticateRequest(w, r)
	if !ok {
		return
	}

	statusFilter, ok := parseOptionalStatusQuery(r.URL.Query(), "status")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный статус")
		return
	}
	page, pageSize, pageErr := parsePageParams(r)
	if pageErr != "" {
		writeAPIError(w, http.StatusBadRequest, pageErr)
		return
	}

	items, total, err := s.store.listPage(bookingListParams{
		Status:     statusFilter,
		OccupierID: &actor.UserID,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список бронирований")
		return
	}

	writeBookingsPage(w, items, total, page, pageSize)
}

func (s *bookingService) handleIncomingBookings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	actor, ok := s.authenticateRequest(w, r)
	if !ok {
		return
	}

	propertyIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "propertyId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр propertyId")
		return
	}
	statusFilter, ok := parseOptionalStatusQuery(r.URL.Query(), "status")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный статус")
		return
	}
	page, pageSize, pageErr := parsePageParams(r)
	if pageErr != "" {
		writeAPIError(w, http.StatusBadRequest, pageErr)
		return
	}

	items, total, err := s.store.listPage(bookingListParams{
		PropertyID: propertyIDFilter,
		Status:     statusFilter,
		OwnerID:    &actor.UserID,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список бронирований")
		return
	}

	writeBookingsPage(w, items, total, page, pageSize)
}

func (s *bookingService) handleBookingByID(w http.ResponseWriter, r *http.Request) {
	id, err := parsePathID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	rec, ok := s.store.get(id)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if !isAdmin(actor) && !isParticipant(actor, rec) {
			writeAPIError(w, http.StatusForbidden, "Доступ только для владельца или арендатора")
			return
		}
		httputil.WriteJSON(w, http.StatusOK, toBookingResponse(*rec))
	case http.MethodPatch:
		s.handleUpdateBooking(w, r, actor, rec)
	case http.MethodDelete:
		s.handleDeleteBooking(w, actor, rec)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *bookingService) handleCreateBooking(w http.ResponseWriter, r *http.Request, actor principal) {
	req, startDate, endDate, err := parseCreateBookingRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	property, code, msg := s.property.getByID(req.PropertyID)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}
	if !property.IsAvailable {
		writeAPIError(w, http.StatusConflict, "Объект временно недоступен для бронирования")
		return
	}
	if property.MaxGuests > 0 && req.GuestsCount > property.MaxGuests {
		writeAPIError(w, http.StatusBadRequest, "Превышено максимальное количество гостей")
		return
	}
	if s.store.hasDateConflict(req.PropertyID, startDate, endDate, 0) {
		writeAPIError(w, http.StatusConflict, "Объект недоступен в выбранные даты")
		return
	}

	city := ""
	if property.Address != nil {
		city = strings.TrimSpace(property.Address.City)
	}

	created := s.store.create(bookingRecord{
		PropertyID:      req.PropertyID,
		PropertyOwnerID: property.OwnerID,
		PropertyTitle:   strings.TrimSpace(property.Title),
		PropertyCity:    city,
		OccupierID:      actor.UserID,
		StartDate:       startDate,
		EndDate:         endDate,
		TotalPrice:      calcTotalPrice(startDate, endDate, property.PricePerDay),
		Status:          bookingStatusPending,
		GuestsCount:     req.GuestsCount,
		SpecialRequest:  req.SpecialRequest,
	})
	if created == nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось создать бронирование")
		return
	}
	s.publishBookingCreated(*created)

	httputil.WriteJSON(w, http.StatusCreated, toBookingResponse(*created))
}

func (s *bookingService) handleListBookings(w http.ResponseWriter, r *http.Request, actor principal) {
	if !isAdmin(actor) {
		writeAPIError(w, http.StatusForbidden, "Недостаточно прав")
		return
	}

	propertyIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "propertyId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр propertyId")
		return
	}
	statusFilter, ok := parseOptionalStatusQuery(r.URL.Query(), "status")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный статус")
		return
	}
	startDateFilter, ok := parseOptionalDateQuery(r.URL.Query(), "startDate")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр startDate")
		return
	}
	endDateFilter, ok := parseOptionalDateQuery(r.URL.Query(), "endDate")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр endDate")
		return
	}
	page, pageSize, pageErr := parsePageParams(r)
	if pageErr != "" {
		writeAPIError(w, http.StatusBadRequest, pageErr)
		return
	}

	items, total, err := s.store.listPage(bookingListParams{
		PropertyID: propertyIDFilter,
		Status:     statusFilter,
		StartDate:  startDateFilter,
		EndDate:    endDateFilter,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список бронирований")
		return
	}

	writeBookingsPage(w, items, total, page, pageSize)
}

func (s *bookingService) handleUpdateBooking(w http.ResponseWriter, r *http.Request, actor principal, rec *bookingRecord) {
	if !isAdmin(actor) && !isParticipant(actor, rec) {
		writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
		return
	}

	request, err := parseUpdateBookingRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := s.store.update(rec.ID, func(target *bookingRecord) error {
		if request.Status != nil {
			if !canTransitionStatus(target.Status, *request.Status) {
				return errors.New("Нельзя изменить статус бронирования")
			}
			if !canActorSetStatus(actor, target, *request.Status) {
				return errors.New("Недостаточно прав для изменения статуса")
			}
			target.Status = *request.Status
		}

		if request.SpecialRequest != nil {
			if !isAdmin(actor) && actor.UserID != target.OccupierID {
				return errors.New("Только арендатор может менять specialRequest")
			}
			target.SpecialRequest = *request.SpecialRequest
		}

		if request.CancellationReason != nil {
			if request.Status == nil && target.Status != bookingStatusCancelled {
				return errors.New("Причину отмены можно задать только для отмененного бронирования")
			}
			if request.Status != nil && *request.Status != bookingStatusCancelled {
				return errors.New("Причина отмены допустима только со статусом CANCELLED")
			}
			target.CancellationReason = *request.CancellationReason
		}

		return nil
	})
	if err != nil {
		if errors.Is(err, errNotFound) {
			writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
			return
		}
		message := err.Error()
		switch {
		case strings.Contains(message, "Нельзя изменить статус"):
			writeAPIError(w, http.StatusConflict, message)
		case strings.Contains(message, "Недостаточно прав") || strings.Contains(message, "Только арендатор"):
			writeAPIError(w, http.StatusForbidden, message)
		default:
			writeAPIError(w, http.StatusBadRequest, message)
		}
		return
	}
	s.publishBookingStatusEvent(*updated)

	httputil.WriteJSON(w, http.StatusOK, toBookingResponse(*updated))
}

func (s *bookingService) handleDeleteBooking(w http.ResponseWriter, actor principal, rec *bookingRecord) {
	if !isAdmin(actor) && actor.UserID != rec.PropertyOwnerID {
		writeAPIError(w, http.StatusForbidden, "Удалять бронирование может только владелец или админ")
		return
	}

	if !s.store.delete(rec.ID) {
		writeAPIError(w, http.StatusNotFound, "Бронирование не найдено")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeBookingsPage(w http.ResponseWriter, items []bookingRecord, total int, page int, pageSize int) {
	responses := make([]bookingResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, toBookingResponse(item))
	}

	httputil.WriteJSON(w, http.StatusOK, paginatedBookingsResponse{
		Items:    responses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (s *bookingService) authenticateRequest(w http.ResponseWriter, r *http.Request) (principal, bool) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return principal{}, false
	}
	return actor, true
}

func parsePageParams(r *http.Request) (int, int, string) {
	page, ok := parsePositiveIntQuery(r.URL.Query(), "page", 1)
	if !ok {
		return 0, 0, "Некорректный параметр page"
	}
	pageSize, ok := parsePositiveIntQuery(r.URL.Query(), "pageSize", 10)
	if !ok {
		return 0, 0, "Некорректный параметр pageSize"
	}
	return page, pageSize, ""
}
