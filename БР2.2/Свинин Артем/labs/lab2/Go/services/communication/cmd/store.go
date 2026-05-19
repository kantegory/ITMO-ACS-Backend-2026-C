package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

var errNotFound = errors.New("not found")

type communicationStore struct {
	db *sql.DB
}

type chatListParams struct {
	ViewerID   *int64
	PropertyID *int64
	BookingID  *int64
	Page       int
	PageSize   int
}

type messageListParams struct {
	ChatID   int64
	Page     int
	PageSize int
}

func newCommunicationStore(db *sql.DB) *communicationStore {
	return &communicationStore{db: db}
}

// ==================== CHATS ====================

func (s *communicationStore) createChat(rec chatRecord) *chatRecord {
	now := time.Now().UTC()
	rec.CreatedAt = now

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO chats (
			owner_id, occupier_id, property_id, booking_id, last_message_at,
			created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	err := s.db.QueryRowContext(
		ctx, query,
		rec.OwnerID,
		rec.OccupierID,
		rec.PropertyID,
		rec.BookingID,
		rec.LastMessageAt,
		rec.CreatedAt,
		now,
	).Scan(&rec.ID)

	if err != nil {
		return nil
	}

	copy := cloneChat(rec)
	return &copy
}

func (s *communicationStore) getChat(chatID int64) (*chatRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, owner_id, occupier_id, property_id, booking_id, last_message_at, created_at
		FROM chats
		WHERE id = $1
	`

	var rec chatRecord
	err := s.db.QueryRowContext(ctx, query, chatID).Scan(
		&rec.ID,
		&rec.OwnerID,
		&rec.OccupierID,
		&rec.PropertyID,
		&rec.BookingID,
		&rec.LastMessageAt,
		&rec.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	copy := cloneChat(rec)
	return &copy, true
}

func (s *communicationStore) listChats(filter func(*chatRecord) bool) []chatRecord {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	const query = `
		SELECT id, owner_id, occupier_id, property_id, booking_id, last_message_at, created_at
		FROM chats
		ORDER BY COALESCE(last_message_at, created_at) DESC
		LIMIT 1000
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return []chatRecord{}
	}
	defer rows.Close()

	var items []chatRecord
	for rows.Next() {
		var rec chatRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.OwnerID,
			&rec.OccupierID,
			&rec.PropertyID,
			&rec.BookingID,
			&rec.LastMessageAt,
			&rec.CreatedAt,
		); err != nil {
			continue
		}

		if filter != nil && !filter(&rec) {
			continue
		}
		items = append(items, cloneChat(rec))
	}

	return items
}

