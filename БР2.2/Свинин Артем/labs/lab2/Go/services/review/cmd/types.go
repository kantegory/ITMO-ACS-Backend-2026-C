package main

import (
	"database/sql"
	"time"

	"rental-platform/pkg/shared/kafka"
	"rental-platform/pkg/shared/pagination"
)

const serviceName = "review-service"

type reviewTargetType string

const (
	reviewTargetTypeProperty reviewTargetType = "PROPERTY"
	reviewTargetTypeOwner    reviewTargetType = "OWNER"
	reviewTargetTypeOccupier reviewTargetType = "OCCUPIER"
)

type principal struct {
	UserID int64
	Role   string
	Email  string
}

type reviewCreateRequest struct {
	BookingID  int64            `json:"bookingId"`
	PropertyID int64            `json:"propertyId"`
	TargetType reviewTargetType `json:"targetType"`
	Rating     int              `json:"rating"`
	Comment    string           `json:"comment"`
}

type reviewRespondRequest struct {
	ResponseText string `json:"responseText"`
}

type reviewRecord struct {
	ID              int64
	BookingID       int64
	PropertyID      int64
	ReviewerID      int64
	PropertyOwnerID int64
	OccupierID      int64
	TargetType      reviewTargetType
	Rating          int
	Comment         string
	CreatedAt       time.Time
	ResponseText    string
	ResponseDate    *time.Time
}

type reviewResponse struct {
	ID           int64            `json:"id"`
	BookingID    int64            `json:"bookingId"`
	PropertyID   int64            `json:"propertyId,omitempty"`
	ReviewerID   int64            `json:"reviewerId"`
	TargetType   reviewTargetType `json:"targetType"`
	Rating       int              `json:"rating"`
	Comment      string           `json:"comment,omitempty"`
	CreatedAt    string           `json:"createdAt"`
	ResponseText string           `json:"responseText,omitempty"`
	ResponseDate string           `json:"responseDate,omitempty"`
}

type paginatedReviewsResponse = pagination.Page[reviewResponse]

type authTokenValidationResponse struct {
	Valid    bool   `json:"valid"`
	UserID   int64  `json:"userId"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	IsActive bool   `json:"isActive"`
}

type bookingResponse struct {
	ID         int64  `json:"id"`
	PropertyID int64  `json:"propertyId"`
	OccupierID int64  `json:"occupierId"`
	OwnerID    int64  `json:"ownerId"`
	Status     string `json:"status"`
}

type propertyResponse struct {
	ID      int64 `json:"id"`
	OwnerID int64 `json:"ownerId"`
}

type reviewService struct {
	db           *sql.DB
	store        *reviewStore
	auth         *authClient
	booking      *bookingClient
	property     *propertyClient
	consumer     kafka.Consumer
	serviceToken string
}
