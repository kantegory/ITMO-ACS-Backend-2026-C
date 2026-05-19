package main

import (
	"log"
	"net/http"

	"rental-platform/pkg/shared/httputil"
	sharedkafka "rental-platform/pkg/shared/kafka"
)

func main() {
	db, err := openDB()
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		_ = db.Close()
	}()

	serviceToken := getenv("SERVICE_TOKEN", "internal-service-token")
	kafkaBroker := getenv("KAFKA_BROKER", "kafka:9092")

	svc := &reviewService{
		db:    db,
		store: newReviewStore(db),
		auth: &authClient{
			baseURL:      getenv("AUTH_SERVICE_URL", "http://auth-service:8081"),
			serviceToken: serviceToken,
			httpClient:   httputil.NewHTTPClient(),
		},
		booking: &bookingClient{
			baseURL:    getenv("BOOKING_SERVICE_URL", "http://booking-service:8084"),
			httpClient: httputil.NewHTTPClient(),
		},
		property: &propertyClient{
			baseURL:    getenv("PROPERTY_SERVICE_URL", "http://property-service:8083"),
			httpClient: httputil.NewHTTPClient(),
		},
		consumer:     sharedkafka.NewConsumer(kafkaBroker),
		serviceToken: serviceToken,
	}
	defer func() {
		if err := svc.consumer.Close(); err != nil {
			log.Printf("failed to close review kafka consumer: %v", err)
		}
	}()

	svc.startKafkaConsumers()

	port := normalizePort(getenv("PORT", "8086"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	mux.HandleFunc("/internal/reviews/can-create", svc.handleInternalCanCreate)
	mux.HandleFunc("/internal/reviews/property-rating/", svc.handleInternalPropertyRating)
	mux.HandleFunc("/internal/reviews/user-rating/", svc.handleInternalUserRating)
	mux.HandleFunc("/internal/reviews/by-booking/", svc.handleInternalReviewsByBooking)
	mux.HandleFunc("/reviews/", svc.handleReviewByID)
	mux.HandleFunc("/reviews", svc.handleReviews)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "review service is running"})
	})

	log.Printf("%s listening on %s", serviceName, port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Printf("%s failed: %v", serviceName, err)
	}
}
