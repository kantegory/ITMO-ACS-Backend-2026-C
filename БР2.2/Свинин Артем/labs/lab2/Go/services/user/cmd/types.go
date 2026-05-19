package main

import (
	"database/sql"
	"net/http"
	"time"
)

const serviceName = "user-service"

type authClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

type authValidationResponse struct {
	Valid     bool   `json:"valid"`
	UserID    int64  `json:"userId"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	ExpiresAt string `json:"expiresAt"`
	IsActive  bool   `json:"isActive"`
	Reason    string `json:"reason"`
}

type authUserResponse struct {
	ID         int64  `json:"id"`
	Email      string `json:"email"`
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	Role       string `json:"role"`
	IsActive   bool   `json:"isActive"`
	IsVerified bool   `json:"isVerified"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

type userProfile struct {
	UserID      int64
	FirstName   *string
	LastName    *string
	MiddleName  *string
	Email       *string
	Phone       *string
	UpdatedAt   time.Time
	Initialized bool
}

type favourite struct {
	ID         int64      `json:"id"`
	UserID     int64      `json:"userId"`
	PropertyID int64      `json:"propertyId"`
	AddedAt    string     `json:"addedAt"`
	Property   *favObject `json:"property,omitempty"`
}

type favObject struct {
	ID          int64   `json:"id"`
	Title       string  `json:"title"`
	PricePerDay float64 `json:"pricePerDay"`
}

type userStore struct {
	db *sql.DB
}

type principal struct {
	UserID int64
	Email  string
	Role   string
}

type userService struct {
	store        *userStore
	auth         *authClient
	property     *propertyClient
	validator    *requestValidator
	serviceToken string
}

type propertyClient struct {
	baseURL    string
	httpClient *http.Client
}
