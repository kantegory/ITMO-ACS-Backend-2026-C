package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"rental-platform/pkg/shared/httputil"
	"rental-platform/pkg/shared/pagination"
)

var writeAPIError = httputil.WriteError
var writeMethodNotAllowed = httputil.WriteMethodNotAllowed
var parsePositiveIntQuery = httputil.ParsePositiveIntQuery
var parseBearerToken = httputil.ParseBearerToken
var parsePathID = func(path string) (int64, error) {
	return httputil.ParsePathID(path, "transactions")
}
var parseOptionalInt64Query = httputil.ParseOptionalInt64
var parseOptionalDateQuery = httputil.ParseOptionalTime

var (
	currencyCodeRegex = regexp.MustCompile(`^[A-Z]{3}$`)
	paymentIDCounter  int64
)

func getenv(key string, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}

func normalizePort(port string) string {
	p := strings.TrimSpace(port)
	if p == "" {
		return ":8085"
	}
	if strings.HasPrefix(p, ":") {
		return p
	}
	return ":" + p
}

func parseTransactionPathID(path string) (int64, error) {
	trimmed := strings.Trim(path, "/")
	parts := strings.Split(trimmed, "/")
	if len(parts) != 2 || parts[0] != "transactions" {
		return 0, errors.New("invalid path")
	}
	id, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}

func validateServiceToken(r *http.Request, expected string) bool {
	given := strings.TrimSpace(r.Header.Get("X-Service-Token"))
	if given == "" {
		return false
	}
	return given == strings.TrimSpace(expected)
}

func parseInternalByBookingPathID(path string) (int64, error) {
	prefix := "/internal/payments/transactions/by-booking/"
	if !strings.HasPrefix(path, prefix) {
		return 0, errors.New("invalid path")
	}
	rawID := strings.TrimSpace(strings.Trim(path[len(prefix):], "/"))
	id, err := strconv.ParseInt(rawID, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid booking id")
	}
	return id, nil
}

func parseInternalTransactionPath(path string) (int64, bool, error) {
	prefix := "/internal/payments/transactions/"
	if !strings.HasPrefix(path, prefix) {
		return 0, false, errors.New("invalid path")
	}
	rest := strings.Trim(path[len(prefix):], "/")
	parts := strings.Split(rest, "/")
	if len(parts) == 0 || len(parts) > 2 {
		return 0, false, errors.New("invalid path")
	}

	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || id <= 0 {
		return 0, false, errors.New("invalid id")
	}

	if len(parts) == 1 {
		return id, false, nil
	}

	if parts[1] == "status" {
		return id, true, nil
	}

	return 0, false, errors.New("invalid path")
}

func parseOptionalStatusQuery(values map[string][]string, key string) (*transactionStatus, bool) {
	raw := strings.TrimSpace(firstQueryValue(values, key))
	if raw == "" {
		return nil, true
	}
	status := transactionStatus(strings.ToUpper(raw))
	if !isValidTransactionStatus(status) {
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

func parseCreateTransactionRequest(r *http.Request) (transactionCreateRequest, error) {
	var req transactionCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return transactionCreateRequest{}, errors.New("Некорректный JSON")
	}

	if req.BookingID <= 0 {
		return transactionCreateRequest{}, errors.New("Поле bookingId обязательно")
	}

	req.PaymentMethod = paymentMethod(strings.ToUpper(strings.TrimSpace(string(req.PaymentMethod))))
	if !isValidPaymentMethod(req.PaymentMethod) {
		return transactionCreateRequest{}, errors.New("Недопустимый способ оплаты")
	}

	req.Currency = strings.ToUpper(strings.TrimSpace(req.Currency))
	if !currencyCodeRegex.MatchString(req.Currency) {
		return transactionCreateRequest{}, errors.New("Недопустимый код валюты")
	}

	if req.Amount <= 0 {
		return transactionCreateRequest{}, errors.New("Сумма должна быть положительной")
	}

	return req, nil
}

func parseUpdateTransactionRequest(r *http.Request) (transactionUpdateRequest, error) {
	var req transactionUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return transactionUpdateRequest{}, errors.New("Некорректный JSON")
	}
	if req.Status == nil {
		return transactionUpdateRequest{}, errors.New("Поле status обязательно")
	}

	status := transactionStatus(strings.ToUpper(strings.TrimSpace(string(*req.Status))))
	if !isValidTransactionStatus(status) {
		return transactionUpdateRequest{}, errors.New("Недопустимый статус транзакции")
	}
	req.Status = &status

	if req.RefundedAmount != nil {
		if *req.RefundedAmount < 0 {
			return transactionUpdateRequest{}, errors.New("Сумма возврата не может быть отрицательной")
		}
	}

	return req, nil
}

