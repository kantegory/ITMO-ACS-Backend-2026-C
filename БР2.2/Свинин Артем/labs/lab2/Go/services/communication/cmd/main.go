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

	svc := &communicationService{
		db:    db,
		store: newCommunicationStore(db),
		auth: &authClient{
			baseURL:      getenv("AUTH_SERVICE_URL", "http://auth-service:8081"),
			serviceToken: serviceToken,
			httpClient:   httputil.NewHTTPClient(),
		},
		property: &propertyClient{
			baseURL:    getenv("PROPERTY_SERVICE_URL", "http://property-service:8083"),
			httpClient: httputil.NewHTTPClient(),
		},
		booking: &bookingClient{
			baseURL:    getenv("BOOKING_SERVICE_URL", "http://booking-service:8084"),
			httpClient: httputil.NewHTTPClient(),
		},
		consumer:     sharedkafka.NewConsumer(kafkaBroker),
		serviceToken: serviceToken,
	}
	defer func() {
		if err := svc.consumer.Close(); err != nil {
			log.Printf("failed to close communication kafka consumer: %v", err)
		}
	}()

	svc.startKafkaConsumers()

	port := normalizePort(getenv("PORT", "8087"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	mux.HandleFunc("/internal/chats/by-property/", svc.handleInternalChatsByProperty)
	mux.HandleFunc("/internal/chats/by-booking/", svc.handleInternalChatByBooking)
	mux.HandleFunc("/internal/chats/validate-participant", svc.handleInternalValidateParticipant)
	mux.HandleFunc("/internal/chats/", svc.handleInternalChatParticipants)
	mux.HandleFunc("/chats/", svc.handleChatByID)
	mux.HandleFunc("/chats", svc.handleChats)
	mux.HandleFunc("/messages/", svc.handleMessageByID)
	mux.HandleFunc("/messages", svc.handleMessages)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "communication service is running"})
	})

	log.Printf("%s listening on %s", serviceName, port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Printf("%s failed: %v", serviceName, err)
	}
}
