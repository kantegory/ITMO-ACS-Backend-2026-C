import {
    Param,
    Body,
    Get,
    Post,
    Put,
    Delete,
    HttpCode,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Comfort } from '../models/comfort.entity';
import { CreateComfortDto, UpdateComfortDto } from '../dto/comfort.dto';

@EntityController({
    baseRoute: '/comforts',
    entity: Comfort,
})
class ComfortController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'List all comforts' })
    async getAll() {
        return await this.repository.find({ order: { name: 'ASC' } });
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get comfort by ID' })
    async getById(@Param('id') id: number) {
        const comfort = await this.repository.findOneBy({ id });
        if (!comfort) return { message: 'Comfort not found' };
        return comfort;
    }

    @Post('')
    @HttpCode(201)
    @OpenAPI({ summary: 'Create comfort' })
    async create(@Body({ type: CreateComfortDto }) data: CreateComfortDto) {
        const comfort = this.repository.create(data);
        return await this.repository.save(comfort);
    }

    @Put('/:id')
    @OpenAPI({ summary: 'Update comfort' })
    async update(
        @Param('id') id: number,
        @Body({ type: UpdateComfortDto }) data: UpdateComfortDto,
    ) {
        const comfort = await this.repository.findOneBy({ id });
        if (!comfort) return { message: 'Comfort not found' };

        Object.assign(comfort, data);
        return await this.repository.save(comfort);
    }

    @Delete('/:id')
    @HttpCode(204)
    @OpenAPI({ summary: 'Delete comfort' })
    async delete(@Param('id') id: number) {
        const comfort = await this.repository.findOneBy({ id });
        if (!comfort) return { message: 'Comfort not found' };

        await this.repository.remove(comfort);
        return '';
    }
}

export default ComfortController;