func parseInternalStatusUpdateRequest(r *http.Request) (internalTransactionStatusUpdateRequest, error) {
	var req internalTransactionStatusUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return internalTransactionStatusUpdateRequest{}, errors.New("Некорректный JSON")
	}
	if req.Status == nil {
		return internalTransactionStatusUpdateRequest{}, errors.New("Поле status обязательно")
	}

	status := transactionStatus(strings.ToUpper(strings.TrimSpace(string(*req.Status))))
	if !isValidTransactionStatus(status) {
		return internalTransactionStatusUpdateRequest{}, errors.New("Недопустимый статус транзакции")
	}
	req.Status = &status

	if req.PaymentGatewayResponse != nil {
		req.PaymentGatewayResponse.GatewayTransactionID = strings.TrimSpace(req.PaymentGatewayResponse.GatewayTransactionID)
		req.PaymentGatewayResponse.ErrorCode = strings.TrimSpace(req.PaymentGatewayResponse.ErrorCode)
		req.PaymentGatewayResponse.ErrorMessage = strings.TrimSpace(req.PaymentGatewayResponse.ErrorMessage)
	}

	return req, nil
}

func parsePaymentWebhookRequest(r *http.Request) (paymentWebhookRequest, error) {
	var req paymentWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return paymentWebhookRequest{}, errors.New("Некорректный JSON")
	}

	req.PaymentID = strings.TrimSpace(req.PaymentID)
	req.Status = strings.ToUpper(strings.TrimSpace(req.Status))
	req.Signature = strings.TrimSpace(req.Signature)
	req.Currency = strings.ToUpper(strings.TrimSpace(req.Currency))
	req.Timestamp = strings.TrimSpace(req.Timestamp)

	if req.PaymentID == "" {
		return paymentWebhookRequest{}, errors.New("Поле paymentId обязательно")
	}
	if req.Signature == "" {
		return paymentWebhookRequest{}, errors.New("Поле signature обязательно")
	}
	if req.Status == "" {
		return paymentWebhookRequest{}, errors.New("Поле status обязательно")
	}

	status := transactionStatus(req.Status)
	if !isValidTransactionStatus(status) {
		return paymentWebhookRequest{}, errors.New("Недопустимый статус транзакции")
	}

	if req.Timestamp != "" {
		if _, err := time.Parse(time.RFC3339, req.Timestamp); err != nil {
			return paymentWebhookRequest{}, errors.New("Некорректный timestamp")
		}
	}

	return req, nil
}

func isValidTransactionStatus(status transactionStatus) bool {
	switch status {
	case transactionStatusPending,
		transactionStatusSuccess,
		transactionStatusFailed,
		transactionStatusRefunded:
		return true
	default:
		return false
	}
}

func isValidPaymentMethod(method paymentMethod) bool {
	switch method {
	case paymentMethodCard,
		paymentMethodBankTransfer,
		paymentMethodElectronicWallet,
		paymentMethodCash:
		return true
	default:
		return false
	}
}

func isAdmin(p principal) bool {
	return strings.EqualFold(p.Role, "ADMIN")
}

func toTransactionResponse(rec transactionRecord) transactionResponse {
	response := transactionResponse{
		ID:              rec.ID,
		BookingID:       rec.BookingID,
		PaymentMethod:   rec.PaymentMethod,
		Status:          rec.Status,
		TransactionDate: rec.TransactionDate.Format(time.RFC3339),
		PaymentID:       rec.PaymentID,
		Currency:        rec.Currency,
		Amount:          rec.Amount,
		FeeAmount:       rec.FeeAmount,
		RefundedAmount:  rec.RefundedAmount,
	}
	return response
}

func paginateTransactions(items []transactionRecord, page int, pageSize int) ([]transactionRecord, int) {
	return pagination.Paginate(items, page, pageSize)
}

func sortTransactionsNewest(items []transactionRecord) {
	sort.Slice(items, func(i int, j int) bool {
		if items[i].TransactionDate.Equal(items[j].TransactionDate) {
			return items[i].ID > items[j].ID
		}
		return items[i].TransactionDate.After(items[j].TransactionDate)
	})
}

func generatePaymentID() string {
	counter := atomic.AddInt64(&paymentIDCounter, 1)
	randPart := rand.Intn(900000) + 100000
	return fmt.Sprintf("pay_%d_%d_%d", time.Now().UnixNano(), counter, randPart)
}

func calculateFee(amount float64) float64 {
	fee := amount * 0.03
	return math.Round(fee*100) / 100
}

func canTransitionTransactionStatus(from transactionStatus, to transactionStatus) bool {
	if from == to {
		return true
	}

	switch from {
	case transactionStatusPending:
		return to == transactionStatusSuccess || to == transactionStatusFailed
	case transactionStatusSuccess:
		return to == transactionStatusRefunded
	default:
		return false
	}
}
