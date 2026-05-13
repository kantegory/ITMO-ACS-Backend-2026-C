package main

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strings"
	"time"
)

type propertyListParams struct {
	OwnerID     *int64
	Search      string
	City        string
	MinPrice    *float64
	MaxPrice    *float64
	MinArea     *int
	MaxArea     *int
	Bedrooms    *int
	Bathrooms   *int
	MaxGuests   *int
	TypeID      *int
	IsAvailable *bool
	Facilities  []int64
	Page        int
	PageSize    int
}

var defaultFacilities = []facility{
	{ID: 1, Type: "WiFi"},
	{ID: 2, Type: "Кондиционер"},
	{ID: 3, Type: "Парковка"},
	{ID: 4, Type: "Бассейн"},
}

func newPropertyStore(db *sql.DB) *propertyStore {
	return &propertyStore{db: db}
}

func (s *propertyStore) createAddress(req addressCreateRequest) *address {
	addr := &address{
		Country:     strings.TrimSpace(req.Country),
		City:        strings.TrimSpace(req.City),
		District:    strings.TrimSpace(req.District),
		HouseNumber: strings.TrimSpace(req.HouseNumber),
		Apartment:   strings.TrimSpace(req.Apartment),
		PostalCode:  strings.TrimSpace(req.PostalCode),
		Lat:         req.Lat,
		Lon:         req.Lon,
	}
	addr.FullAddress = buildFullAddress(addr)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO addresses (
			country, city, district, house_number, apartment, postal_code, lat, lon, full_address
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id
	`

	lat := toNullFloat(addr.Lat)
	lon := toNullFloat(addr.Lon)

	if err := s.db.QueryRowContext(
		ctx,
		query,
		addr.Country,
		addr.City,
		addr.District,
		addr.HouseNumber,
		addr.Apartment,
		addr.PostalCode,
		lat,
		lon,
		addr.FullAddress,
	).Scan(&addr.ID); err != nil {
		return nil
	}

	return addr
}

func (s *propertyStore) createProperty(ownerID int64, req propertyCreateRequest) *propertyRecord {
	typeID := req.TypeID
	if typeID <= 0 {
		typeID = 1
	}

	isAvailable := true
	if req.IsAvailable != nil {
		isAvailable = *req.IsAvailable
	}

	now := time.Now().UTC()
	rec := &propertyRecord{
		OwnerID:       ownerID,
		TypeID:        typeID,
		AddressID:     req.AddressID,
		Title:         strings.TrimSpace(req.Title),
		Description:   strings.TrimSpace(req.Description),
		PricePerDay:   req.PricePerDay,
		PricePerMonth: req.PricePerMonth,
		AreaSqM:       req.AreaSqM,
		MaxGuests:     req.MaxGuests,
		Bedrooms:      req.Bedrooms,
		Bathrooms:     req.Bathrooms,
		IsAvailable:   isAvailable,
		MinRentDays:   req.MinRentDays,
		MaxRentDays:   req.MaxRentDays,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		INSERT INTO properties (
			owner_id, type_id, address_id, title, description, price_per_day,
			price_per_month, area_sqm, max_guests, bedrooms, bathrooms,
			is_available, min_rent_days, max_rent_days, created_at, updated_at
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		RETURNING id
	`

	if err := s.db.QueryRowContext(
		ctx,
		query,
		rec.OwnerID,
		rec.TypeID,
		rec.AddressID,
		rec.Title,
		rec.Description,
		rec.PricePerDay,
		rec.PricePerMonth,
		rec.AreaSqM,
		rec.MaxGuests,
		rec.Bedrooms,
		rec.Bathrooms,
		rec.IsAvailable,
		rec.MinRentDays,
		rec.MaxRentDays,
		rec.CreatedAt,
		rec.UpdatedAt,
	).Scan(&rec.ID); err != nil {
		return nil
	}

	rec.FacilityIDs = []int64{}
	rec.ImageIDs = []int64{}
	return rec
}

func (s *propertyStore) getAddress(addressID int64) (*address, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, country, city, district, house_number, apartment, postal_code, lat, lon, full_address
		FROM addresses
		WHERE id = $1
	`

	var addr address
	var lat, lon sql.NullFloat64
	if err := s.db.QueryRowContext(ctx, query, addressID).Scan(
		&addr.ID,
		&addr.Country,
		&addr.City,
		&addr.District,
		&addr.HouseNumber,
		&addr.Apartment,
		&addr.PostalCode,
		&lat,
		&lon,
		&addr.FullAddress,
	); err != nil {
		return nil, false
	}

	if lat.Valid {
		addr.Lat = &lat.Float64
	}
	if lon.Valid {
		addr.Lon = &lon.Float64
	}

	return &addr, true
}

func (s *propertyStore) getProperty(propertyID int64) (*propertyRecord, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, owner_id, type_id, address_id, title, description, price_per_day, price_per_month,
			area_sqm, max_guests, bedrooms, bathrooms, is_available, min_rent_days, max_rent_days,
			created_at, updated_at
		FROM properties
		WHERE id = $1
	`

	var rec propertyRecord
	if err := s.db.QueryRowContext(ctx, query, propertyID).Scan(
		&rec.ID,
		&rec.OwnerID,
		&rec.TypeID,
		&rec.AddressID,
		&rec.Title,
		&rec.Description,
		&rec.PricePerDay,
		&rec.PricePerMonth,
		&rec.AreaSqM,
		&rec.MaxGuests,
		&rec.Bedrooms,
		&rec.Bathrooms,
		&rec.IsAvailable,
		&rec.MinRentDays,
		&rec.MaxRentDays,
		&rec.CreatedAt,
		&rec.UpdatedAt,
	); err != nil {
		return nil, false
	}

	rec.FacilityIDs = s.listFacilityIDs(propertyID)
	rec.ImageIDs = s.listImageIDs(propertyID)

	return &rec, true
}

func (s *propertyStore) listProperties(filter func(*propertyRecord) bool) []*propertyRecord {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		SELECT id, owner_id, type_id, address_id, title, description, price_per_day, price_per_month,
			area_sqm, max_guests, bedrooms, bathrooms, is_available, min_rent_days, max_rent_days,
			created_at, updated_at
		FROM properties
		ORDER BY id
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil
	}
	defer rows.Close()

	items := make([]*propertyRecord, 0)
	for rows.Next() {
		var rec propertyRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.OwnerID,
			&rec.TypeID,
			&rec.AddressID,
			&rec.Title,
			&rec.Description,
			&rec.PricePerDay,
			&rec.PricePerMonth,
			&rec.AreaSqM,
			&rec.MaxGuests,
			&rec.Bedrooms,
			&rec.Bathrooms,
			&rec.IsAvailable,
			&rec.MinRentDays,
			&rec.MaxRentDays,
			&rec.CreatedAt,
			&rec.UpdatedAt,
		); err != nil {
			continue
		}

		rec.FacilityIDs = s.listFacilityIDs(rec.ID)
		rec.ImageIDs = s.listImageIDs(rec.ID)
		copyRec := rec

		if filter != nil && !filter(&copyRec) {
			continue
		}

		items = append(items, &copyRec)
	}

	sort.Slice(items, func(i int, j int) bool {
		return items[i].ID < items[j].ID
	})

	return items
}

