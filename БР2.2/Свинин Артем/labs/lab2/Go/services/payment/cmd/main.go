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

	svc := &paymentService{
		db:    db,
		store: newTransactionStore(db),
		auth: &authClient{
			baseURL:      getenv("AUTH_SERVICE_URL", "http://auth-service:8081"),
			serviceToken: serviceToken,
			httpClient:   httputil.NewHTTPClient(),
		},
		booking: &bookingClient{
			baseURL:    getenv("BOOKING_SERVICE_URL", "http://booking-service:8084"),
			httpClient: httputil.NewHTTPClient(),
		},
		producer:     sharedkafka.NewProducer(kafkaBroker),
		consumer:     sharedkafka.NewConsumer(kafkaBroker),
		serviceToken: serviceToken,
	}
	defer func() {
		if err := svc.producer.Close(); err != nil {
			log.Printf("failed to close payment kafka producer: %v", err)
		}
		if err := svc.consumer.Close(); err != nil {
			log.Printf("failed to close payment kafka consumer: %v", err)
		}
	}()

	svc.startKafkaConsumers()

	port := normalizePort(getenv("PORT", "8085"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": serviceName})
	})
	mux.HandleFunc("/internal/payments/transactions/by-booking/", svc.handleInternalTransactionsByBooking)
	mux.HandleFunc("/internal/payments/transactions/", svc.handleInternalTransactions)
	mux.HandleFunc("/internal/payments/webhook", svc.handleInternalWebhook)
	mux.HandleFunc("/transactions/", svc.handleTransactionByID)
	mux.HandleFunc("/transactions", svc.handleTransactions)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httputil.WriteJSON(w, http.StatusOK, map[string]string{"message": "payment service is running"})
	})

	log.Printf("%s listening on %s", serviceName, port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Printf("%s failed: %v", serviceName, err)
	}
}
