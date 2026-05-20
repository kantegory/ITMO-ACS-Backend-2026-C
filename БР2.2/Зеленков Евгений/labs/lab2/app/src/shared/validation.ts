import { Cuisine, ReservationStatus } from './enums';
import { HttpError } from './errors';

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(422, 'validation_error', `${field} is required`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new HttpError(422, 'validation_error', 'value must be a string');
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function requiredNumber(value: unknown, field: string): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new HttpError(422, 'validation_error', `${field} must be a number`);
  }
  return numberValue;
}

export function requiredPositiveNumber(value: unknown, field: string): number {
  const numberValue = requiredNumber(value, field);
  if (numberValue <= 0) throw new HttpError(422, 'validation_error', `${field} must be greater than zero`);
  return numberValue;
}

export function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new HttpError(422, 'validation_error', `${field} must be a boolean`);
  }
  return value;
}

export function requiredDate(value: unknown, field: string): Date {
  const date = new Date(requiredString(value, field));
  if (Number.isNaN(date.getTime())) throw new HttpError(422, 'validation_error', `${field} must be a valid date`);
  return date;
}

export function parseCuisine(value: unknown): Cuisine {
  if (!Object.values(Cuisine).includes(value as Cuisine)) {
    throw new HttpError(422, 'validation_error', 'Unknown cuisine');
  }
  return value as Cuisine;
}

export function parseReservationStatus(value: unknown): ReservationStatus {
  if (!Object.values(ReservationStatus).includes(value as ReservationStatus)) {
    throw new HttpError(422, 'validation_error', 'Unknown reservation status');
  }
  return value as ReservationStatus;
}

export function pagination(query: Record<string, unknown>) {
  const rawPage = query.page === undefined ? 1 : Number(query.page);
  const rawLimit = query.limit === undefined ? 20 : Number(query.limit);

  if (!Number.isFinite(rawPage) || rawPage < 1) {
    throw new HttpError(422, 'validation_error', 'page must be a positive number');
  }
  if (!Number.isFinite(rawLimit) || rawLimit < 1) {
    throw new HttpError(422, 'validation_error', 'limit must be a positive number');
  }

  const page = Math.floor(rawPage);
  const limit = Math.min(Math.floor(rawLimit), 100);
  return { page, limit, skip: (page - 1) * limit };
}
