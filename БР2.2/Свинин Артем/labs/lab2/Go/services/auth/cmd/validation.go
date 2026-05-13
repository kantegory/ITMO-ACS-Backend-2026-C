package main

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

type loginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type registerRequest struct {
	FirstName string `json:"firstName" validate:"required,min=1,max=100"`
	LastName  string `json:"lastName" validate:"required,min=1,max=100"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8,max=128"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}

type validateTokenRequest struct {
	Token string `json:"token" validate:"required"`
}

type validateUsersRequest struct {
	UserIDs []int64 `json:"userIds" validate:"required,min=1,max=100,dive,gt=0"`
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
	case "FirstName", "LastName":
		if tag == "required" {
			return "Имя и фамилия обязательны"
		}
	case "Email":
		if tag == "required" {
			return "Email обязателен"
		}
		if tag == "email" {
			return "Некорректный формат email"
		}
	case "Password":
		if tag == "required" {
			return "Email и пароль обязательны"
		}
		if tag == "min" {
			return "Пароль должен содержать минимум 8 символов"
		}
	case "RefreshToken":
		if tag == "required" {
			return "refreshToken обязателен"
		}
	case "Token":
		if tag == "required" {
			return "Токен обязателен"
		}
	case "UserIDs":
		if tag == "required" || tag == "min" {
			return "Список userIds не должен быть пустым"
		}
		if tag == "max" {
			return "Список userIds не должен превышать 100 элементов"
		}
	}

	return fmt.Sprintf("Поле %s содержит некорректное значение", strings.ToLower(field))
}
