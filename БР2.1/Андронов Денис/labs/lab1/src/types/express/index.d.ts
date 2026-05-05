// расширяем интерфейс request для добавления пользователя из токена
import { User } from "../../entities/User";

declare global {
  namespace Express {
    export interface Request {
      user?: { id: number; role: string };
    }
  }
}