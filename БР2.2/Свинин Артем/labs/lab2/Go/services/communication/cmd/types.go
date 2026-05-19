package main

import (
	"database/sql"
	"time"

	"rental-platform/pkg/shared/kafka"
	"rental-platform/pkg/shared/pagination"
)

const serviceName = "communication-service"

type principal struct {
	UserID int64
	Role   string
	Email  string
}

type createChatRequest struct {
	PropertyID int64 `json:"propertyId"`
	BookingID  int64 `json:"bookingId"`
}

type sendMessageRequest struct {
	ChatID  int64  `json:"chatId"`
	Content string `json:"content"`
}

type validateParticipantRequest struct {
	ChatID int64 `json:"chatId"`
	UserID int64 `json:"userId"`
}

type chatRecord struct {
	ID            int64
	OwnerID       int64
	OccupierID    int64
	PropertyID    int64
	BookingID     int64
	CreatedAt     time.Time
	LastMessageAt *time.Time
}

type messageRecord struct {
	ID       int64
	ChatID   int64
	SenderID int64
	Content  string
	SentAt   time.Time
	IsRead   bool
	ReadAt   *time.Time
}

type chatResponse struct {
	ID            int64            `json:"id"`
	OwnerID       int64            `json:"ownerId"`
	OccupierID    int64            `json:"occupierId"`
	PropertyID    int64            `json:"propertyId"`
	BookingID     int64            `json:"bookingId,omitempty"`
	CreatedAt     string           `json:"createdAt"`
	LastMessageAt string           `json:"lastMessageAt,omitempty"`
	LastMessage   *messageResponse `json:"lastMessage,omitempty"`
	UnreadCount   int              `json:"unreadCount,omitempty"`
}

type messageResponse struct {
	ID       int64  `json:"id"`
	ChatID   int64  `json:"chatId"`
	SenderID int64  `json:"senderId"`
	Content  string `json:"content"`
	SentAt   string `json:"sentAt"`
	IsRead   bool   `json:"isRead"`
	ReadAt   string `json:"readAt,omitempty"`
}

type paginatedChatsResponse = pagination.Page[chatResponse]

type paginatedMessagesResponse = pagination.Page[messageResponse]

type authTokenValidationResponse struct {
	Valid    bool   `json:"valid"`
	UserID   int64  `json:"userId"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	IsActive bool   `json:"isActive"`
}

type propertyResponse struct {
	ID      int64 `json:"id"`
	OwnerID int64 `json:"ownerId"`
}

type bookingResponse struct {
	ID         int64 `json:"id"`
	PropertyID int64 `json:"propertyId"`
	OccupierID int64 `json:"occupierId"`
}

type communicationService struct {
	db           *sql.DB
	store        *communicationStore
	auth         *authClient
	property     *propertyClient
	booking      *bookingClient
	consumer     kafka.Consumer
	serviceToken string
}
