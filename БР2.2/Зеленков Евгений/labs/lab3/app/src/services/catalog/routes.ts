import { Router } from 'express';
import { FindOptionsOrder, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { adminRequired, authRequired, serviceTokenRequired } from '../../shared/auth';
import { listDto } from '../../shared/dto';
import { Cuisine } from '../../shared/enums';
import { HttpError } from '../../shared/errors';
import {
  optionalString,
  pagination,
  parseCuisine,
  requiredBoolean,
  requiredNumber,
  requiredPositiveNumber,
  requiredString
} from '../../shared/validation';
import { CatalogDataSource } from './data-source';
import { Restaurant, RestaurantCuisine, RestaurantTable } from './entities';
import { restaurantCuisineDto, restaurantDto, restaurantTableDto } from './serializers';

export const catalogRouter = Router();

async function findRestaurantOrFail(id: string) {
  const restaurant = await CatalogDataSource.getRepository(Restaurant).findOneBy({ id });
  if (!restaurant) throw new HttpError(404, 'restaurant_not_found', 'Restaurant not found');
  return restaurant;
}

async function cuisinesFor(restaurantId: string) {
  return CatalogDataSource.getRepository(RestaurantCuisine).findBy({ restaurantId });
}

catalogRouter.get('/restaurants', async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const restaurantRepo = CatalogDataSource.getRepository(Restaurant);

    const baseWhere: FindOptionsWhere<Restaurant> = {};
    if (req.query.minRating) baseWhere.rating = MoreThanOrEqual(String(Number(req.query.minRating)));
    if (req.query.maxAvgBill) baseWhere.avgBill = LessThanOrEqual(String(Number(req.query.maxAvgBill)));

    const where: FindOptionsWhere<Restaurant>[] | FindOptionsWhere<Restaurant> = search
      ? [
          { ...baseWhere, name: ILike(`%${search}%`) },
          { ...baseWhere, address: ILike(`%${search}%`) }
        ]
      : baseWhere;

    let order: FindOptionsOrder<Restaurant> = { rating: 'DESC' };
    if (req.query.sort === 'avg_bill_asc') order = { avgBill: 'ASC' };
    else if (req.query.sort === 'avg_bill_desc') order = { avgBill: 'DESC' };
    else if (req.query.sort === 'name_asc') order = { name: 'ASC' };

    let [items, total] = await restaurantRepo.findAndCount({ where, order, skip, take: limit });

    if (req.query.cuisine) {
      const cuisine = parseCuisine(req.query.cuisine);
      const links = await CatalogDataSource.getRepository(RestaurantCuisine).findBy({ cuisine });
      const ids = new Set(links.map((item) => item.restaurantId));
      items = items.filter((item) => ids.has(item.id));
      total = items.length;
    }

    const response = await Promise.all(items.map(async (item) => restaurantDto(item, await cuisinesFor(item.id))));
    res.json(listDto(response, page, limit, total));
  } catch (error) {
    next(error);
  }
});

catalogRouter.post('/restaurants', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = CatalogDataSource.getRepository(Restaurant);
    const restaurant = repo.create({
      name: requiredString(req.body.name, 'name'),
      foundationDate: optionalString(req.body.foundationDate),
      phone: requiredString(req.body.phone, 'phone'),
      address: requiredString(req.body.address, 'address'),
      avgBill: String(requiredPositiveNumber(req.body.avgBill, 'avgBill')),
      rating: '0',
      isVerified: req.body.isVerified === undefined ? false : requiredBoolean(req.body.isVerified, 'isVerified')
    });
    await repo.save(restaurant);
    res.status(201).json(restaurantDto(restaurant));
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/restaurants/:restaurantId', async (req, res, next) => {
  try {
    const restaurant = await findRestaurantOrFail(req.params.restaurantId);
    res.json(restaurantDto(restaurant, await cuisinesFor(restaurant.id)));
  } catch (error) {
    next(error);
  }
});

catalogRouter.patch('/restaurants/:restaurantId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = CatalogDataSource.getRepository(Restaurant);
    const restaurant = await findRestaurantOrFail(req.params.restaurantId);
    if (req.body.name !== undefined) restaurant.name = requiredString(req.body.name, 'name');
    if (req.body.foundationDate !== undefined) restaurant.foundationDate = optionalString(req.body.foundationDate);
    if (req.body.phone !== undefined) restaurant.phone = requiredString(req.body.phone, 'phone');
    if (req.body.address !== undefined) restaurant.address = requiredString(req.body.address, 'address');
    if (req.body.avgBill !== undefined) restaurant.avgBill = String(requiredPositiveNumber(req.body.avgBill, 'avgBill'));
    if (req.body.isVerified !== undefined) restaurant.isVerified = requiredBoolean(req.body.isVerified, 'isVerified');
    await repo.save(restaurant);
    res.json(restaurantDto(restaurant, await cuisinesFor(restaurant.id)));
  } catch (error) {
    next(error);
  }
});

