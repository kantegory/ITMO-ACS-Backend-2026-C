package middleware

import "net/http"

func BearerAuth(validateToken func(token string) bool, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if len(auth) < len("Bearer ") || auth[:len("Bearer ")] != "Bearer " {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		token := auth[len("Bearer "):]
		if token == "" || !validateToken(token) {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func ServiceTokenAuth(expectedToken string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Service-Token") != expectedToken {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
