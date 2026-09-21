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
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { City } from '../models/city.entity';
import { Role } from '../models/enums/role.enum';

import authMiddleware from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';

import { CityCreateDto } from '../dto/city.dto';
import { ErrorDto } from '../dto/error.dto';
import { ConflictError } from '../errors/http-errors';
import { isForeignKeyViolation } from '../utils/db-errors';

// Справочник городов: список открыт всем, а добавлять/удалять может только ADMIN.
@EntityController({
    baseRoute: '/cities',
    entity: City,
})
class CityController extends BaseController {
    // GET /cities — без @UseBefore, значит доступен без токена
    @Get('')
    @OpenAPI({ summary: 'Список городов' })
    @ResponseSchema(City, { isArray: true, statusCode: 200 })
    async list(): Promise<City[]> {
        return this.repository.find({ order: { name: 'ASC' } });
    }

    // POST /cities — только ADMIN
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN)) // сначала проверяем токен, потом роль
    @OpenAPI({ summary: 'Добавить город' })
    @ResponseSchema(City, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
    async create(
        @Body({ type: CityCreateDto }) data: CityCreateDto,
    ): Promise<City> {
        const existing = await this.repository.findOneBy({ name: data.name });

        if (existing) {
            throw new ConflictError('City with this name already exists');
        }

        const city = this.repository.create(data);

        return this.repository.save(city);
    }

    // DELETE /cities/{cityId} — только ADMIN
    @Delete('/:cityId')
    @OnUndefined(204) // метод ничего не возвращает — этот декоратор говорит фреймворку отдать пустой ответ 204,
    // а не решить, что "результат не найден" (стандартное поведение при undefined без него)
    @UseBefore(authMiddleware, requireRole(Role.ADMIN))
    @OpenAPI({ summary: 'Удалить город' })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
    async remove(@Param('cityId') cityId: number): Promise<void> {
        const city = await this.repository.findOneBy({ id: cityId });

        if (!city) {
            throw new NotFoundError('City not found');
        }

        try {
            await this.repository.remove(city);
        } catch (error) {
            // если на этот город ссылается хотя бы один ресторан, Postgres не даст удалить —
            // ловим эту ошибку базы и превращаем в понятный 409 вместо голого 500
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
