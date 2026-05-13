package main

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (a *authService) issueTokens(u *user) (*authTokenResponse, error) {
	if u == nil {
		return nil, errors.New("nil user")
	}

	accessToken, err := a.generateToken(u, "access", a.accessTTL)
	if err != nil {
		return nil, err
	}

	refreshToken, err := a.generateToken(u, "refresh", a.refreshTTL)
	if err != nil {
		return nil, err
	}

	a.store.saveRefreshToken(refreshToken, u.ID)

	return &authTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(a.accessTTL.Seconds()),
	}, nil
}

func (a *authService) generateToken(u *user, tokenType string, ttl time.Duration) (string, error) {
	jti, err := randomTokenID()
	if err != nil {
		return "", err
	}

	now := time.Now().UTC()

	claims := tokenClaims{
		Email: u.Email,
		Role:  u.Role,
		Type:  tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(u.ID, 10),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        jti,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(a.jwtSecret))
}

func (a *authService) parseAndVerifyToken(token string, expectedType string) (*tokenClaims, error) {
	claims := &tokenClaims{}

	_, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}

		return []byte(a.jwtSecret), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return nil, err
	}

	if claims.Type != expectedType {
		return nil, errors.New("invalid token type")
	}

	return claims, nil
}

func (c *tokenClaims) userID() (int64, error) {
	if c == nil {
		return 0, errors.New("nil claims")
	}

	id, err := strconv.ParseInt(c.Subject, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid subject")
	}

	return id, nil
}

func randomTokenID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	return hex.EncodeToString(b), nil
}
