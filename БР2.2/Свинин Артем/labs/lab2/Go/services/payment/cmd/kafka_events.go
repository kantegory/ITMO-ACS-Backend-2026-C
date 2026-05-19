package main

import (
	"context"
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"time"
)

const paymentConsumerGroupID = "payment-service"

type bookingEventPayload struct {
	BookingID  int64  `json:"bookingId"`
	PropertyID int64  `json:"propertyId"`
	OccupierID int64  `json:"occupierId"`
	OwnerID    int64  `json:"ownerId"`
	Status     string `json:"status"`
	StartDate  string `json:"startDate"`
	EndDate    string `json:"endDate"`
	OccurredAt string `json:"occurredAt"`
}

type paymentStatusEventPayload struct {
	TransactionID int64             `json:"transactionId"`
	BookingID     int64             `json:"bookingId"`
	Status        transactionStatus `json:"status"`
	Amount        float64           `json:"amount"`
	Currency      string            `json:"currency"`
	PaymentID     string            `json:"paymentId"`
	OccurredAt    string            `json:"occurredAt"`
}

func (s *paymentService) startKafkaConsumers() {
	if s.consumer == nil {
		return
	}

	go s.consumeBookingCreated()
}

func (s *paymentService) consumeBookingCreated() {
	for {
		err := s.consumer.Consume(context.Background(), "booking.created", paymentConsumerGroupID, func(_ string, value []byte) error {
			return s.handleBookingCreated(value)
		})
		if err != nil {
			log.Printf("payment kafka consumer error on topic booking.created: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		return
	}
}

func (s *paymentService) handleBookingCreated(value []byte) error {
	var event bookingEventPayload
	if err := json.Unmarshal(value, &event); err != nil {
		return err
	}
	if event.BookingID <= 0 {
		return nil
	}

	log.Printf("payment received booking.created for booking %d", event.BookingID)
	return nil
}

func (s *paymentService) publishPaymentStatusEvent(rec transactionRecord) {
	topic := ""
	switch rec.Status {
	case transactionStatusSuccess:
		topic = "payment.success"
	case transactionStatusFailed:
		topic = "payment.failed"
	default:
		return
	}

	payload := paymentStatusEventPayload{
		TransactionID: rec.ID,
		BookingID:     rec.BookingID,
		Status:        rec.Status,
		Amount:        rec.Amount,
		Currency:      strings.ToUpper(strings.TrimSpace(rec.Currency)),
		PaymentID:     strings.TrimSpace(rec.PaymentID),
		OccurredAt:    time.Now().UTC().Format(time.RFC3339),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("payment kafka marshal error for topic %s: %v", topic, err)
		return
	}

	if s.producer == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := s.producer.Publish(ctx, topic, strconv.FormatInt(rec.ID, 10), body); err != nil {
		log.Printf("payment kafka publish error for topic %s: %v", topic, err)
	}
}
