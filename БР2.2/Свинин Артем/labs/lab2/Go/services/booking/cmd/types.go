package main

import (
	"database/sql"
	"time"

	"rental-platform/pkg/shared/kafka"
	"rental-platform/pkg/shared/pagination"
)

const serviceName = "booking-service"

type bookingStatus string

const (
	bookingStatusPending   bookingStatus = "PENDING"
	bookingStatusConfirmed bookingStatus = "CONFIRMED"
	bookingStatusActive    bookingStatus = "ACTIVE"
	bookingStatusCompleted bookingStatus = "COMPLETED"
	bookingStatusCancelled bookingStatus = "CANCELLED"
	bookingStatusRejected  bookingStatus = "REJECTED"
)

type principal struct {
	UserID int64
	Role   string
	Email  string
}

type bookingCreateRequest struct {
	PropertyID     int64  `json:"propertyId"`
	StartDate      string `json:"startDate"`
	EndDate        string `json:"endDate"`
	GuestsCount    int    `json:"guestsCount"`
	SpecialRequest string `json:"specialRequest"`
}

type bookingUpdateRequest struct {
	Status             *bookingStatus `json:"status"`
	SpecialRequest     *string        `json:"specialRequest"`
	CancellationReason *string        `json:"cancellationReason"`
}

type bookingRecord struct {
	ID                 int64
	PropertyID         int64
	PropertyOwnerID    int64
	PropertyTitle      string
	PropertyCity       string
	OccupierID         int64
	StartDate          time.Time
	EndDate            time.Time
	TotalPrice         float64
	Status             bookingStatus
	GuestsCount        int
	SpecialRequest     string
	CancellationReason string
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type bookingResponse struct {
	ID                 int64          `json:"id"`
	PropertyID         int64          `json:"propertyId"`
	OccupierID         int64          `json:"occupierId"`
	StartDate          string         `json:"startDate"`
	EndDate            string         `json:"endDate"`
	TotalPrice         float64        `json:"totalPrice"`
	Status             bookingStatus  `json:"status"`
	GuestsCount        int            `json:"guestsCount"`
	SpecialRequest     string         `json:"specialRequest,omitempty"`
	CancellationReason string         `json:"cancellationReason,omitempty"`
	CreatedAt          string         `json:"createdAt"`
	UpdatedAt          string         `json:"updatedAt"`
	Property           map[string]any `json:"property,omitempty"`
}

type paginatedBookingsResponse = pagination.Page[bookingResponse]

type authTokenValidationRequest struct {
	Token string `json:"token"`
}

type authTokenValidationResponse struct {
	Valid  bool   `json:"valid"`
	UserID int64  `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

type propertyAddress struct {
	City string `json:"city"`
}

type propertyResponse struct {
	ID          int64            `json:"id"`
	OwnerID     int64            `json:"ownerId"`
	Title       string           `json:"title"`
	PricePerDay float64          `json:"pricePerDay"`
	MaxGuests   int              `json:"maxGuests"`
	IsAvailable bool             `json:"isAvailable"`
	Address     *propertyAddress `json:"address,omitempty"`
}

type bookingService struct {
	db           *sql.DB
	store        *bookingStore
	auth         *authClient
	property     *propertyClient
	producer     kafka.Producer
	consumer     kafka.Consumer
	serviceToken string
}
