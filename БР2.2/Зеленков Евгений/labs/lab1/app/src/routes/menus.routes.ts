import { Router } from 'express';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Menu, MenuItem, PhotoMenuItem, Role } from '../entities';
import { adminRequired, authRequired } from '../auth';
import { HttpError, optionalString, requiredBoolean, requiredNumber, requiredString } from '../http';
import { menuDto, menuItemDto, photoMenuItemDto } from '../serializers';
import { findRestaurantOrFail } from './common';

export const menusRouter = Router();

menusRouter.get('/restaurants/:restaurantId/menus', async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);

    const where: FindOptionsWhere<Menu> = { restaurantId: req.params.restaurantId };
    if (!req.user || req.user.role !== Role.Admin) where.isPublished = true;

    const items = await AppDataSource.getRepository(Menu).findBy(where);
    res.json(items.map(menuDto));
  } catch (error) {
    next(error);
  }
});

menusRouter.post('/restaurants/:restaurantId/menus', authRequired, adminRequired, async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);

    const repo = AppDataSource.getRepository(Menu);
    const menu = repo.create({
      restaurantId: req.params.restaurantId,
      name: requiredString(req.body.name, 'name'),
      description: optionalString(req.body.description),
      isPublished: Boolean(req.body.isPublished ?? false)
    });

    await repo.save(menu);
    res.status(201).json(menuDto(menu));
  } catch (error) {
    next(error);
  }
});

menusRouter.patch('/menus/:menuId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Menu);
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

menusRouter.delete('/menus/:menuId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await AppDataSource.getRepository(Menu).delete(req.params.menuId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

menusRouter.get('/menus/:menuId/items', async (req, res, next) => {
  try {
    const where: FindOptionsWhere<MenuItem> = { menuId: req.params.menuId };
    if (!req.user || req.user.role !== Role.Admin) where.isPublished = true;

    const items = await AppDataSource.getRepository(MenuItem).find({
      where,
      relations: { photos: true }
    });

    res.json(items.map(menuItemDto));
  } catch (error) {
    next(error);
  }
});

menusRouter.post('/menus/:menuId/items', authRequired, adminRequired, async (req, res, next) => {
  try {
    const menu = await AppDataSource.getRepository(Menu).findOneBy({ id: req.params.menuId });
    if (!menu) throw new HttpError(404, 'menu_not_found', 'Menu not found');

    const repo = AppDataSource.getRepository(MenuItem);
    const item = repo.create({
      menuId: req.params.menuId,
      name: requiredString(req.body.name, 'name'),
      price: String(requiredNumber(req.body.price, 'price')),
      description: optionalString(req.body.description),
      isPublished: Boolean(req.body.isPublished ?? false)
    });

    await repo.save(item);
    res.status(201).json(menuItemDto(item));
  } catch (error) {
    next(error);
  }
});

menusRouter.get('/menu-items/:menuItemId', async (req, res, next) => {
  try {
    const item = await AppDataSource.getRepository(MenuItem).findOne({
      where: { id: req.params.menuItemId },
      relations: { photos: true }
    });

    if (!item) throw new HttpError(404, 'menu_item_not_found', 'Menu item not found');
    res.json(menuItemDto(item));
  } catch (error) {
    next(error);
  }
});

menusRouter.patch('/menu-items/:menuItemId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(MenuItem);
    const item = await repo.findOneBy({ id: req.params.menuItemId });
    if (!item) throw new HttpError(404, 'menu_item_not_found', 'Menu item not found');

    if (req.body.name !== undefined) item.name = requiredString(req.body.name, 'name');
    if (req.body.price !== undefined) item.price = String(requiredNumber(req.body.price, 'price'));
    if (req.body.description !== undefined) item.description = optionalString(req.body.description);
    if (req.body.isPublished !== undefined) item.isPublished = requiredBoolean(req.body.isPublished, 'isPublished');

    await repo.save(item);
    res.json(menuItemDto(item));
  } catch (error) {
    next(error);
  }
});

menusRouter.delete('/menu-items/:menuItemId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await AppDataSource.getRepository(MenuItem).delete(req.params.menuItemId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

menusRouter.post('/menu-items/:menuItemId/photos', authRequired, adminRequired, async (req, res, next) => {
  try {
    const item = await AppDataSource.getRepository(MenuItem).findOneBy({ id: req.params.menuItemId });
    if (!item) throw new HttpError(404, 'menu_item_not_found', 'Menu item not found');

    const repo = AppDataSource.getRepository(PhotoMenuItem);
    const photo = repo.create({
      menuItemId: item.id,
      filePath: requiredString(req.body.filePath, 'filePath')
    });

    await repo.save(photo);
    res.status(201).json(photoMenuItemDto(photo));
  } catch (error) {
    next(error);
  }
});
