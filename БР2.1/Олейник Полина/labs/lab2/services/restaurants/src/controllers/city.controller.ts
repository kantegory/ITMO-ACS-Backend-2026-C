import {
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { City } from '../models/city.entity';
import { Role } from '../models/enums/role.enum';

import authMiddleware from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';

import { CityCreateDto } from '../dto/city.dto';
import { ConflictError } from '../errors/http-errors';
import { isForeignKeyViolation } from '../utils/db-errors';

// Справочник городов: список открыт всем, добавлять/удалять — только ADMIN.
// Копия лр1/src/controllers/city.controller.ts.
@EntityController({
    baseRoute: '/cities',
    entity: City,
})
class CityController extends BaseController {
    @Get('')
    async list(): Promise<City[]> {
        return this.repository.find({ order: { name: 'ASC' } }) as Promise<City[]>;
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async create(
        @Body({ type: CityCreateDto }) data: CityCreateDto,
    ): Promise<City> {
        const existing = await this.repository.findOneBy({ name: data.name });

        if (existing) {
            throw new ConflictError('City with this name already exists');
        }

        const city = this.repository.create(data);

        return this.repository.save(city) as Promise<City>;
    }

    @Delete('/:cityId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async remove(@Param('cityId') cityId: number): Promise<void> {
        const city = await this.repository.findOneBy({ id: cityId });

        if (!city) {
            throw new NotFoundError('City not found');
        }

        try {
            await this.repository.remove(city);
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new ConflictError(
                    'City is used by existing restaurants',
                );
            }

            throw error;
        }
    }
}

export default CityController;
