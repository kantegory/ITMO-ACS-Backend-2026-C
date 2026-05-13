import { Response } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function sendError(res: Response, error: unknown) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ code: error.code, message: error.message });
  }

  console.error(error);
  return res.status(500).json({ code: 'internal_server_error', message: 'Internal server error' });
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(422, 'validation_error', `${field} is required`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(422, 'validation_error', 'value must be a string');
  return value;
}

export function requiredNumber(value: unknown, field: string): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new HttpError(422, 'validation_error', `${field} must be a number`);
  }
  return numberValue;
}

export function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new HttpError(422, 'validation_error', `${field} must be a boolean`);
  }
  return value;
}
