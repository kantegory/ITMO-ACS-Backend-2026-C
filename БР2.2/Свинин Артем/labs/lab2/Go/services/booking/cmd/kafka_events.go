package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"strconv"
	"strings"
	"time"
)

const bookingConsumerGroupID = "booking-service"

var errPaymentEventIgnored = errors.New("payment event ignored")

type bookingEventPayload struct {
	BookingID          int64         `json:"bookingId"`
	PropertyID         int64         `json:"propertyId"`
	OccupierID         int64         `json:"occupierId"`
	OwnerID            int64         `json:"ownerId"`
	Status             bookingStatus `json:"status"`
	StartDate          string        `json:"startDate"`
	EndDate            string        `json:"endDate"`
	CancellationReason string        `json:"cancellationReason,omitempty"`
	OccurredAt         string        `json:"occurredAt"`
}

type paymentEventPayload struct {
	TransactionID int64   `json:"transactionId"`
	BookingID     int64   `json:"bookingId"`
	Status        string  `json:"status"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	ErrorMessage  string  `json:"errorMessage,omitempty"`
	OccurredAt    string  `json:"occurredAt"`
}

func (s *bookingService) startKafkaConsumers() {
	if s.consumer == nil {
		return
	}

	go s.consumePaymentEvents("payment.success")
	go s.consumePaymentEvents("payment.failed")
}

func (s *bookingService) consumePaymentEvents(topic string) {
	for {
		err := s.consumer.Consume(context.Background(), topic, bookingConsumerGroupID, func(_ string, value []byte) error {
			return s.handlePaymentEvent(topic, value)
		})
		if err != nil {
			log.Printf("booking kafka consumer error on topic %s: %v", topic, err)
			time.Sleep(2 * time.Second)
			continue
		}
		return
	}
}

func (s *bookingService) handlePaymentEvent(topic string, value []byte) error {
	var event paymentEventPayload
	if err := json.Unmarshal(value, &event); err != nil {
		return err
	}
	if event.BookingID <= 0 {
		return nil
	}

	targetStatus, cancelReason := mapPaymentTopicToBookingStatus(topic, event)
	if targetStatus == "" {
		return nil
	}

	updated, err := s.store.update(event.BookingID, func(rec *bookingRecord) error {
		if rec.Status == targetStatus {
			return errPaymentEventIgnored
		}
		if !canTransitionStatus(rec.Status, targetStatus) {
			return errPaymentEventIgnored
		}

		rec.Status = targetStatus
		if targetStatus == bookingStatusCancelled && cancelReason != "" {
			rec.CancellationReason = cancelReason
		}
		return nil
	})
	if err != nil {
		if errors.Is(err, errNotFound) || errors.Is(err, errPaymentEventIgnored) {
			return nil
		}
		return err
	}

	log.Printf("booking %d status updated from kafka event %s to %s", updated.ID, topic, updated.Status)
	s.publishBookingStatusEvent(*updated)
	return nil
}

func mapPaymentTopicToBookingStatus(topic string, event paymentEventPayload) (bookingStatus, string) {
	switch strings.TrimSpace(topic) {
	case "payment.success":
		return bookingStatusConfirmed, ""
	case "payment.failed":
		reason := strings.TrimSpace(event.ErrorMessage)
		if reason == "" {
			reason = "Payment failed"
		}
		return bookingStatusCancelled, reason
	default:
		return "", ""
	}
}

func (s *bookingService) publishBookingCreated(rec bookingRecord) {
	payload := bookingEventPayload{
		BookingID:  rec.ID,
		PropertyID: rec.PropertyID,
		OccupierID: rec.OccupierID,
		OwnerID:    rec.PropertyOwnerID,
		Status:     rec.Status,
		StartDate:  rec.StartDate.Format(time.RFC3339),
		EndDate:    rec.EndDate.Format(time.RFC3339),
		OccurredAt: time.Now().UTC().Format(time.RFC3339),
	}
	s.publishBookingEvent("booking.created", strconv.FormatInt(rec.ID, 10), payload)
}

func (s *bookingService) publishBookingStatusEvent(rec bookingRecord) {
	topic := ""
	switch rec.Status {
	case bookingStatusCompleted:
		topic = "booking.completed"
	case bookingStatusCancelled:
		topic = "booking.cancelled"
	default:
		return
	}

	payload := bookingEventPayload{
		BookingID:          rec.ID,
		PropertyID:         rec.PropertyID,
		OccupierID:         rec.OccupierID,
		OwnerID:            rec.PropertyOwnerID,
		Status:             rec.Status,
		StartDate:          rec.StartDate.Format(time.RFC3339),
		EndDate:            rec.EndDate.Format(time.RFC3339),
		CancellationReason: strings.TrimSpace(rec.CancellationReason),
		OccurredAt:         time.Now().UTC().Format(time.RFC3339),
	}
	s.publishBookingEvent(topic, strconv.FormatInt(rec.ID, 10), payload)
}

func (s *bookingService) publishBookingEvent(topic string, key string, payload bookingEventPayload) {
	if s.producer == nil {
		return
	}

	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("booking kafka marshal error for topic %s: %v", topic, err)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := s.producer.Publish(ctx, topic, key, body); err != nil {
		log.Printf("booking kafka publish error for topic %s: %v", topic, err)
	}
}
