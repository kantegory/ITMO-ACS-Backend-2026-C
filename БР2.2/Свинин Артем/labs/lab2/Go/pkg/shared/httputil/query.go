package httputil

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

func FirstQueryValue(values map[string][]string, key string) string {
	list := values[key]
	if len(list) == 0 {
		return ""
	}
	return list[0]
}

func ParsePositiveIntQuery(values map[string][]string, key string, fallback int) (int, bool) {
	raw := strings.TrimSpace(FirstQueryValue(values, key))
	if raw == "" {
		return fallback, true
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return 0, false
	}

	return value, true
}

func QueryValue(values url.Values, key string) string {
	return FirstQueryValue(values, key)
}

func ParseQueryInt(r *http.Request, key string, fallback int, min int, max int) int {
	raw := strings.TrimSpace(r.URL.Query().Get(key))
	if raw == "" {
		return fallback
	}

	v, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}

	if v < min {
		return min
	}

	if v > max {
		return max
	}

	return v
}

func ParseBearerToken(r *http.Request) string {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func ParsePathID(path string, expectedPrefix string) (int64, error) {
	trimmed := strings.Trim(path, "/")
	parts := strings.Split(trimmed, "/")
	if len(parts) != 2 || parts[0] != expectedPrefix {
		return 0, errors.New("invalid path")
	}
	id, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}

func ParsePathIDWithPrefix(path string, prefix string) (int64, bool) {
	idPart := strings.TrimSpace(strings.TrimPrefix(path, prefix))
	if idPart == "" || strings.Contains(idPart, "/") {
		return 0, false
	}
	id, err := strconv.ParseInt(idPart, 10, 64)
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}

// ParseOptionalInt64 parses an optional int64 from query values.
// Returns (nil, true) if key is absent, (*value, true) if valid, or (nil, false) if invalid.
func ParseOptionalInt64(values map[string][]string, key string) (*int64, bool) {
	raw := strings.TrimSpace(FirstQueryValue(values, key))
	if raw == "" {
		return nil, true
	}
	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || value <= 0 {
		return nil, false
	}
	return &value, true
}

// ParseOptionalTime parses an optional RFC3339 time from query values.
// Returns (nil, true) if key is absent, (*value, true) if valid, or (nil, false) if invalid.
func ParseOptionalTime(values map[string][]string, key string) (*time.Time, bool) {
	raw := strings.TrimSpace(FirstQueryValue(values, key))
	if raw == "" {
		return nil, true
	}
	value, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		return nil, false
	}
	v := value.UTC()
	return &v, true
}
