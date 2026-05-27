import { Restaurant, RestaurantCuisine, RestaurantTable } from './entities';

export function restaurantDto(restaurant: Restaurant, cuisines: RestaurantCuisine[] = []) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    foundationDate: restaurant.foundationDate,
    phone: restaurant.phone,
    address: restaurant.address,
    rating: Number(restaurant.rating),
    avgBill: Number(restaurant.avgBill),
    isVerified: restaurant.isVerified,
    cuisines: cuisines.map((item) => item.cuisine),
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt
  };
}

export function restaurantCuisineDto(item: RestaurantCuisine) {
  return {
    id: item.id,
    restaurantId: item.restaurantId,
    cuisine: item.cuisine,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export function restaurantTableDto(table: RestaurantTable) {
  return {
    id: table.id,
    restaurantId: table.restaurantId,
    number: table.number,
    capacity: table.capacity,
    isActive: table.isActive,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt
  };
}
