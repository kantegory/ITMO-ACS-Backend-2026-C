import {
  Menu,
  MenuItem,
  PhotoMenuItem,
  PhotoReview,
  Reservation,
  Restaurant,
  RestaurantCuisine,
  RestaurantTable,
  Review,
  User
} from './entities';

export function userDto(user: User) {
  return {
    id: user.id,
    name: user.name,
    birthdate: user.birthdate,
    phone: user.phone,
    isVerified: user.isVerified,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function restaurantDto(restaurant: Restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    foundationDate: restaurant.foundationDate,
    phone: restaurant.phone,
    address: restaurant.address,
    rating: Number(restaurant.rating),
    avgBill: Number(restaurant.avgBill),
    isVerified: restaurant.isVerified,
    cuisines: restaurant.cuisines?.map((item) => item.cuisine),
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

export function menuDto(menu: Menu) {
  return {
    id: menu.id,
    restaurantId: menu.restaurantId,
    name: menu.name,
    description: menu.description,
    isPublished: menu.isPublished,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt
  };
}

export function menuItemDto(item: MenuItem) {
  return {
    id: item.id,
    menuId: item.menuId,
    name: item.name,
    price: Number(item.price),
    description: item.description,
    isPublished: item.isPublished,
    photos: item.photos?.map(photoMenuItemDto),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export function reservationDto(reservation: Reservation) {
  return {
    id: reservation.id,
    userId: reservation.userId,
    restaurantId: reservation.restaurantId,
    tableId: reservation.tableId,
    reservedAt: reservation.reservedAt,
    status: reservation.status,
    comment: reservation.comment,
    guestCount: reservation.guestCount,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt
  };
}

export function reviewDto(review: Review) {
  return {
    id: review.id,
    userId: review.userId,
    restaurantId: review.restaurantId,
    reservationId: review.reservationId,
    date: review.date,
    comment: review.comment,
    rating: Number(review.rating),
    isVerified: review.isVerified,
    photos: review.photos?.map(photoReviewDto),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt
  };
}

export function photoReviewDto(photo: PhotoReview) {
  return {
    id: photo.id,
    reviewId: photo.reviewId,
    filePath: photo.filePath,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt
  };
}

export function photoMenuItemDto(photo: PhotoMenuItem) {
  return {
    id: photo.id,
    menuItemId: photo.menuItemId,
    filePath: photo.filePath,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt
  };
}

export function listDto<T>(items: T[], page: number, limit: number, total: number) {
  return { items, meta: { page, limit, total } };
}
