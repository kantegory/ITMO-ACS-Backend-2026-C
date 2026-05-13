package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
)

const serviceName = "auth-service"

func main() {
	db, err := openDB()
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		_ = db.Close()
	}()

	svc := &authService{
		store:        newAuthStore(db),
		validator:    newRequestValidator(),
		jwtSecret:    getenv("JWT_SECRET", "change-me-in-production-very-long-secret"),
		serviceToken: getenv("SERVICE_TOKEN", "internal-service-token"),
		accessTTL:    time.Hour,
		refreshTTL:   7 * 24 * time.Hour,
	}

	port := normalizePort(getenv("PORT", "8081"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	mux.HandleFunc("/auth/register", svc.handleRegister)
	mux.HandleFunc("/auth/login", svc.handleLogin)
	mux.HandleFunc("/auth/logout", svc.handleLogout)
	mux.HandleFunc("/auth/refresh", svc.handleRefresh)
	mux.HandleFunc("/auth/tokens/validate", svc.handleValidateToken)
	mux.HandleFunc("/auth/users/validate", svc.handleValidateUsersBatch)
	mux.HandleFunc("/auth/users/", svc.handleGetUserByID)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "auth service is running"})
	})

	log.Printf("%s listening on %s", serviceName, port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatal(err)
	}
}

func getenv(key string, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}

func normalizePort(port string) string {
	p := strings.TrimSpace(port)
	if p == "" {
		return ":8080"
	}
	if strings.HasPrefix(p, ":") {
		return p
	}
	return ":" + p
}
