import {
    Param,
    Body,
    Get,
    Post,
    Put,
    Delete,
    HttpCode,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { City } from '../models/city.entity';
import { CreateCityDto, UpdateCityDto } from '../dto/city.dto';

@EntityController({
    baseRoute: '/cities',
    entity: City,
})
class CityController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'List cities' })
    async getAll(
        @QueryParam('search') search?: string,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const qb = this.repository.createQueryBuilder('city');

        if (search) {
            qb.where('city.name LIKE :search', { search: `%${search}%` });
        }

        qb.orderBy('city.name', 'ASC');
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get city by ID' })
    async getById(@Param('id') id: number) {
        const city = await this.repository.findOneBy({ id });
        if (!city) return { message: 'City not found' };
        return city;
    }

    @Post('')
    @HttpCode(201)
    @OpenAPI({ summary: 'Create city' })
    async create(@Body({ type: CreateCityDto }) data: CreateCityDto) {
        const city = this.repository.create(data);
        return await this.repository.save(city);
    }

    @Put('/:id')
    @OpenAPI({ summary: 'Update city' })
    async update(
        @Param('id') id: number,
        @Body({ type: UpdateCityDto }) data: UpdateCityDto,
    ) {
        const city = await this.repository.findOneBy({ id });
        if (!city) return { message: 'City not found' };

        Object.assign(city, data);
        return await this.repository.save(city);
    }

    @Delete('/:id')
    @HttpCode(204)
    @OpenAPI({ summary: 'Delete city' })
    async delete(@Param('id') id: number) {
        const city = await this.repository.findOneBy({ id });
        if (!city) return { message: 'City not found' };

        await this.repository.remove(city);
        return '';
    }
}

export default CityController;
