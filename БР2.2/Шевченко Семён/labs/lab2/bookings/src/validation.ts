export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function text(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new ApiError(400, `Некорректный параметр ${label}`);
  return value.trim();
}

export function uuid(value: unknown, label: string, required = true): string | undefined {
  const result = text(value, label);
  if (result === undefined && !required) return undefined;
  if (!result || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(result)) {
    throw new ApiError(400, `Некорректный UUID: ${label}`);
  }
  return result;
}

export function date(value: unknown, label: string, required = true): string | undefined {
  const result = text(value, label);
  if (result === undefined && !required) return undefined;
  const parsed = new Date(`${result}T00:00:00Z`);
  if (!result || !/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) {
    throw new ApiError(400, `Некорректная дата: ${label}`);
  }
  return result;
}

export function choice(value: unknown, allowed: string[], fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !allowed.includes(value)) throw new ApiError(400, "Недопустимое значение параметра");
  return value;
}

export function positiveInteger(value: unknown, label: string): number {
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof number !== "number" || !Number.isSafeInteger(number) || number < 1) throw new ApiError(400, `Укажите положительное целое число: ${label}`);
  return number;
}
