package main

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

const communicationConsumerGroupID = "communication-service"

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

type paymentEventPayload struct {
	TransactionID int64   `json:"transactionId"`
	BookingID     int64   `json:"bookingId"`
	Status        string  `json:"status"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	PaymentID     string  `json:"paymentId"`
	OccurredAt    string  `json:"occurredAt"`
}

func (s *communicationService) startKafkaConsumers() {
	if s.consumer == nil {
		return
	}

	go s.consumeBookingCreated()
	go s.consumePaymentSuccess()
}

func (s *communicationService) consumeBookingCreated() {
	for {
		err := s.consumer.Consume(context.Background(), "booking.created", communicationConsumerGroupID, func(_ string, value []byte) error {
			return s.handleBookingCreated(value)
		})
		if err != nil {
			log.Printf("communication kafka consumer error on topic booking.created: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		return
	}
}

func (s *communicationService) consumePaymentSuccess() {
	for {
		err := s.consumer.Consume(context.Background(), "payment.success", communicationConsumerGroupID, func(_ string, value []byte) error {
			return s.handlePaymentSuccess(value)
		})
		if err != nil {
			log.Printf("communication kafka consumer error on topic payment.success: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		return
	}
}

func (s *communicationService) handleBookingCreated(value []byte) error {
	var event bookingEventPayload
	if err := json.Unmarshal(value, &event); err != nil {
		return err
	}
	if event.BookingID <= 0 || event.OwnerID <= 0 || event.OccupierID <= 0 || event.PropertyID <= 0 {
		return nil
	}

	if _, exists := s.store.findChatByBookingID(event.BookingID); exists {
		return nil
	}

	chat := s.store.createChat(chatRecord{
		OwnerID:    event.OwnerID,
		OccupierID: event.OccupierID,
		PropertyID: event.PropertyID,
		BookingID:  event.BookingID,
	})

	log.Printf("communication created chat %d for booking %d", chat.ID, event.BookingID)
	return nil
}

func (s *communicationService) handlePaymentSuccess(value []byte) error {
	var event paymentEventPayload
	if err := json.Unmarshal(value, &event); err != nil {
		return err
	}
	if event.BookingID <= 0 {
		return nil
	}

	if _, exists := s.store.findChatByBookingID(event.BookingID); !exists {
		log.Printf("communication received payment.success for booking %d without chat", event.BookingID)
		return nil
	}

	log.Printf("communication received payment.success for booking %d", event.BookingID)
	return nil
}
