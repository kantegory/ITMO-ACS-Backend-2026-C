package main

import (
	"database/sql"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type user struct {
	ID           int64
	FirstName    string
	LastName     string
	Email        string
	PasswordHash string
	Role         string
	IsVerified   bool
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type tokenClaims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	Type  string `json:"typ"`
	jwt.RegisteredClaims
}

type authStore struct {
	db *sql.DB
}

type authService struct {
	store        *authStore
	validator    *requestValidator
	jwtSecret    string
	serviceToken string
	accessTTL    time.Duration
	refreshTTL   time.Duration
}

type validatedUser struct {
	UserID   int64 `json:"userId"`
	IsActive bool  `json:"isActive"`
}

type authTokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"`
}
