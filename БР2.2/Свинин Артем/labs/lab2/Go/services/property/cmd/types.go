package main

import (
	"database/sql"
	"net/http"
	"time"
)

const serviceName = "property-service"

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

type principal struct {
	UserID int64
	Role   string
	Email  string
}

type propertyStore struct {
	db *sql.DB
}

type propertyService struct {
	store        *propertyStore
	auth         *authClient
	booking      *bookingClient
	serviceToken string
}

type propertyRecord struct {
	ID            int64
	OwnerID       int64
	TypeID        int64
	AddressID     int64
	Title         string
	Description   string
	PricePerDay   float64
	PricePerMonth float64
	AreaSqM       int
	MaxGuests     int
	Bedrooms      int
	Bathrooms     int
	IsAvailable   bool
	MinRentDays   int
	MaxRentDays   int
	FacilityIDs   []int64
	ImageIDs      []int64
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type propertyType struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

type ratingInfo struct {
	Average      float64 `json:"average"`
	TotalReviews int     `json:"totalReviews"`
}

type address struct {
	ID          int64    `json:"id"`
	Country     string   `json:"country"`
	City        string   `json:"city"`
	District    string   `json:"district,omitempty"`
	HouseNumber string   `json:"houseNumber"`
	Apartment   string   `json:"apartment,omitempty"`
	PostalCode  string   `json:"postalCode,omitempty"`
	Lat         *float64 `json:"lat,omitempty"`
	Lon         *float64 `json:"lon,omitempty"`
	FullAddress string   `json:"fullAddress,omitempty"`
}

type facility struct {
	ID        int64  `json:"id"`
	Type      string `json:"type"`
	CreatedAt string `json:"createdAt,omitempty"`
	UpdatedAt string `json:"updatedAt,omitempty"`
}

type image struct {
	ID         int64  `json:"id"`
	PropertyID int64  `json:"propertyId"`
	ImageURL   string `json:"imageUrl"`
	IsMain     bool   `json:"isMain"`
	CreatedAt  string `json:"createdAt,omitempty"`
}

type propertyResponse struct {
	ID            int64             `json:"id"`
	OwnerID       int64             `json:"ownerId"`
	TypeID        int64             `json:"typeId,omitempty"`
	Owner         *authUserResponse `json:"owner,omitempty"`
	Type          *propertyType     `json:"type,omitempty"`
	AddressID     int64             `json:"addressId"`
	Address       *address          `json:"address,omitempty"`
	Title         string            `json:"title"`
	Description   string            `json:"description"`
	PricePerDay   float64           `json:"pricePerDay"`
	PricePerMonth float64           `json:"pricePerMonth"`
	AreaSqM       int               `json:"areaSqM"`
	MaxGuests     int               `json:"maxGuests"`
	Bedrooms      int               `json:"bedrooms"`
	Bathrooms     int               `json:"bathrooms"`
	IsAvailable   bool              `json:"isAvailable"`
	MinRentDays   int               `json:"minRentDays"`
	MaxRentDays   int               `json:"maxRentDays,omitempty"`
	Images        []image           `json:"images,omitempty"`
	Facilities    []facility        `json:"facilities,omitempty"`
	Rating        *ratingInfo       `json:"rating,omitempty"`
	CreatedAt     string            `json:"createdAt"`
	UpdatedAt     string            `json:"updatedAt"`
}

type propertyCreateRequest struct {
	TypeID        int64   `json:"typeId"`
	AddressID     int64   `json:"addressId"`
	Title         string  `json:"title"`
	Description   string  `json:"description"`
	PricePerDay   float64 `json:"pricePerDay"`
	PricePerMonth float64 `json:"pricePerMonth"`
	AreaSqM       int     `json:"areaSqM"`
	MaxGuests     int     `json:"maxGuests"`
	Bedrooms      int     `json:"bedrooms"`
	Bathrooms     int     `json:"bathrooms"`
	IsAvailable   *bool   `json:"isAvailable"`
	MinRentDays   int     `json:"minRentDays"`
	MaxRentDays   int     `json:"maxRentDays"`
}

type propertyUpdateRequest struct {
	TypeID        *int64   `json:"typeId"`
	AddressID     *int64   `json:"addressId"`
	Title         *string  `json:"title"`
	Description   *string  `json:"description"`
	PricePerDay   *float64 `json:"pricePerDay"`
	PricePerMonth *float64 `json:"pricePerMonth"`
	AreaSqM       *int     `json:"areaSqM"`
	MaxGuests     *int     `json:"maxGuests"`
	Bedrooms      *int     `json:"bedrooms"`
	Bathrooms     *int     `json:"bathrooms"`
	IsAvailable   *bool    `json:"isAvailable"`
	MinRentDays   *int     `json:"minRentDays"`
	MaxRentDays   *int     `json:"maxRentDays"`
}

type addressCreateRequest struct {
	Country     string   `json:"country"`
	City        string   `json:"city"`
	District    string   `json:"district"`
	HouseNumber string   `json:"houseNumber"`
	Apartment   string   `json:"apartment"`
	PostalCode  string   `json:"postalCode"`
	Lat         *float64 `json:"lat"`
	Lon         *float64 `json:"lon"`
}

type addImageRequest struct {
	PropertyID int64  `json:"propertyId"`
	ImageURL   string `json:"imageUrl"`
	IsMain     bool   `json:"isMain"`
}

type bookingClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

var propertyTypes = map[int64]propertyType{
	1: {ID: 1, Name: "Квартира"},
	2: {ID: 2, Name: "Дом"},
	3: {ID: 3, Name: "Студия"},
}
