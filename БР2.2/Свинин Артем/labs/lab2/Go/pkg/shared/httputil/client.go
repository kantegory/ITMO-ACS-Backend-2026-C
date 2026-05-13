package httputil

import (
	"net/http"
	"time"
)

// NewHTTPClient creates a standard HTTP client with 5-second timeout.
func NewHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 5 * time.Second,
	}
}

// NewHTTPClientWithTimeout creates an HTTP client with a custom timeout.
func NewHTTPClientWithTimeout(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout: timeout,
	}
}