func (s *propertyStore) listPropertiesPage(params propertyListParams) ([]*propertyRecord, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conditions := make([]string, 0, 12)
	args := make([]any, 0, 20)
	addCondition := func(expr string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(expr, len(args)))
	}

	if params.OwnerID != nil {
		addCondition("owner_id = $%d", *params.OwnerID)
	}
	if params.Search != "" {
		like := "%" + strings.ToLower(strings.TrimSpace(params.Search)) + "%"
		args = append(args, like)
		idx := len(args)
		conditions = append(conditions, fmt.Sprintf("(LOWER(title) LIKE $%d OR LOWER(description) LIKE $%d)", idx, idx))
	}
	if params.City != "" {
		city := strings.ToLower(strings.TrimSpace(params.City))
		args = append(args, city)
		idx := len(args)
		conditions = append(conditions, fmt.Sprintf("EXISTS (SELECT 1 FROM addresses a WHERE a.id = properties.address_id AND LOWER(TRIM(a.city)) = $%d)", idx))
	}
	if params.MinPrice != nil {
		addCondition("price_per_day >= $%d", *params.MinPrice)
	}
	if params.MaxPrice != nil {
		addCondition("price_per_day <= $%d", *params.MaxPrice)
	}
	if params.MinArea != nil {
		addCondition("area_sqm >= $%d", *params.MinArea)
	}
	if params.MaxArea != nil {
		addCondition("area_sqm <= $%d", *params.MaxArea)
	}
	if params.Bedrooms != nil {
		addCondition("bedrooms = $%d", *params.Bedrooms)
	}
	if params.Bathrooms != nil {
		addCondition("bathrooms = $%d", *params.Bathrooms)
	}
	if params.MaxGuests != nil {
		addCondition("max_guests >= $%d", *params.MaxGuests)
	}
	if params.TypeID != nil {
		addCondition("type_id = $%d", int64(*params.TypeID))
	}
	if params.IsAvailable != nil {
		addCondition("is_available = $%d", *params.IsAvailable)
	}
	for _, facilityID := range params.Facilities {
		args = append(args, facilityID)
		idx := len(args)
		conditions = append(conditions, fmt.Sprintf("EXISTS (SELECT 1 FROM property_facilities pf WHERE pf.property_id = properties.id AND pf.facility_id = $%d)", idx))
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := `SELECT COUNT(*) FROM properties` + whereClause
	var total int
	if err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limitArgIndex := len(args) + 1
	offsetArgIndex := len(args) + 2
	query := `
		SELECT id, owner_id, type_id, address_id, title, description, price_per_day, price_per_month,
			area_sqm, max_guests, bedrooms, bathrooms, is_available, min_rent_days, max_rent_days,
			created_at, updated_at
		FROM properties
	` + whereClause + fmt.Sprintf(" ORDER BY id LIMIT $%d OFFSET $%d", limitArgIndex, offsetArgIndex)

	offset := (params.Page - 1) * params.PageSize
	dataArgs := append(args, params.PageSize, offset)
	rows, err := s.db.QueryContext(ctx, query, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]*propertyRecord, 0, params.PageSize)
	for rows.Next() {
		var rec propertyRecord
		if err := rows.Scan(
			&rec.ID,
			&rec.OwnerID,
			&rec.TypeID,
			&rec.AddressID,
			&rec.Title,
			&rec.Description,
			&rec.PricePerDay,
			&rec.PricePerMonth,
			&rec.AreaSqM,
			&rec.MaxGuests,
			&rec.Bedrooms,
			&rec.Bathrooms,
			&rec.IsAvailable,
			&rec.MinRentDays,
			&rec.MaxRentDays,
			&rec.CreatedAt,
			&rec.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		rec.FacilityIDs = s.listFacilityIDs(rec.ID)
		rec.ImageIDs = s.listImageIDs(rec.ID)
		copyRec := rec
		items = append(items, &copyRec)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (s *propertyStore) updateProperty(propertyID int64, req propertyUpdateRequest) *propertyRecord {
	rec, ok := s.getProperty(propertyID)
	if !ok {
		return nil
	}

	if req.TypeID != nil {
		rec.TypeID = *req.TypeID
	}
	if req.AddressID != nil {
		rec.AddressID = *req.AddressID
	}
	if req.Title != nil {
		rec.Title = strings.TrimSpace(*req.Title)
	}
	if req.Description != nil {
		rec.Description = strings.TrimSpace(*req.Description)
	}
	if req.PricePerDay != nil {
		rec.PricePerDay = *req.PricePerDay
	}
	if req.PricePerMonth != nil {
		rec.PricePerMonth = *req.PricePerMonth
	}
	if req.AreaSqM != nil {
		rec.AreaSqM = *req.AreaSqM
	}
	if req.MaxGuests != nil {
		rec.MaxGuests = *req.MaxGuests
	}
	if req.Bedrooms != nil {
		rec.Bedrooms = *req.Bedrooms
	}
	if req.Bathrooms != nil {
		rec.Bathrooms = *req.Bathrooms
	}
	if req.IsAvailable != nil {
		rec.IsAvailable = *req.IsAvailable
	}
	if req.MinRentDays != nil {
		rec.MinRentDays = *req.MinRentDays
	}
	if req.MaxRentDays != nil {
		rec.MaxRentDays = *req.MaxRentDays
	}

	rec.UpdatedAt = time.Now().UTC()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `
		UPDATE properties
		SET owner_id = $1,
			type_id = $2,
			address_id = $3,
			title = $4,
			description = $5,
			price_per_day = $6,
			price_per_month = $7,
			area_sqm = $8,
			max_guests = $9,
			bedrooms = $10,
			bathrooms = $11,
			is_available = $12,
			min_rent_days = $13,
			max_rent_days = $14,
			updated_at = $15
		WHERE id = $16
	`

	_, _ = s.db.ExecContext(
		ctx,
		query,
		rec.OwnerID,
		rec.TypeID,
		rec.AddressID,
		rec.Title,
		rec.Description,
		rec.PricePerDay,
		rec.PricePerMonth,
		rec.AreaSqM,
		rec.MaxGuests,
		rec.Bedrooms,
		rec.Bathrooms,
		rec.IsAvailable,
		rec.MinRentDays,
		rec.MaxRentDays,
		rec.UpdatedAt,
		rec.ID,
	)

	return rec
}

func (s *propertyStore) deleteProperty(propertyID int64) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, _ = s.db.ExecContext(ctx, "DELETE FROM images WHERE property_id = $1", propertyID)
	_, _ = s.db.ExecContext(ctx, "DELETE FROM property_facilities WHERE property_id = $1", propertyID)
	_, _ = s.db.ExecContext(ctx, "DELETE FROM properties WHERE id = $1", propertyID)
}

func (s *propertyStore) addImage(propertyID int64, imageURL string, isMain bool) *image {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if isMain {
		_, _ = s.db.ExecContext(ctx, "UPDATE images SET is_main = false WHERE property_id = $1", propertyID)
	}

	const query = `
		INSERT INTO images (property_id, image_url, is_main, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`

	img := &image{PropertyID: propertyID, ImageURL: imageURL, IsMain: isMain}
	if err := s.db.QueryRowContext(ctx, query, propertyID, imageURL, isMain, time.Now().UTC()).Scan(&img.ID, &img.CreatedAt); err != nil {
		return nil
	}

	return img
}

func (s *propertyStore) listPropertyImages(imageIDs []int64) []image {
	if len(imageIDs) == 0 {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := buildInQuery("SELECT id, property_id, image_url, is_main, created_at FROM images WHERE id IN (", len(imageIDs))
	rows, err := s.db.QueryContext(ctx, query, argsFromIDs(imageIDs)...)
	if err != nil {
		return nil
	}
	defer rows.Close()

	items := make([]image, 0, len(imageIDs))
	for rows.Next() {
		var img image
		if err := rows.Scan(&img.ID, &img.PropertyID, &img.ImageURL, &img.IsMain, &img.CreatedAt); err != nil {
			continue
		}
		items = append(items, img)
	}

	return items
}

func (s *propertyStore) listFacilitiesByID(ids []int64) []facility {
	if len(ids) == 0 {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := buildInQuery("SELECT id, type, created_at, updated_at FROM facilities WHERE id IN (", len(ids))
	rows, err := s.db.QueryContext(ctx, query, argsFromIDs(ids)...)
	if err != nil {
		return nil
	}
	defer rows.Close()

	items := make([]facility, 0, len(ids))
	for rows.Next() {
		var f facility
		if err := rows.Scan(&f.ID, &f.Type, &f.CreatedAt, &f.UpdatedAt); err != nil {
			continue
		}
		items = append(items, f)
	}

	return items
}

func (s *propertyStore) listFacilities() []facility {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, "SELECT id, type, created_at, updated_at FROM facilities ORDER BY id")
	if err != nil {
		return nil
	}
	defer rows.Close()

	items := make([]facility, 0)
	for rows.Next() {
		var f facility
		if err := rows.Scan(&f.ID, &f.Type, &f.CreatedAt, &f.UpdatedAt); err != nil {
			continue
		}
		items = append(items, f)
	}
	return items
}

func (s *propertyStore) listFacilityIDs(propertyID int64) []int64 {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, "SELECT facility_id FROM property_facilities WHERE property_id = $1 ORDER BY facility_id", propertyID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	ids := make([]int64, 0)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			continue
		}
		ids = append(ids, id)
	}

	return ids
}

func (s *propertyStore) listImageIDs(propertyID int64) []int64 {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, "SELECT id FROM images WHERE property_id = $1 ORDER BY id", propertyID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	ids := make([]int64, 0)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			continue
		}
		ids = append(ids, id)
	}

	return ids
}

func buildInQuery(prefix string, count int) string {
	placeholders := make([]string, count)
	for i := range placeholders {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}
	return prefix + strings.Join(placeholders, ",") + ")"
}

func argsFromIDs(ids []int64) []any {
	args := make([]any, 0, len(ids))
	for _, id := range ids {
		args = append(args, id)
	}
	return args
}