func (s *communicationStore) listChatsPage(params chatListParams) ([]chatRecord, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conditions := make([]string, 0, 3)
	args := make([]any, 0, 8)
	addCondition := func(expr string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(expr, len(args)))
	}

	if params.ViewerID != nil {
		args = append(args, *params.ViewerID)
		idx := len(args)
		conditions = append(conditions, fmt.Sprintf("(owner_id = $%d OR occupier_id = $%d)", idx, idx))
	}
	if params.PropertyID != nil {
		addCondition("property_id = $%d", *params.PropertyID)
	}
	if params.BookingID != nil {
		addCondition("booking_id = $%d", *params.BookingID)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := `SELECT COUNT(*) FROM chats` + whereClause
	var total int
	if err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limitArgIndex := len(args) + 1
	offsetArgIndex := len(args) + 2
	query := `
		SELECT id, owner_id, occupier_id, property_id, booking_id, last_message_at, created_at
		FROM chats
	` + whereClause + fmt.Sprintf(" ORDER BY COALESCE(last_message_at, created_at) DESC, id DESC LIMIT $%d OFFSET $%d", limitArgIndex, offsetArgIndex)

	offset := (params.Page - 1) * params.PageSize
	dataArgs := append(args, params.PageSize, offset)
	rows, err := s.db.QueryContext(ctx, query, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]chatRecord, 0, params.PageSize)
	for rows.Next() {
		var rec chatRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.OwnerID,
			&rec.OccupierID,
			&rec.PropertyID,
			&rec.BookingID,
			&rec.LastMessageAt,
			&rec.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, cloneChat(rec))
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (s *communicationStore) findChat(ownerID int64, occupierID int64, propertyID int64, bookingID int64) (*chatRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, owner_id, occupier_id, property_id, booking_id, last_message_at, created_at
		FROM chats
		WHERE owner_id = $1 AND occupier_id = $2 AND property_id = $3 AND (booking_id = $4 OR $4 = 0)
		LIMIT 1
	`

	var rec chatRecord
	err := s.db.QueryRowContext(ctx, query, ownerID, occupierID, propertyID, bookingID).Scan(
		&rec.ID,
		&rec.OwnerID,
		&rec.OccupierID,
		&rec.PropertyID,
		&rec.BookingID,
		&rec.LastMessageAt,
		&rec.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	copy := cloneChat(rec)
	return &copy, true
}

func (s *communicationStore) findChatByBookingID(bookingID int64) (*chatRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, owner_id, occupier_id, property_id, booking_id, last_message_at, created_at
		FROM chats
		WHERE booking_id = $1
		LIMIT 1
	`

	var rec chatRecord
	err := s.db.QueryRowContext(ctx, query, bookingID).Scan(
		&rec.ID,
		&rec.OwnerID,
		&rec.OccupierID,
		&rec.PropertyID,
		&rec.BookingID,
		&rec.LastMessageAt,
		&rec.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	copy := cloneChat(rec)
	return &copy, true
}

// ==================== MESSAGES ====================

func (s *communicationStore) createMessage(chatID int64, senderID int64, content string) (*messageRecord, error) {
	now := time.Now().UTC()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Create message
	const msgQuery = `
		INSERT INTO messages (
			chat_id, sender_id, content, sent_at, is_read, created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`

	var msgID int64
	if err := tx.QueryRowContext(ctx, msgQuery, chatID, senderID, content, now, false, now).Scan(&msgID); err != nil {
		return nil, err
	}

	// Update chat last_message_at
	const chatQuery = `UPDATE chats SET last_message_at = $1 WHERE id = $2`
	if _, err := tx.ExecContext(ctx, chatQuery, now, chatID); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	rec := &messageRecord{
		ID:       msgID,
		ChatID:   chatID,
		SenderID: senderID,
		Content:  content,
		SentAt:   now,
		IsRead:   false,
	}

	copy := cloneMessage(*rec)
	return &copy, nil
}

func (s *communicationStore) getMessage(messageID int64) (*messageRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, chat_id, sender_id, content, sent_at, is_read, read_at
		FROM messages
		WHERE id = $1
	`

	var rec messageRecord
	err := s.db.QueryRowContext(ctx, query, messageID).Scan(
		&rec.ID,
		&rec.ChatID,
		&rec.SenderID,
		&rec.Content,
		&rec.SentAt,
		&rec.IsRead,
		&rec.ReadAt,
	)

	if err == sql.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	copy := cloneMessage(rec)
	return &copy, true
}

func (s *communicationStore) updateMessage(messageID int64, mutator func(*messageRecord) error) (*messageRecord, error) {
	rec, ok := s.getMessage(messageID)
	if !ok {
		return nil, errNotFound
	}

	if err := mutator(rec); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		UPDATE messages
		SET is_read = $1, read_at = $2
		WHERE id = $3
	`

	_, err := s.db.ExecContext(ctx, query, rec.IsRead, rec.ReadAt, messageID)
	if err != nil {
		return nil, err
	}

	copy := cloneMessage(*rec)
	return &copy, nil
}

func (s *communicationStore) listMessages(chatID int64) []messageRecord {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	const query = `
		SELECT id, chat_id, sender_id, content, sent_at, is_read, read_at
		FROM messages
		WHERE chat_id = $1
		ORDER BY sent_at ASC, id ASC
		LIMIT 10000
	`

	rows, err := s.db.QueryContext(ctx, query, chatID)
	if err != nil {
		return []messageRecord{}
	}
	defer rows.Close()

	var items []messageRecord
	for rows.Next() {
		var rec messageRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.ChatID,
			&rec.SenderID,
			&rec.Content,
			&rec.SentAt,
			&rec.IsRead,
			&rec.ReadAt,
		); err != nil {
			continue
		}
		items = append(items, cloneMessage(rec))
	}

	return items
}

func (s *communicationStore) listMessagesPage(params messageListParams) ([]messageRecord, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var total int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM messages WHERE chat_id = $1`, params.ChatID).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (params.Page - 1) * params.PageSize
	rows, err := s.db.QueryContext(
		ctx,
		`SELECT id, chat_id, sender_id, content, sent_at, is_read, read_at
		 FROM messages
		 WHERE chat_id = $1
		 ORDER BY sent_at ASC, id ASC
		 LIMIT $2 OFFSET $3`,
		params.ChatID,
		params.PageSize,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]messageRecord, 0, params.PageSize)
	for rows.Next() {
		var rec messageRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.ChatID,
			&rec.SenderID,
			&rec.Content,
			&rec.SentAt,
			&rec.IsRead,
			&rec.ReadAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, cloneMessage(rec))
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (s *communicationStore) getLastMessage(chatID int64) (*messageRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, chat_id, sender_id, content, sent_at, is_read, read_at
		FROM messages
		WHERE chat_id = $1
		ORDER BY sent_at DESC, id DESC
		LIMIT 1
	`

	var rec messageRecord
	err := s.db.QueryRowContext(ctx, query, chatID).Scan(
		&rec.ID,
		&rec.ChatID,
		&rec.SenderID,
		&rec.Content,
		&rec.SentAt,
		&rec.IsRead,
		&rec.ReadAt,
	)

	if err == sql.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	copy := cloneMessage(rec)
	return &copy, true
}

func (s *communicationStore) unreadCount(chatID int64, viewerID int64) int {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT COUNT(*)
		FROM messages
		WHERE chat_id = $1 AND sender_id != $2 AND is_read = false
	`

	var count int
	err := s.db.QueryRowContext(ctx, query, chatID, viewerID).Scan(&count)
	if err != nil {
		return 0
	}

	return count
}

func cloneChat(rec chatRecord) chatRecord {
	out := rec
	if rec.LastMessageAt != nil {
		value := *rec.LastMessageAt
		out.LastMessageAt = &value
	}
	return out
}

func cloneMessage(rec messageRecord) messageRecord {
	out := rec
	if rec.ReadAt != nil {
		value := *rec.ReadAt
		out.ReadAt = &value
	}
	return out
}
