package main

import (
	"net/http"
	"strings"
	"time"

	"rental-platform/pkg/shared/httputil"
)

func (s *propertyService) handleProperties(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.handleListProperties(w, r)
	case http.MethodPost:
		s.handleCreateProperty(w, r)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *propertyService) handlePropertyByID(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePathID(r.URL.Path, "/properties/")
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.handleGetPropertyByID(w, id)
	case http.MethodPatch:
		s.handleUpdateProperty(w, r, id)
	case http.MethodDelete:
		s.handleDeleteProperty(w, r, id)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *propertyService) handlePropertiesMy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	availableFilter, err := parseOptionalBool(r.URL.Query().Get("isAvailable"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра isAvailable")
		return
	}

	page := parseQueryInt(r, "page", 1, 1, 100000)
	pageSize := parseQueryInt(r, "pageSize", 10, 1, 100)

	items, total, err := s.store.listPropertiesPage(propertyListParams{
		OwnerID:     &p.UserID,
		IsAvailable: availableFilter,
		Page:        page,
		PageSize:    pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список объектов")
		return
	}

	s.respondWithPropertyPage(w, items, total, page, pageSize)
}

func (s *propertyService) handleAddresses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	if _, ok := s.authenticate(w, r); !ok {
		return
	}

	var req addressCreateRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := validateAddressCreate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	addr := s.store.createAddress(req)
	httputil.WriteJSON(w, http.StatusCreated, addr)
}

func (s *propertyService) handleFacilities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	httputil.WriteJSON(w, http.StatusOK, s.store.listFacilities())
}

func (s *propertyService) handleImages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	var req addImageRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	req.ImageURL = strings.TrimSpace(req.ImageURL)
	if req.PropertyID <= 0 || req.ImageURL == "" {
		writeAPIError(w, http.StatusBadRequest, "propertyId и imageUrl обязательны")
		return
	}

	prop, exists := s.store.getProperty(req.PropertyID)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	if !canManageProperty(p, prop.OwnerID) {
		writeAPIError(w, http.StatusForbidden, "Только владелец может редактировать объект")
		return
	}

	img := s.store.addImage(req.PropertyID, req.ImageURL, req.IsMain)
	httputil.WriteJSON(w, http.StatusCreated, img)
}

