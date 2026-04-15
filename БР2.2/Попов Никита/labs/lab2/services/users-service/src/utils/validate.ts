import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export async function validateDto<T extends object>(
  cls: new () => T,
  payload: unknown
): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
  const dto = plainToInstance(cls, payload);
  const errors = await validate(dto as object);
  if (errors.length > 0) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Некорректный запрос", details: errors } };
  }
  return { ok: true, value: dto };
}
