import { Request } from "express";

// создаем свой интерфейс, который расширяет стандартный Request
export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}