package main

import (
	"net/http"
	"time"

	"rental-platform/pkg/shared/httputil"
)

func (s *communicationService) handleInternalChatsByProperty(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	propertyID, err := parseInternalPropertyPathID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	if _, code, msg := s.property.getByID(propertyID); code != http.StatusOK {
		if code == http.StatusNotFound {
			writeAPIError(w, http.StatusNotFound, msg)
			return
		}
		writeAPIError(w, http.StatusInternalServerError, "Внутренняя ошибка сервера")
		return
	}

	ownerIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "ownerId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр ownerId")
		return
	}
	occupierIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "occupierId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр occupierId")
		return
	}

	chats := s.store.listChats(func(rec *chatRecord) bool {
		if rec.PropertyID != propertyID {
			return false
		}
		if ownerIDFilter != nil && rec.OwnerID != *ownerIDFilter {
			return false
		}
		if occupierIDFilter != nil && rec.OccupierID != *occupierIDFilter {
			return false
		}
		return true
	})

	items := make([]map[string]any, 0, len(chats))
	for _, chat := range chats {
		item := map[string]any{
			"id":         chat.ID,
			"ownerId":    chat.OwnerID,
			"occupierId": chat.OccupierID,
			"bookingId":  chat.BookingID,
			"createdAt":  chat.CreatedAt.UTC().Format(time.RFC3339),
		}
		if chat.LastMessageAt != nil {
			item["lastMessageAt"] = chat.LastMessageAt.UTC().Format(time.RFC3339)
		}
		items = append(items, item)
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"chats": items,
		"total": len(items),
	})
}

func (s *communicationService) handleInternalChatByBooking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	bookingID, err := parseInternalBookingPathID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	chat, ok := s.store.findChatByBookingID(bookingID)
	if !ok {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"chat":   nil,
			"exists": false,
		})
		return
	}

	lastMessageAt := any(nil)
	if chat.LastMessageAt != nil {
		lastMessageAt = chat.LastMessageAt.UTC().Format(time.RFC3339)
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"chat": map[string]any{
			"id":            chat.ID,
			"ownerId":       chat.OwnerID,
			"occupierId":    chat.OccupierID,
			"propertyId":    chat.PropertyID,
			"bookingId":     chat.BookingID,
			"createdAt":     chat.CreatedAt.UTC().Format(time.RFC3339),
			"lastMessageAt": lastMessageAt,
		},
		"exists": true,
	})
}

func (s *communicationService) handleInternalChatParticipants(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	chatID, err := parseInternalParticipantsChatID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	chat, ok := s.store.getChat(chatID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Чат не найден")
		return
	}

	joinedAt := chat.CreatedAt.UTC().Format(time.RFC3339)
	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"chatId": chat.ID,
		"participants": []map[string]any{
			{
				"userId":   chat.OwnerID,
				"role":     "OWNER",
				"joinedAt": joinedAt,
			},
			{
				"userId":   chat.OccupierID,
				"role":     "OCCUPIER",
				"joinedAt": joinedAt,
			},
		},
	})
}

func (s *communicationService) handleInternalValidateParticipant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !validateServiceToken(r, s.serviceToken) {
		writeAPIError(w, http.StatusUnauthorized, "Неавторизован")
		return
	}

	req, err := parseValidateParticipantRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	chat, ok := s.store.getChat(req.ChatID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Чат не найден")
		return
	}

	if req.UserID == chat.OwnerID {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"isParticipant": true,
			"role":          "OWNER",
		})
		return
	}
	if req.UserID == chat.OccupierID {
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"isParticipant": true,
			"role":          "OCCUPIER",
		})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"isParticipant": false,
		"role":          nil,
	})
}
