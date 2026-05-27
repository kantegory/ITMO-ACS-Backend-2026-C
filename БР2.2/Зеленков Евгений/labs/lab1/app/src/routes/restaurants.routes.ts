import { Router } from 'express';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Restaurant, RestaurantCuisine, RestaurantTable } from '../entities';
import { adminRequired, authRequired } from '../auth';
import { HttpError, optionalString, requiredBoolean, requiredNumber, requiredString } from '../http';
import { listDto, restaurantCuisineDto, restaurantDto, restaurantTableDto } from '../serializers';
import { findRestaurantOrFail, pagination, parseCuisine } from './common';

export const restaurantsRouter = Router();

restaurantsRouter.get('/restaurants', async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const qb = AppDataSource.getRepository(Restaurant)
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.cuisines', 'cuisine')
      .skip(skip)
      .take(limit);

    if (search) {
      qb.andWhere('(restaurant.name ILIKE :search OR restaurant.address ILIKE :search)', {
        search: `%${search}%`
      });
    }
    if (req.query.cuisine) {
      qb.andWhere('cuisine.cuisine = :cuisine', { cuisine: parseCuisine(req.query.cuisine) });
    }
    if (req.query.minRating) {
      qb.andWhere('restaurant.rating >= :minRating', { minRating: Number(req.query.minRating) });
    }
    if (req.query.maxAvgBill) {
      qb.andWhere('restaurant.avg_bill <= :maxAvgBill', { maxAvgBill: Number(req.query.maxAvgBill) });
    }

    if (req.query.sort === 'avg_bill_asc') qb.orderBy('restaurant.avg_bill', 'ASC');
    else if (req.query.sort === 'avg_bill_desc') qb.orderBy('restaurant.avg_bill', 'DESC');
    else if (req.query.sort === 'name_asc') qb.orderBy('restaurant.name', 'ASC');
    else qb.orderBy('restaurant.rating', 'DESC');

    const [items, total] = await qb.getManyAndCount();
    res.json(listDto(items.map(restaurantDto), page, limit, total));
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.post('/restaurants', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Restaurant);
    const restaurant = repo.create({
      name: requiredString(req.body.name, 'name'),
      foundationDate: optionalString(req.body.foundationDate),
      phone: requiredString(req.body.phone, 'phone'),
      address: requiredString(req.body.address, 'address'),
      avgBill: String(requiredNumber(req.body.avgBill, 'avgBill')),
      rating: '0',
      isVerified: Boolean(req.body.isVerified ?? false)
    });

    await repo.save(restaurant);
    res.status(201).json(restaurantDto(restaurant));
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.get('/restaurants/:restaurantId', async (req, res, next) => {
  try {
    res.json(restaurantDto(await findRestaurantOrFail(req.params.restaurantId)));
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.patch('/restaurants/:restaurantId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Restaurant);
    const restaurant = await findRestaurantOrFail(req.params.restaurantId);

    if (req.body.name !== undefined) restaurant.name = requiredString(req.body.name, 'name');
    if (req.body.foundationDate !== undefined) restaurant.foundationDate = optionalString(req.body.foundationDate);
    if (req.body.phone !== undefined) restaurant.phone = requiredString(req.body.phone, 'phone');
    if (req.body.address !== undefined) restaurant.address = requiredString(req.body.address, 'address');
    if (req.body.avgBill !== undefined) restaurant.avgBill = String(requiredNumber(req.body.avgBill, 'avgBill'));
    if (req.body.isVerified !== undefined) restaurant.isVerified = requiredBoolean(req.body.isVerified, 'isVerified');

    await repo.save(restaurant);
    res.json(restaurantDto(restaurant));
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.delete('/restaurants/:restaurantId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await AppDataSource.getRepository(Restaurant).delete(req.params.restaurantId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.get('/restaurants/:restaurantId/cuisines', async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);

    const items = await AppDataSource.getRepository(RestaurantCuisine).findBy({
      restaurantId: req.params.restaurantId
    });

    res.json(items.map(restaurantCuisineDto));
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.post('/restaurants/:restaurantId/cuisines', authRequired, adminRequired, async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);

    const repo = AppDataSource.getRepository(RestaurantCuisine);
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

restaurantsRouter.delete('/restaurants/:restaurantId/cuisines/:cuisineId', authRequired, adminRequired, async (req, res, next) => {
  try {
    await AppDataSource.getRepository(RestaurantCuisine).delete({
      id: req.params.cuisineId,
      restaurantId: req.params.restaurantId
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.get('/restaurants/:restaurantId/tables', async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);

    const where: FindOptionsWhere<RestaurantTable> = { restaurantId: req.params.restaurantId };
    if (req.query.onlyActive !== 'false') where.isActive = true;

    const items = await AppDataSource.getRepository(RestaurantTable).findBy(where);
    res.json(items.map(restaurantTableDto));
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.post('/restaurants/:restaurantId/tables', authRequired, adminRequired, async (req, res, next) => {
  try {
    await findRestaurantOrFail(req.params.restaurantId);

    const repo = AppDataSource.getRepository(RestaurantTable);
    const table = repo.create({
      restaurantId: req.params.restaurantId,
      number: requiredNumber(req.body.number, 'number'),
      capacity: requiredNumber(req.body.capacity, 'capacity'),
      isActive: Boolean(req.body.isActive ?? true)
    });

    await repo.save(table);
    res.status(201).json(restaurantTableDto(table));
  } catch (error) {
    next(error);
  }
});

restaurantsRouter.patch('/restaurants/:restaurantId/tables/:tableId', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(RestaurantTable);
    const table = await repo.findOneBy({
      id: req.params.tableId,
      restaurantId: req.params.restaurantId
    });

    if (!table) throw new HttpError(404, 'table_not_found', 'Table not found');

    if (req.body.number !== undefined) table.number = requiredNumber(req.body.number, 'number');
    if (req.body.capacity !== undefined) table.capacity = requiredNumber(req.body.capacity, 'capacity');
    if (req.body.isActive !== undefined) table.isActive = requiredBoolean(req.body.isActive, 'isActive');

    await repo.save(table);
    res.json(restaurantTableDto(table));
  } catch (error) {
    next(error);
  }
});
