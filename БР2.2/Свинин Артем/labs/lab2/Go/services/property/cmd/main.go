package main

import (
	"log"
	"net/http"
	"strings"

	"rental-platform/pkg/shared/httputil"
)

func main() {
	serviceToken := getenv("SERVICE_TOKEN", "internal-service-token")

	db, err := openDB()
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		_ = db.Close()
	}()

	svc := &propertyService{
		store: newPropertyStore(db),
		auth: &authClient{
			baseURL:      strings.TrimRight(getenv("AUTH_SERVICE_URL", "http://auth-service:8081"), "/"),
			serviceToken: serviceToken,
			httpClient:   httputil.NewHTTPClient(),
		},
		booking: &bookingClient{
			baseURL:      strings.TrimRight(getenv("BOOKING_SERVICE_URL", "http://booking-service:8084"), "/"),
			serviceToken: serviceToken,
			httpClient:   httputil.NewHTTPClient(),
		},
		serviceToken: serviceToken,
	}

	port := normalizePort(getenv("PORT", "8083"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	mux.HandleFunc("/internal/properties/validate", svc.handleInternalPropertiesValidate)
	mux.HandleFunc("/internal/properties/by-owner/", svc.handleInternalPropertiesByOwner)
	mux.HandleFunc("/internal/properties/", svc.handleInternalPropertyRoutes)
	mux.HandleFunc("/properties/my", svc.handlePropertiesMy)
	mux.HandleFunc("/properties/", svc.handlePropertyByID)
	mux.HandleFunc("/properties", svc.handleProperties)
	mux.HandleFunc("/addresses", svc.handleAddresses)
	mux.HandleFunc("/facilities", svc.handleFacilities)
	mux.HandleFunc("/images", svc.handleImages)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "property service is running"})
	})

	log.Printf("%s listening on %s", serviceName, port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatal(err)
	}
}
