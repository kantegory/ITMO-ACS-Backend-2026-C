import { ApiError } from "./validation";

interface CatalogRestaurant {
  id: string;
  admin_id: string;
  tables: { id: string; number: number; seats: number; is_active: boolean }[];
  time_slots: { id: string; start_time: string; end_time: string }[];
}

async function internal<T>(path: string, parameters: Record<string, string>): Promise<T> {
  let response;
  try {
    response = await fetch(process.env.RESTAURANTS_URL + path + "?" + new URLSearchParams(parameters), {
      headers: { "X-Internal-Key": process.env.INTERNAL_KEY! }, signal: AbortSignal.timeout(5000),
    });
  } catch { throw new ApiError(503, "Сервис ресторанов недоступен"); }
  if (response.status === 404) throw new ApiError(404, "Ресторан, столик или слот не найден");
  if (response.status === 400) throw new ApiError(400, "Некорректные параметры столика или ресторана");
  if (!response.ok) throw new ApiError(503, "Ошибка сервиса ресторанов");
  return await response.json() as T;
}

export function loadCatalog(filters: { restaurant_id?: string; name?: string }) {
  const parameters: Record<string, string> = {};
  if (filters.restaurant_id) parameters.restaurant_id = filters.restaurant_id;
  if (filters.name) parameters.name = filters.name;
  return internal<CatalogRestaurant[]>("/internal/restaurants", parameters);
}

export function bookingOptions(table_id: string, time_slot_id: string) {
  return internal<{ restaurant_id: string; admin_id: string; seats: number; is_active: boolean }>("/internal/booking-options", { table_id, time_slot_id });
}
