import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post
} from 'routing-controllers';

import { ObjectLiteral } from 'typeorm';

import BaseController from '../common/base-controller';
import EntityController from '../common/entity-controller';

import { Facility } from '../models/facility.entity';

@EntityController({
    baseRoute: '/facilities',
    entity: Facility,
})
class FacilityController extends BaseController {

    @Get('')
    async getAll() {
        return await this.repository.find();
    }

    @Post('')
    async create(@Body() data: Partial<Facility>) {
        const facility = this.repository.create(data);
        return await this.repository.save(facility);
    }

    @Get('/:id')
    async getById(@Param('id') id: number): Promise<ObjectLiteral> {
        const results = await this.repository.findOneBy({ id });

        if (!results) {
            throw new Error('Facility not found'); 
        }

        return results;
    }

    @Patch('/:id')
    async update(
        @Param('id') id: number,
        @Body() facility: Partial<Facility>,
    ): Promise<ObjectLiteral> {
        const facilityForUpdate = await this.repository.findOneBy({ id });
            
        if (!facilityForUpdate) {
            throw new Error('Facility not found'); 
        }

        Object.assign(facilityForUpdate, facility);
        const results = await this.repository.save(facilityForUpdate);
        
        return results;
    }

    @Delete('/:id')
    async remove(@Param('id') id: number) {
        return `facility #${id} removed`;
    }
}

export default FacilityController;