func (s *propertyService) handleListProperties(w http.ResponseWriter, r *http.Request) {
	page := parseQueryInt(r, "page", 1, 1, 100000)
	pageSize := parseQueryInt(r, "pageSize", 10, 1, 100)

	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	city := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("city")))

	minPrice, err := parseOptionalFloat(r.URL.Query().Get("minPricePerDay"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра minPricePerDay")
		return
	}

	maxPrice, err := parseOptionalFloat(r.URL.Query().Get("maxPricePerDay"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра maxPricePerDay")
		return
	}

	minArea, err := parseOptionalInt(r.URL.Query().Get("minArea"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра minArea")
		return
	}

	maxArea, err := parseOptionalInt(r.URL.Query().Get("maxArea"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра maxArea")
		return
	}

	bedrooms, err := parseOptionalInt(r.URL.Query().Get("bedrooms"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра bedrooms")
		return
	}

	bathrooms, err := parseOptionalInt(r.URL.Query().Get("bathrooms"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра bathrooms")
		return
	}

	maxGuests, err := parseOptionalInt(r.URL.Query().Get("maxGuests"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра maxGuests")
		return
	}

	typeID, err := parseOptionalInt(r.URL.Query().Get("typeId"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра typeId")
		return
	}

	availableFilter, err := parseOptionalBool(r.URL.Query().Get("isAvailable"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра isAvailable")
		return
	}
	facilitiesFilter, err := parseOptionalInt64CSV(r.URL.Query().Get("facilities"))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректное значение параметра facilities")
		return
	}

	items, total, err := s.store.listPropertiesPage(propertyListParams{
		Search:      search,
		City:        city,
		MinPrice:    minPrice,
		MaxPrice:    maxPrice,
		MinArea:     minArea,
		MaxArea:     maxArea,
		Bedrooms:    bedrooms,
		Bathrooms:   bathrooms,
		MaxGuests:   maxGuests,
		TypeID:      typeID,
		IsAvailable: availableFilter,
		Facilities:  facilitiesFilter,
		Page:        page,
		PageSize:    pageSize,
	})
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "Не удалось получить список объектов")
		return
	}

	s.respondWithPropertyPage(w, items, total, page, pageSize)
}

func (s *propertyService) handleCreateProperty(w http.ResponseWriter, r *http.Request) {
	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	var req propertyCreateRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := validatePropertyCreate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	if _, exists := s.store.getAddress(req.AddressID); !exists {
		writeAPIError(w, http.StatusBadRequest, "Указанный addressId не найден")
		return
	}

	rec := s.store.createProperty(p.UserID, req)
	resp := s.buildPropertyResponse(rec)
	httputil.WriteJSON(w, http.StatusCreated, resp)
}

func (s *propertyService) handleGetPropertyByID(w http.ResponseWriter, id int64) {
	rec, ok := s.store.getProperty(id)
	if !ok {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, s.buildPropertyResponse(rec))
}

func (s *propertyService) handleUpdateProperty(w http.ResponseWriter, r *http.Request, id int64) {
	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	rec, exists := s.store.getProperty(id)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	if !canManageProperty(p, rec.OwnerID) {
		writeAPIError(w, http.StatusForbidden, "Только владелец может редактировать объект")
		return
	}

	var req propertyUpdateRequest
	if err := httputil.ReadJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "Некорректный JSON")
		return
	}

	if err := validatePropertyUpdate(req); err != nil {
		writeAPIError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.AddressID != nil {
		if _, ok := s.store.getAddress(*req.AddressID); !ok {
			writeAPIError(w, http.StatusBadRequest, "Указанный addressId не найден")
			return
		}
	}

	updated := s.store.updateProperty(id, req)
	httputil.WriteJSON(w, http.StatusOK, s.buildPropertyResponse(updated))
}

func (s *propertyService) handleDeleteProperty(w http.ResponseWriter, r *http.Request, id int64) {
	p, ok := s.authenticate(w, r)
	if !ok {
		return
	}

	rec, exists := s.store.getProperty(id)
	if !exists {
		writeAPIError(w, http.StatusNotFound, "Объект недвижимости не найден")
		return
	}

	if !canManageProperty(p, rec.OwnerID) {
		writeAPIError(w, http.StatusForbidden, "Только владелец может редактировать объект")
		return
	}

	active, status, err := s.booking.hasActiveBookings(id)
	if err != nil {
		writeAPIError(w, status, err.Error())
		return
	}
	if active {
		writeAPIError(w, http.StatusConflict, "Нельзя удалить объект с активными бронированиями")
		return
	}

	s.store.deleteProperty(id)
	w.WriteHeader(http.StatusNoContent)
}

func (s *propertyService) respondWithPropertyPage(w http.ResponseWriter, items []*propertyRecord, total int, page int, pageSize int) {
	responses := make([]propertyResponse, 0, len(items))
	for _, rec := range items {
		if rec == nil {
			continue
		}
		responses = append(responses, s.buildPropertyResponse(rec))
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"items":    responses,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func (s *propertyService) buildPropertyResponse(rec *propertyRecord) propertyResponse {
	if rec == nil {
		return propertyResponse{}
	}

	addr, _ := s.store.getAddress(rec.AddressID)
	images := s.store.listPropertyImages(rec.ImageIDs)
	facilities := s.store.listFacilitiesByID(rec.FacilityIDs)

	typ, hasType := propertyTypes[rec.TypeID]
	var typeData *propertyType
	if hasType {
		copyType := typ
		typeData = &copyType
	}

	owner, _, ownerErr := s.auth.getUserByID(rec.OwnerID)
	if ownerErr != nil {
		owner = nil
	}

	return propertyResponse{
		ID:            rec.ID,
		OwnerID:       rec.OwnerID,
		TypeID:        rec.TypeID,
		Owner:         owner,
		Type:          typeData,
		AddressID:     rec.AddressID,
		Address:       addr,
		Title:         rec.Title,
		Description:   rec.Description,
		PricePerDay:   rec.PricePerDay,
		PricePerMonth: rec.PricePerMonth,
		AreaSqM:       rec.AreaSqM,
		MaxGuests:     rec.MaxGuests,
		Bedrooms:      rec.Bedrooms,
		Bathrooms:     rec.Bathrooms,
		IsAvailable:   rec.IsAvailable,
		MinRentDays:   rec.MinRentDays,
		MaxRentDays:   rec.MaxRentDays,
		Images:        images,
		Facilities:    facilities,
		Rating: &ratingInfo{
			Average:      0,
			TotalReviews: 0,
		},
		CreatedAt: rec.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: rec.UpdatedAt.UTC().Format(time.RFC3339),
	}
}
