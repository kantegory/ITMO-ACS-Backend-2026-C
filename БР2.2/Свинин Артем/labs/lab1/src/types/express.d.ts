// Расширяем Express-запрос полем user из JWT.
import { JwtPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Оставляем файл модулем для TypeScript-компилятора.
export {};