catalogRouter.delete('/restaurants/:restaurantId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await CatalogDataSource.getRepository(Restaurant).delete(req.params.restaurantId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/restaurants/:restaurantId/cuisines', async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);
    const items = await cuisinesFor(req.params.restaurantId);
    res.json(items.map(restaurantCuisineDto));
  } catch (error) {
    next(error);
  }
});

catalogRouter.post('/restaurants/:restaurantId/cuisines', authRequired, adminRequired, async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);
    const repo = CatalogDataSource.getRepository(RestaurantCuisine);
    const cuisine = parseCuisine(req.body.cuisine);
    const existing = await repo.findOneBy({ restaurantId: req.params.restaurantId, cuisine });
    if (existing) throw new HttpError(409, 'cuisine_already_exists', 'Restaurant already has this cuisine');
    const item = repo.create({ restaurantId: req.params.restaurantId, cuisine });
    await repo.save(item);
    res.status(201).json(restaurantCuisineDto(item));
  } catch (error) {
    next(error);
  }
});

catalogRouter.delete('/restaurants/:restaurantId/cuisines/:cuisineId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await CatalogDataSource.getRepository(RestaurantCuisine).delete({ id: req.params.cuisineId, restaurantId: req.params.restaurantId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/restaurants/:restaurantId/tables', async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);
    const where: FindOptionsWhere<RestaurantTable> = { restaurantId: req.params.restaurantId };
    if (req.query.onlyActive !== 'false') where.isActive = true;
    const items = await CatalogDataSource.getRepository(RestaurantTable).findBy(where);
    res.json(items.map(restaurantTableDto));
  } catch (error) {
    next(error);
  }
});

catalogRouter.post('/restaurants/:restaurantId/tables', authRequired, adminRequired, async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);
    const repo = CatalogDataSource.getRepository(RestaurantTable);
    const table = repo.create({
      restaurantId: req.params.restaurantId,
      number: requiredPositiveNumber(req.body.number, 'number'),
      capacity: requiredPositiveNumber(req.body.capacity, 'capacity'),
      isActive: req.body.isActive === undefined ? true : requiredBoolean(req.body.isActive, 'isActive')
    });
    await repo.save(table);
    res.status(201).json(restaurantTableDto(table));
  } catch (error) {
    next(error);
  }
});

catalogRouter.patch('/restaurants/:restaurantId/tables/:tableId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = CatalogDataSource.getRepository(RestaurantTable);
    const table = await repo.findOneBy({ id: req.params.tableId, restaurantId: req.params.restaurantId });
    if (!table) throw new HttpError(404, 'table_not_found', 'Table not found');
    if (req.body.number !== undefined) table.number = requiredPositiveNumber(req.body.number, 'number');
    if (req.body.capacity !== undefined) table.capacity = requiredPositiveNumber(req.body.capacity, 'capacity');
    if (req.body.isActive !== undefined) table.isActive = requiredBoolean(req.body.isActive, 'isActive');
    await repo.save(table);
    res.json(restaurantTableDto(table));
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/internal/v1/restaurants/:restaurantId', serviceTokenRequired, async (req, res, next) => {
  try {
    const restaurant = await findRestaurantOrFail(req.params.restaurantId);
    res.json(restaurantDto(restaurant, await cuisinesFor(restaurant.id)));
  } catch (error) {
    next(error);
  }
});

catalogRouter.post('/internal/v1/restaurants/:restaurantId/tables/validate', serviceTokenRequired, async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);
    const table = await CatalogDataSource.getRepository(RestaurantTable).findOneBy({ id: requiredString(req.body.tableId, 'tableId') });
    if (!table) throw new HttpError(404, 'table_not_found', 'Table not found');
    if (table.restaurantId !== req.params.restaurantId) throw new HttpError(409, 'table_restaurant_mismatch', 'Table does not belong to restaurant');
    if (!table.isActive) throw new HttpError(409, 'table_inactive', 'Table is inactive');
    if (table.capacity < requiredNumber(req.body.guestCount, 'guestCount')) {
      throw new HttpError(409, 'table_capacity_too_small', 'Table capacity is too small');
    }
    res.json({ valid: true, table: restaurantTableDto(table) });
  } catch (error) {
    next(error);
  }
});

catalogRouter.post('/internal/v1/restaurants/:restaurantId/rating/recalculate', serviceTokenRequired, async (req, res, next) => {
  try {
    const repo = CatalogDataSource.getRepository(Restaurant);
    const restaurant = await findRestaurantOrFail(req.params.restaurantId);
    restaurant.rating = String(requiredNumber(req.body.rating, 'rating'));
    await repo.save(restaurant);
    res.json(restaurantDto(restaurant, await cuisinesFor(restaurant.id)));
  } catch (error) {
    next(error);
  }
});

export { Cuisine };
