package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
	"rental-platform/pkg/shared/pagination"
)

var writeAPIError = httputil.WriteError
var writeMethodNotAllowed = httputil.WriteMethodNotAllowed
var parsePositiveIntQuery = httputil.ParsePositiveIntQuery
var parseBearerToken = httputil.ParseBearerToken
var parseChatPathID = func(path string) (int64, error) {
	return httputil.ParsePathID(path, "chats")
}
var parseMessagePathID = func(path string) (int64, error) {
	return httputil.ParsePathID(path, "messages")
}
var parseOptionalInt64Query = httputil.ParseOptionalInt64

func getenv(key string, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}

func normalizePort(port string) string {
	p := strings.TrimSpace(port)
	if p == "" {
		return ":8087"
	}
	if strings.HasPrefix(p, ":") {
		return p
	}
	return ":" + p
}

func validateServiceToken(r *http.Request, expected string) bool {
	given := strings.TrimSpace(r.Header.Get("X-Service-Token"))
	if given == "" {
		return false
	}
	return given == strings.TrimSpace(expected)
}

func parseInternalPropertyPathID(path string) (int64, error) {
	prefix := "/internal/chats/by-property/"
	if !strings.HasPrefix(path, prefix) {
		return 0, errors.New("invalid path")
	}
	rawID := strings.Trim(strings.TrimSpace(path[len(prefix):]), "/")
	id, err := strconv.ParseInt(rawID, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid property id")
	}
	return id, nil
}

func parseInternalBookingPathID(path string) (int64, error) {
	prefix := "/internal/chats/by-booking/"
	if !strings.HasPrefix(path, prefix) {
		return 0, errors.New("invalid path")
	}
	rawID := strings.Trim(strings.TrimSpace(path[len(prefix):]), "/")
	id, err := strconv.ParseInt(rawID, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid booking id")
	}
	return id, nil
}

func parseInternalParticipantsChatID(path string) (int64, error) {
	prefix := "/internal/chats/"
	if !strings.HasPrefix(path, prefix) {
		return 0, errors.New("invalid path")
	}
	rest := strings.Trim(strings.TrimSpace(path[len(prefix):]), "/")
	parts := strings.Split(rest, "/")
	if len(parts) != 2 || parts[1] != "participants" {
		return 0, errors.New("invalid path")
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}

func parseRequiredInt64Query(values map[string][]string, key string) (int64, bool) {
	raw := strings.TrimSpace(firstQueryValue(values, key))
	if raw == "" {
		return 0, false
	}
	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || value <= 0 {
		return 0, false
	}
	return value, true
}

func firstQueryValue(values map[string][]string, key string) string {
	list := values[key]
	if len(list) == 0 {
		return ""
	}
	return list[0]
}

func parseCreateChatRequest(r *http.Request) (createChatRequest, error) {
	var req createChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return createChatRequest{}, errors.New("Некорректный JSON")
	}
	if req.PropertyID <= 0 {
		return createChatRequest{}, errors.New("Поле propertyId обязательно")
	}
	if req.BookingID < 0 {
		return createChatRequest{}, errors.New("Некорректный bookingId")
	}
	return req, nil
}

func parseSendMessageRequest(r *http.Request) (sendMessageRequest, error) {
	var req sendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return sendMessageRequest{}, errors.New("Некорректный JSON")
	}
	if req.ChatID <= 0 {
		return sendMessageRequest{}, errors.New("Поле chatId обязательно")
	}
	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		return sendMessageRequest{}, errors.New("Сообщение не может быть пустым")
	}
	if len(req.Content) > 5000 {
		return sendMessageRequest{}, errors.New("Сообщение превышает максимальную длину")
	}
	return req, nil
}

func parseValidateParticipantRequest(r *http.Request) (validateParticipantRequest, error) {
	var req validateParticipantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return validateParticipantRequest{}, errors.New("Некорректный JSON")
	}
	if req.ChatID <= 0 {
		return validateParticipantRequest{}, errors.New("Поле chatId обязательно")
	}
	if req.UserID <= 0 {
		return validateParticipantRequest{}, errors.New("Поле userId обязательно")
	}
	return req, nil
}

func isAdmin(p principal) bool {
	return strings.EqualFold(p.Role, "ADMIN")
}

func canAccessChat(actor principal, chat *chatRecord) bool {
	if isAdmin(actor) {
		return true
	}
	if actor.UserID == chat.OwnerID {
		return true
	}
	if actor.UserID == chat.OccupierID {
		return true
	}
	return false
}

func toMessageResponse(rec messageRecord) messageResponse {
	response := messageResponse{
		ID:       rec.ID,
		ChatID:   rec.ChatID,
		SenderID: rec.SenderID,
		Content:  rec.Content,
		SentAt:   rec.SentAt.UTC().Format(time.RFC3339),
		IsRead:   rec.IsRead,
	}
	if rec.ReadAt != nil {
		response.ReadAt = rec.ReadAt.UTC().Format(time.RFC3339)
	}
	return response
}

func (s *communicationService) toChatResponse(rec chatRecord, viewerID int64) chatResponse {
	response := chatResponse{
		ID:         rec.ID,
		OwnerID:    rec.OwnerID,
		OccupierID: rec.OccupierID,
		PropertyID: rec.PropertyID,
		BookingID:  rec.BookingID,
		CreatedAt:  rec.CreatedAt.UTC().Format(time.RFC3339),
	}
	if rec.LastMessageAt != nil {
		response.LastMessageAt = rec.LastMessageAt.UTC().Format(time.RFC3339)
	}
	if last, ok := s.store.getLastMessage(rec.ID); ok {
		lastMessage := toMessageResponse(*last)
		response.LastMessage = &lastMessage
	}
	if viewerID > 0 {
		response.UnreadCount = s.store.unreadCount(rec.ID, viewerID)
	}
	return response
}

func paginateChats(items []chatRecord, page int, pageSize int) ([]chatRecord, int) {
	return pagination.Paginate(items, page, pageSize)
}

func paginateMessages(items []messageRecord, page int, pageSize int) ([]messageRecord, int) {
	return pagination.Paginate(items, page, pageSize)
}
