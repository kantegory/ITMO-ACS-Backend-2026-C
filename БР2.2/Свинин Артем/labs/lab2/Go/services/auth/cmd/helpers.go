package main

import (
	"errors"
	"net/http"
	"strings"

	"rental-platform/pkg/shared/httputil"
)

var writeAPIError = httputil.WriteError
var writeMethodNotAllowed = httputil.WriteMethodNotAllowed

func (a *authService) authorizeAccessToken(r *http.Request) (*tokenClaims, error) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, errors.New("missing bearer token")
	}

	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if token == "" {
		return nil, errors.New("missing bearer token")
	}

	return a.parseAndVerifyToken(token, "access")
}

func (a *authService) checkServiceToken(r *http.Request) bool {
	provided := strings.TrimSpace(r.Header.Get("X-Service-Token"))
	return provided != "" && provided == a.serviceToken
}
