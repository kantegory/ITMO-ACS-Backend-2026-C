import { AppDataSource } from '../data-source';
import { Cuisine, ReservationStatus, Restaurant } from '../entities';
import { HttpError } from '../http';

export function pagination(query: Record<string, unknown>) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);

  return { page, limit, skip: (page - 1) * limit };
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

export async function findRestaurantOrFail(id: string) {
  const restaurant = await AppDataSource.getRepository(Restaurant).findOne({
    where: { id },
    relations: { cuisines: true }
  });

  if (!restaurant) {
    throw new HttpError(404, 'restaurant_not_found', 'Restaurant not found');
  }

  return restaurant;
}
