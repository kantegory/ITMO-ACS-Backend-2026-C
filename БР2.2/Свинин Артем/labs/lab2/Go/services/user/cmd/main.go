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

	svc := &userService{
		store:     newUserStore(db),
		validator: newRequestValidator(),
		auth: &authClient{
			baseURL:      strings.TrimRight(getenv("AUTH_SERVICE_URL", "http://auth-service:8081"), "/"),
			serviceToken: serviceToken,
			httpClient:   httputil.NewHTTPClient(),
		},
		property: &propertyClient{
			baseURL:    strings.TrimRight(getenv("PROPERTY_SERVICE_URL", "http://property-service:8083"), "/"),
			httpClient: httputil.NewHTTPClient(),
		},
		serviceToken: serviceToken,
	}

	port := normalizePort(getenv("PORT", "8082"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	mux.HandleFunc("/internal/users/validate-ownership", svc.handleInternalValidateOwnership)
	mux.HandleFunc("/internal/users/", svc.handleInternalUsers)
	mux.HandleFunc("/users/me", svc.handleUsersMe)
	mux.HandleFunc("/users/", svc.handleUserByID)
	mux.HandleFunc("/favourites", svc.handleFavourites)
	mux.HandleFunc("/favourites/", svc.handleFavouriteByID)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "user service is running"})
	})

	log.Printf("%s listening on %s", serviceName, port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatal(err)
	}
}
