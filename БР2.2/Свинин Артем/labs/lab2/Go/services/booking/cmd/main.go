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

	svc := &bookingService{
		db:    db,
		store: newBookingStore(db),
		auth: &authClient{
			baseURL:      getenv("AUTH_SERVICE_URL", "http://auth-service:8081"),
			serviceToken: serviceToken,
			httpClient:   httputil.NewHTTPClient(),
		},
		property: &propertyClient{
			baseURL:    getenv("PROPERTY_SERVICE_URL", "http://property-service:8083"),
			httpClient: httputil.NewHTTPClient(),
		},
		producer:     sharedkafka.NewProducer(kafkaBroker),
		consumer:     sharedkafka.NewConsumer(kafkaBroker),
		serviceToken: serviceToken,
	}
	defer func() {
		if err := svc.producer.Close(); err != nil {
			log.Printf("failed to close booking kafka producer: %v", err)
		}
		if err := svc.consumer.Close(); err != nil {
			log.Printf("failed to close booking kafka consumer: %v", err)
		}
	}()

	svc.startKafkaConsumers()

	port := normalizePort(getenv("PORT", "8084"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	mux.HandleFunc("/internal/bookings/validate-review-eligibility", svc.handleInternalValidateReviewEligibility)
	mux.HandleFunc("/internal/bookings/by-property/", svc.handleInternalBookingsByProperty)
	mux.HandleFunc("/internal/bookings/by-user/", svc.handleInternalBookingsByUser)
	mux.HandleFunc("/internal/bookings/", svc.handleInternalBookingRoutes)
	mux.HandleFunc("/bookings/my", svc.handleMyBookings)
	mux.HandleFunc("/bookings/incoming", svc.handleIncomingBookings)
	mux.HandleFunc("/bookings/", svc.handleBookingByID)
	mux.HandleFunc("/bookings", svc.handleBookings)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "booking service is running"})
	})

	log.Printf("%s listening on %s", serviceName, port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Printf("%s failed: %v", serviceName, err)
	}
}
