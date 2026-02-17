namespace RestaurantApi;

model MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: float32;
}

model CreateMenuItemDto {
  categoryId: string;
  name: string;
  description?: string;
  price: float32;
}