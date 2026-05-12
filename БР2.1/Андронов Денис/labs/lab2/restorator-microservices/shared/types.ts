// общие типы для общения микросервисов друг с другом

export interface ValidateTokenRequest {
    token: string;
}

export interface ValidateTokenResponse {
    isValid: boolean;
    userId: number;
    role: string;
}

export interface RestaurantCheckResponse {
    id: number;
    name: string;
    isActive: boolean;
}