// общие типы для общения микросервисов друг с другом

export interface ValidateTokenRequest {
    token: string;
}

export interface ValidateTokenResponse {
    isValid: boolean;
    userId?: number;
    role?: string;
}

export interface RestaurantCheckRequest {
    restaurantId: number;
}

export interface RestaurantCheckResponse {
    found: boolean;
    id?: number;
    name?: string;
    isActive?: boolean;
}

export interface ReservationCreatedEvent {
    reservationId: number;
    userId: number;
    restaurantId: number;
    date: string;
}