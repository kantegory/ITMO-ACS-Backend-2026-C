package main

import (
	"database/sql"
	"time"

	"rental-platform/pkg/shared/kafka"
	"rental-platform/pkg/shared/pagination"
)

const serviceName = "payment-service"

type transactionStatus string

const (
	transactionStatusPending  transactionStatus = "PENDING"
	transactionStatusSuccess  transactionStatus = "SUCCESS"
	transactionStatusFailed   transactionStatus = "FAILED"
	transactionStatusRefunded transactionStatus = "REFUNDED"
)

type paymentMethod string

const (
	paymentMethodCard             paymentMethod = "CARD"
	paymentMethodBankTransfer     paymentMethod = "BANK_TRANSFER"
	paymentMethodElectronicWallet paymentMethod = "ELECTRONIC_WALLET"
	paymentMethodCash             paymentMethod = "CASH"
)

type principal struct {
	UserID int64
	Role   string
	Email  string
}

type transactionCreateRequest struct {
	BookingID     int64         `json:"bookingId"`
	PaymentMethod paymentMethod `json:"paymentMethod"`
	Currency      string        `json:"currency"`
	Amount        float64       `json:"amount"`
}

type transactionUpdateRequest struct {
	Status         *transactionStatus `json:"status"`
	RefundedAmount *float64           `json:"refundedAmount"`
}

type internalTransactionStatusUpdateRequest struct {
	Status                 *transactionStatus     `json:"status"`
	PaymentGatewayResponse *paymentGatewayPayload `json:"paymentGatewayResponse"`
}

type paymentGatewayPayload struct {
	GatewayTransactionID string `json:"gatewayTransactionId"`
	ErrorCode            string `json:"errorCode"`
	ErrorMessage         string `json:"errorMessage"`
}

type paymentWebhookRequest struct {
	PaymentID     string  `json:"paymentId"`
	TransactionID *int64  `json:"transactionId"`
	Status        string  `json:"status"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Timestamp     string  `json:"timestamp"`
	Signature     string  `json:"signature"`
}

type transactionRecord struct {
	ID              int64
	BookingID       int64
	PaymentMethod   paymentMethod
	Status          transactionStatus
	TransactionDate time.Time
	PaymentID       string
	Currency        string
	Amount          float64
	FeeAmount       float64
	RefundedAmount  *float64
	CreatedBy       int64
}

type transactionResponse struct {
	ID              int64             `json:"id"`
	BookingID       int64             `json:"bookingId"`
	PaymentMethod   paymentMethod     `json:"paymentMethod"`
	Status          transactionStatus `json:"status"`
	TransactionDate string            `json:"transactionDate"`
	PaymentID       string            `json:"paymentId"`
	Currency        string            `json:"currency"`
	Amount          float64           `json:"amount"`
	FeeAmount       float64           `json:"feeAmount"`
	RefundedAmount  *float64          `json:"refundedAmount,omitempty"`
}

type paginatedTransactionsResponse = pagination.Page[transactionResponse]

type authTokenValidationResponse struct {
	Valid    bool   `json:"valid"`
	UserID   int64  `json:"userId"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	IsActive bool   `json:"isActive"`
}

type bookingResponse struct {
	ID int64 `json:"id"`
}

type paymentService struct {
	db           *sql.DB
	store        *transactionStore
	auth         *authClient
	booking      *bookingClient
	producer     kafka.Producer
	consumer     kafka.Consumer
	serviceToken string
}
