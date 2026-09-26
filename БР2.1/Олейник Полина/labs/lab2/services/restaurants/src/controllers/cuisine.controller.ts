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

import { Cuisine } from '../models/cuisine.entity';
import { Role } from '../models/enums/role.enum';

import authMiddleware from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';

import { CuisineCreateDto } from '../dto/cuisine.dto';
import { ConflictError } from '../errors/http-errors';
import { isForeignKeyViolation } from '../utils/db-errors';

// Справочник кухонь — устроен один в один как city.controller.ts.
// Копия лр1/src/controllers/cuisine.controller.ts.
@EntityController({
    baseRoute: '/cuisines',
    entity: Cuisine,
})
class CuisineController extends BaseController {
    @Get('')
    async list(): Promise<Cuisine[]> {
        return this.repository.find({ order: { name: 'ASC' } }) as Promise<Cuisine[]>;
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async create(
        @Body({ type: CuisineCreateDto }) data: CuisineCreateDto,
    ): Promise<Cuisine> {
        const existing = await this.repository.findOneBy({ name: data.name });

        if (existing) {
            throw new ConflictError('Cuisine with this name already exists');
        }

        const cuisine = this.repository.create(data);

        return this.repository.save(cuisine) as Promise<Cuisine>;
    }

    @Delete('/:cuisineId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    async remove(@Param('cuisineId') cuisineId: number): Promise<void> {
        const cuisine = await this.repository.findOneBy({ id: cuisineId });

        if (!cuisine) {
            throw new NotFoundError('Cuisine not found');
        }

        try {
            await this.repository.remove(cuisine);
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new ConflictError(
                    'Cuisine is used by existing restaurants',
                );
            }

            throw error;
        }
    }
}

export default CuisineController;
