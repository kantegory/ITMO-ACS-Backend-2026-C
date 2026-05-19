package main

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

const reviewConsumerGroupID = "review-service"

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

func (s *reviewService) startKafkaConsumers() {
	if s.consumer == nil {
		return
	}

	go s.consumeBookingCompleted()
}

func (s *reviewService) consumeBookingCompleted() {
	for {
		err := s.consumer.Consume(context.Background(), "booking.completed", reviewConsumerGroupID, func(_ string, value []byte) error {
			return s.handleBookingCompleted(value)
		})
		if err != nil {
			log.Printf("review kafka consumer error on topic booking.completed: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		return
	}
}

func (s *reviewService) handleBookingCompleted(value []byte) error {
	var event bookingEventPayload
	if err := json.Unmarshal(value, &event); err != nil {
		return err
	}
	if event.BookingID <= 0 {
		return nil
	}

	log.Printf("review received booking.completed for booking %d", event.BookingID)
	return nil
}
