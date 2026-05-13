package main

import (
	"errors"
	"net/http"

	"rental-platform/pkg/shared/httputil"
)

func (s *paymentService) handleInternalTransactionsByBooking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	bookingID, err := parseInternalByBookingPathID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	items := s.store.list(func(rec *transactionRecord) bool {
		return rec.BookingID == bookingID
	})
	sortTransactionsNewest(items)

	transactions := make([]transactionResponse, 0, len(items))
	totalAmount := 0.0
	paidAmount := 0.0
	refundedAmount := 0.0

	for _, item := range items {
		transactions = append(transactions, toTransactionResponse(item))
		totalAmount += item.Amount
		if item.Status == transactionStatusSuccess {
			paidAmount += item.Amount
		}
		if item.RefundedAmount != nil {
			refundedAmount += *item.RefundedAmount
		}
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"transactions":   transactions,
		"totalAmount":    totalAmount,
		"paidAmount":     paidAmount,
		"refundedAmount": refundedAmount,
	})
}

func (s *paymentService) handleInternalTransactions(w http.ResponseWriter, r *http.Request) {
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	id, isStatusPath, err := parseInternalTransactionPath(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	rec, ok := s.store.get(id)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Транзакция не найдена")
		return
	}

	if isStatusPath {
		if r.Method != http.MethodPatch {
			writeMethodNotAllowed(w)
			return
		}
		s.handleInternalUpdateTransactionStatus(w, r, rec)
		return
	}

	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	httputil.WriteJSON(w, http.StatusOK, toTransactionResponse(*rec))
}

func (s *paymentService) handleInternalUpdateTransactionStatus(w http.ResponseWriter, r *http.Request, rec *transactionRecord) {
	req, err := parseInternalStatusUpdateRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, statusCode, message := s.applyTransactionStatusUpdate(rec.ID, *req.Status, nil)
	if statusCode != http.StatusOK {
		writeAPIError(w, statusCode, message)
		return
	}

	if req.PaymentGatewayResponse != nil && req.PaymentGatewayResponse.GatewayTransactionID != "" {
		updated, err = s.store.update(rec.ID, func(target *transactionRecord) error {
			target.PaymentID = req.PaymentGatewayResponse.GatewayTransactionID
			return nil
		})
		if err != nil {
			if errors.Is(err, errNotFound) {
				writeAPIError(w, http.StatusNotFound, "Транзакция не найдена")
				return
			}
			writeAPIError(w, http.StatusInternalServerError, "Не удалось обновить транзакцию")
			return
		}
	}

	httputil.WriteJSON(w, http.StatusOK, toTransactionResponse(*updated))
}

func (s *paymentService) handleInternalWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	req, err := parsePaymentWebhookRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	var rec *transactionRecord
	if req.TransactionID != nil && *req.TransactionID > 0 {
		candidate, ok := s.store.get(*req.TransactionID)
		if !ok {
			writeAPIError(w, http.StatusNotFound, "Транзакция не найдена")
			return
		}
		rec = candidate
	} else {
		candidate, ok := s.store.findByPaymentID(req.PaymentID)
		if !ok {
			writeAPIError(w, http.StatusNotFound, "Транзакция не найдена")
			return
		}
		rec = candidate
	}

	updated, statusCode, message := s.applyTransactionStatusUpdate(rec.ID, transactionStatus(req.Status), nil)
	if statusCode != http.StatusOK {
		writeAPIError(w, statusCode, message)
		return
	}

	if updated.PaymentID != req.PaymentID {
		updated, err = s.store.update(rec.ID, func(target *transactionRecord) error {
			target.PaymentID = req.PaymentID
			return nil
		})
		if err != nil {
			if errors.Is(err, errNotFound) {
				writeAPIError(w, http.StatusNotFound, "Транзакция не найдена")
				return
			}
			writeAPIError(w, http.StatusInternalServerError, "Не удалось обновить транзакцию")
			return
		}
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"acknowledged":  true,
		"transactionId": updated.ID,
		"newStatus":     updated.Status,
	})
}
