// Единая ошибка приложения. Прокидывается через next(err) в errorHandler,
// который вернёт клиенту JSON { message } с нужным HTTP-статусом.
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
