package httputil

import (
	"encoding/json"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]any{
		"code":    status,
		"message": message,
	})
}

func WriteMethodNotAllowed(w http.ResponseWriter) {
	WriteError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
}

func ReadJSON(r *http.Request, dst any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(dst)
}

// ParseJSONBody is a convenience wrapper that reads, decodes, and closes the request body.
// It returns an empty string on success, or an error message on failure.
// Typical usage: if err := ParseJSONBody(r, &req); err != "" { return err }
func ParseJSONBody(r *http.Request, dst any) string {
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		return "Некорректный JSON"
	}
	return ""
}
