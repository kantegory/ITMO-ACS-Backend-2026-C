package main

import (
	"net/http"
	"time"

	"rental-platform/pkg/shared/httputil"
)

func (s *communicationService) handleChats(w http.ResponseWriter, r *http.Request) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	switch r.Method {
	case http.MethodPost:
		s.handleCreateChat(w, r, actor, token)
	case http.MethodGet:
		s.handleListChats(w, r, actor)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *communicationService) handleChatByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	chatID, err := parseChatPathID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	chat, ok := s.store.getChat(chatID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Чат не найден")
		return
	}
	if !canAccessChat(actor, chat) {
		writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, s.toChatResponse(*chat, actor.UserID))
}

func (s *communicationService) handleMessages(w http.ResponseWriter, r *http.Request) {
	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	switch r.Method {
	case http.MethodPost:
		s.handleSendMessage(w, r, actor)
	case http.MethodGet:
		s.handleListMessages(w, r, actor)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *communicationService) handleMessageByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		writeMethodNotAllowed(w)
		return
	}

	messageID, err := parseMessagePathID(r.URL.Path)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, "Маршрут не найден")
		return
	}

	token := parseBearerToken(r)
	actor, code, msg := s.auth.authenticate(token)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	message, ok := s.store.getMessage(messageID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Сообщение не найдено")
		return
	}

	chat, ok := s.store.getChat(message.ChatID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Чат не найден")
		return
	}
	if !canAccessChat(actor, chat) {
		writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
		return
	}

	if message.IsRead || message.SenderID == actor.UserID {
		httputil.WriteJSON(w, http.StatusOK, toMessageResponse(*message))
		return
	}

	updated, err := s.store.updateMessage(message.ID, func(target *messageRecord) error {
		now := time.Now().UTC()
		target.IsRead = true
		target.ReadAt = &now
		return nil
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось обновить сообщение")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, toMessageResponse(*updated))
}

func (s *communicationService) handleCreateChat(w http.ResponseWriter, r *http.Request, actor principal, accessToken string) {
	req, err := parseCreateChatRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	property, code, msg := s.property.getByID(req.PropertyID)
	if code != http.StatusOK {
		writeAPIError(w, code, msg)
		return
	}

	ownerID := property.OwnerID
	if ownerID <= 0 {
		writeAPIError(w, http.StatusServiceUnavailable, "Ошибка данных объекта")
		return
	}

	occupierID := actor.UserID
	if req.BookingID > 0 {
		booking, bookingCode, bookingMsg := s.booking.getByID(req.BookingID, accessToken)
		if bookingCode != http.StatusOK {
			writeAPIError(w, bookingCode, bookingMsg)
			return
		}
		if booking.PropertyID > 0 && booking.PropertyID != req.PropertyID {
			writeAPIError(w, http.StatusBadRequest, "bookingId не соответствует propertyId")
			return
		}
		occupierID = booking.OccupierID
	}

	if occupierID <= 0 {
		writeAPIError(w, http.StatusBadRequest, "Не удалось определить участника чата")
		return
	}
	if ownerID == occupierID {
		writeAPIError(w, http.StatusBadRequest, "Владелец и гость не могут совпадать")
		return
	}
	if actor.UserID != ownerID && actor.UserID != occupierID && !isAdmin(actor) {
		writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
		return
	}

	if existing, ok := s.store.findChat(ownerID, occupierID, req.PropertyID, req.BookingID); ok {
		httputil.WriteJSON(w, http.StatusConflict, map[string]any{
			"code":    http.StatusConflict,
			"message": "Чат уже существует",
			"chat":    s.toChatResponse(*existing, actor.UserID),
		})
		return
	}

	created := s.store.createChat(chatRecord{
		OwnerID:    ownerID,
		OccupierID: occupierID,
		PropertyID: req.PropertyID,
		BookingID:  req.BookingID,
	})
	if created == nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось создать чат")
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, s.toChatResponse(*created, actor.UserID))
}

func (s *communicationService) handleListChats(w http.ResponseWriter, r *http.Request, actor principal) {
	propertyIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "propertyId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр propertyId")
		return
	}
	bookingIDFilter, ok := parseOptionalInt64Query(r.URL.Query(), "bookingId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр bookingId")
		return
	}
	page, ok := parsePositiveIntQuery(r.URL.Query(), "page", 1)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр page")
		return
	}
	pageSize, ok := parsePositiveIntQuery(r.URL.Query(), "pageSize", 10)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр pageSize")
		return
	}

	var viewerID *int64
	if !isAdmin(actor) {
		viewerID = &actor.UserID
	}

	chats, total, err := s.store.listChatsPage(chatListParams{
		ViewerID:   viewerID,
		PropertyID: propertyIDFilter,
		BookingID:  bookingIDFilter,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список чатов")
		return
	}

	responses := make([]chatResponse, 0, len(chats))
	for _, item := range chats {
		responses = append(responses, s.toChatResponse(item, actor.UserID))
	}

	httputil.WriteJSON(w, http.StatusOK, paginatedChatsResponse{
		Items:    responses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (s *communicationService) handleSendMessage(w http.ResponseWriter, r *http.Request, actor principal) {
	req, err := parseSendMessageRequest(r)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	chat, ok := s.store.getChat(req.ChatID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Чат не найден")
		return
	}
	if !canAccessChat(actor, chat) {
		writeAPIError(w, http.StatusForbidden, "Только участники чата могут отправлять сообщения")
		return
	}

	created, err := s.store.createMessage(req.ChatID, actor.UserID, req.Content)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось отправить сообщение")
		return
	}
	if created == nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось отправить сообщение")
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, toMessageResponse(*created))
}

func (s *communicationService) handleListMessages(w http.ResponseWriter, r *http.Request, actor principal) {
	chatID, ok := parseRequiredInt64Query(r.URL.Query(), "chatId")
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр chatId")
		return
	}
	page, ok := parsePositiveIntQuery(r.URL.Query(), "page", 1)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр page")
		return
	}
	pageSize, ok := parsePositiveIntQuery(r.URL.Query(), "pageSize", 20)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "Некорректный параметр pageSize")
		return
	}

	chat, ok := s.store.getChat(chatID)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Чат не найден")
		return
	}
	if !canAccessChat(actor, chat) {
		writeAPIError(w, http.StatusForbidden, "Доступ запрещен")
		return
	}

	messages, total, err := s.store.listMessagesPage(messageListParams{
		ChatID:   chatID,
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить сообщения")
		return
	}

	responses := make([]messageResponse, 0, len(messages))
	for _, item := range messages {
		responses = append(responses, toMessageResponse(item))
	}

	httputil.WriteJSON(w, http.StatusOK, paginatedMessagesResponse{
		Items:    responses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}
