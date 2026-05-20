import { Menu, MenuItem, PhotoMenuItem } from './entities';

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

export function photoMenuItemDto(photo: PhotoMenuItem) {
  return {
    id: photo.id,
    menuItemId: photo.menuItemId,
    filePath: photo.filePath,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt
  };
}

export function menuItemDto(item: MenuItem, photos: PhotoMenuItem[] = []) {
  return {
    id: item.id,
    menuId: item.menuId,
    name: item.name,
    price: Number(item.price),
    description: item.description,
    isPublished: item.isPublished,
    photos: photos.map(photoMenuItemDto),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}
