package main

import (
	"errors"
	"net/http"
	"strings"

	"rental-platform/pkg/shared/httputil"
)

func (s *paymentService) handleTransactions(w http.ResponseWriter, r *http.Request) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	switch r.Method {
	case http.MethodPost:
		s.handleCreateTransaction(w, r, actor, token)
	case http.MethodGet:
		s.handleListTransactions(w, r, actor)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *paymentService) handleTransactionByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseTransactionPathID(r.URL.Path)
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
		writeAPIError(w, http.StatusNotFound, "Транзакция не найдена")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if !isAdmin(actor) && rec.CreatedBy != actor.UserID {
			writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
			return
		}
		httputil.WriteJSON(w, http.StatusOK, toTransactionResponse(*rec))
	case http.MethodPatch:
		if !isAdmin(actor) && rec.CreatedBy != actor.UserID {
			writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
			return
		}
		s.handleUpdateTransaction(w, r, rec)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *paymentService) handleCreateTransaction(w http.ResponseWriter, r *http.Request, actor principal, accessToken string) {
	req, err := parseCreateTransactionRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	if _, code, msg := s.booking.getByID(req.BookingID, accessToken); code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	if s.store.hasActiveByBooking(req.BookingID) {
		writeAPIError(w, http.StatusConflict, "Бронирование уже оплачено")
		return
	}

	created := s.store.create(transactionRecord{
		BookingID:     req.BookingID,
		PaymentMethod: req.PaymentMethod,
		Status:        transactionStatusPending,
		PaymentID:     generatePaymentID(),
		Currency:      req.Currency,
		Amount:        req.Amount,
		FeeAmount:     calculateFee(req.Amount),
		CreatedBy:     actor.UserID,
	})
	if created == nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось создать транзакцию")
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, toTransactionResponse(*created))
}

func (s *paymentService) handleListTransactions(w http.ResponseWriter, r *http.Request, actor principal) {
	if !isAdmin(actor) {
		writeAPIError(w, http.StatusForbidden, "Недостаточно прав")
		return
	}

	bookingIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "bookingId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр bookingId")
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

	items, total, err := s.store.listPage(transactionListParams{
		BookingID: bookingIDFilter,
		Status:    statusFilter,
		StartDate: startDateFilter,
		EndDate:   endDateFilter,
		Page:      page,
		PageSize:  pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список транзакций")
		return
	}

	responses := make([]transactionResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, toTransactionResponse(item))
	}

	httputil.WriteJSON(w, http.StatusOK, paginatedTransactionsResponse{
		Items:    responses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (s *paymentService) handleUpdateTransaction(w http.ResponseWriter, r *http.Request, rec *transactionRecord) {
	req, err := parseUpdateTransactionRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, statusCode, message := s.applyTransactionStatusUpdate(rec.ID, *req.Status, req.RefundedAmount)
	if statusCode != http.StatusOK {
		writeAPIError(w, statusCode, message)
		return
	}

	httputil.WriteJSON(w, http.StatusOK, toTransactionResponse(*updated))
}

func (s *paymentService) applyTransactionStatusUpdate(transactionID int64, targetStatus transactionStatus, refundedAmount *float64) (*transactionRecord, int, string) {
	updated, err := s.store.update(transactionID, func(target *transactionRecord) error {
		if !canTransitionTransactionStatus(target.Status, targetStatus) {
			return errors.New("Нельзя изменить статус успешной транзакции")
		}

		target.Status = targetStatus
		if targetStatus == transactionStatusRefunded {
			amount := target.Amount
			if refundedAmount != nil {
				amount = *refundedAmount
			}
			if amount <= 0 {
				return errors.New("Сумма возврата должна быть положительной")
			}
			if amount > target.Amount {
				return errors.New("Сумма возврата не может превышать сумму транзакции")
			}
			target.RefundedAmount = &amount
		}

		return nil
	})
	if err != nil {
		if errors.Is(err, errNotFound) {
			return nil, http.StatusNotFound, "Транзакция не найдена"
		}
		message := err.Error()
		switch {
		case strings.Contains(message, "Нельзя изменить статус"):
			return nil, http.StatusConflict, message
		default:
			return nil, http.StatusBadRequest, message
		}
	}
	s.publishPaymentStatusEvent(*updated)

	return updated, http.StatusOK, ""
}
