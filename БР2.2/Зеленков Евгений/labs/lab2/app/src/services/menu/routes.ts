import { Router } from 'express';
import { FindOptionsWhere, In } from 'typeorm';
import { adminRequired, authRequired, optionalAuth, serviceTokenRequired } from '../../shared/auth';
import { config } from '../../shared/config';
import { Role } from '../../shared/enums';
import { HttpError } from '../../shared/errors';
import { serviceRequest } from '../../shared/http-client';
import { optionalString, requiredBoolean, requiredPositiveNumber, requiredString } from '../../shared/validation';
import { MenuDataSource } from './data-source';
import { Menu, MenuItem, PhotoMenuItem } from './entities';
import { menuDto, menuItemDto, photoMenuItemDto } from './serializers';

export const menuRouter = Router();

async function validateRestaurant(restaurantId: string, requestId?: string) {
  await serviceRequest(`${config.services.catalog}/api/v1/internal/v1/restaurants/${restaurantId}`, { requestId });
}

async function photosFor(menuItemId: string) {
  return MenuDataSource.getRepository(PhotoMenuItem).findBy({ menuItemId });
}

menuRouter.get('/restaurants/:restaurantId/menus', optionalAuth, async (req, res, next) => {
  try {
    await validateRestaurant(req.params.restaurantId, req.requestId);
    const where: FindOptionsWhere<Menu> = { restaurantId: req.params.restaurantId };
    if (req.user?.role !== Role.Admin) where.isPublished = true;
    const items = await MenuDataSource.getRepository(Menu).findBy(where);
    res.json(items.map(menuDto));
  } catch (error) {
    next(error);
  }
});

menuRouter.post('/restaurants/:restaurantId/menus', authRequired, adminRequired, async (req, res, next) => {
  try {
    await validateRestaurant(req.params.restaurantId, req.requestId);
    const repo = MenuDataSource.getRepository(Menu);
    const menu = repo.create({
      restaurantId: req.params.restaurantId,
      name: requiredString(req.body.name, 'name'),
      description: optionalString(req.body.description),
      isPublished: req.body.isPublished === undefined ? false : requiredBoolean(req.body.isPublished, 'isPublished')
    });
    await repo.save(menu);
    res.status(201).json(menuDto(menu));
  } catch (error) {
    next(error);
  }
});

menuRouter.patch('/menus/:menuId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = MenuDataSource.getRepository(Menu);
    const menu = await repo.findOneBy({ id: req.params.menuId });
    if (!menu) throw new HttpError(404, 'menu_not_found', 'Menu not found');
    if (req.body.name !== undefined) menu.name = requiredString(req.body.name, 'name');
    if (req.body.description !== undefined) menu.description = optionalString(req.body.description);
    if (req.body.isPublished !== undefined) menu.isPublished = requiredBoolean(req.body.isPublished, 'isPublished');
    await repo.save(menu);
    res.json(menuDto(menu));
  } catch (error) {
    next(error);
  }
});

menuRouter.delete('/menus/:menuId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await MenuDataSource.transaction(async (manager) => {
      const items = await manager.find(MenuItem, {
        where: { menuId: req.params.menuId },
        select: { id: true }
      });
      const itemIds = items.map((item) => item.id);
      if (itemIds.length > 0) await manager.delete(PhotoMenuItem, { menuItemId: In(itemIds) });
      await manager.delete(MenuItem, { menuId: req.params.menuId });
      await manager.delete(Menu, { id: req.params.menuId });
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

menuRouter.get('/menus/:menuId/items', optionalAuth, async (req, res, next) => {
  try {
    const where: FindOptionsWhere<MenuItem> = { menuId: req.params.menuId };
    if (req.user?.role !== Role.Admin) where.isPublished = true;
    const items = await MenuDataSource.getRepository(MenuItem).findBy(where);
    const response = await Promise.all(items.map(async (item) => menuItemDto(item, await photosFor(item.id))));
    res.json(response);
  } catch (error) {
    next(error);
  }
});

menuRouter.post('/menus/:menuId/items', authRequired, adminRequired, async (req, res, next) => {
  try {
    const menu = await MenuDataSource.getRepository(Menu).findOneBy({ id: req.params.menuId });
    if (!menu) throw new HttpError(404, 'menu_not_found', 'Menu not found');
    const repo = MenuDataSource.getRepository(MenuItem);
    const item = repo.create({
      menuId: menu.id,
      name: requiredString(req.body.name, 'name'),
      price: String(requiredPositiveNumber(req.body.price, 'price')),
      description: optionalString(req.body.description),
      isPublished: req.body.isPublished === undefined ? false : requiredBoolean(req.body.isPublished, 'isPublished')
    });
    await repo.save(item);
    res.status(201).json(menuItemDto(item));
  } catch (error) {
    next(error);
  }
});

menuRouter.get('/menu-items/:menuItemId', async (req, res, next) => {
  try {
    const item = await MenuDataSource.getRepository(MenuItem).findOneBy({ id: req.params.menuItemId });
    if (!item) throw new HttpError(404, 'menu_item_not_found', 'Menu item not found');
    res.json(menuItemDto(item, await photosFor(item.id)));
  } catch (error) {
    next(error);
  }
});

menuRouter.patch('/menu-items/:menuItemId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = MenuDataSource.getRepository(MenuItem);
    const item = await repo.findOneBy({ id: req.params.menuItemId });
    if (!item) throw new HttpError(404, 'menu_item_not_found', 'Menu item not found');
    if (req.body.name !== undefined) item.name = requiredString(req.body.name, 'name');
    if (req.body.price !== undefined) item.price = String(requiredPositiveNumber(req.body.price, 'price'));
    if (req.body.description !== undefined) item.description = optionalString(req.body.description);
    if (req.body.isPublished !== undefined) item.isPublished = requiredBoolean(req.body.isPublished, 'isPublished');
    await repo.save(item);
    res.json(menuItemDto(item, await photosFor(item.id)));
  } catch (error) {
    next(error);
  }
});

menuRouter.delete('/menu-items/:menuItemId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await MenuDataSource.transaction(async (manager) => {
      await manager.delete(PhotoMenuItem, { menuItemId: req.params.menuItemId });
      await manager.delete(MenuItem, { id: req.params.menuItemId });
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

menuRouter.post('/menu-items/:menuItemId/photos', authRequired, adminRequired, async (req, res, next) => {
  try {
    const item = await MenuDataSource.getRepository(MenuItem).findOneBy({ id: req.params.menuItemId });
    if (!item) throw new HttpError(404, 'menu_item_not_found', 'Menu item not found');
    const repo = MenuDataSource.getRepository(PhotoMenuItem);
    const photo = repo.create({ menuItemId: item.id, filePath: requiredString(req.body.filePath, 'filePath') });
    await repo.save(photo);
    res.status(201).json(photoMenuItemDto(photo));
  } catch (error) {
    next(error);
  }
});

menuRouter.get('/internal/v1/restaurants/:restaurantId/menus', serviceTokenRequired, async (req, res, next) => {
  try {
    const items = await MenuDataSource.getRepository(Menu).findBy({ restaurantId: req.params.restaurantId, isPublished: true });
    res.json(items.map(menuDto));
  } catch (error) {
    next(error);
  }
});
