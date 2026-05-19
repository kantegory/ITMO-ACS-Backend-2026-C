package main

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

type userUpdateRequest struct {
	FirstName  *string `json:"firstName" validate:"omitempty,min=1,max=100"`
	LastName   *string `json:"lastName" validate:"omitempty,min=1,max=100"`
	MiddleName *string `json:"middleName" validate:"omitempty,max=100"`
	Email      *string `json:"email" validate:"omitempty,email"`
	Phone      *string `json:"phone" validate:"omitempty,max=32"`
}

type addFavouriteRequest struct {
	PropertyID int64 `json:"propertyId" validate:"required,gt=0"`
}

type requestValidator struct {
	validator *validator.Validate
}

func newRequestValidator() *requestValidator {
	return &requestValidator{validator: validator.New()}
}

func (v *requestValidator) Validate(payload any) error {
	if err := v.validator.Struct(payload); err != nil {
		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok || len(validationErrors) == 0 {
			return fmt.Errorf("некорректные данные запроса")
		}

		return fmt.Errorf(mapValidationError(validationErrors[0]))
	}

	return nil
}

func mapValidationError(err validator.FieldError) string {
	field := err.StructField()
	tag := err.Tag()

	switch field {
	case "FirstName":
		if tag == "min" {
			return "firstName не может быть пустым"
		}
	case "LastName":
		if tag == "min" {
			return "lastName не может быть пустым"
		}
	case "Email":
		if tag == "email" {
			return "Некорректный формат email"
		}
	case "PropertyID":
		if tag == "required" || tag == "gt" {
			return "propertyId должен быть положительным"
		}
	}

	return fmt.Sprintf("Поле %s содержит некорректное значение", strings.ToLower(field))
}
