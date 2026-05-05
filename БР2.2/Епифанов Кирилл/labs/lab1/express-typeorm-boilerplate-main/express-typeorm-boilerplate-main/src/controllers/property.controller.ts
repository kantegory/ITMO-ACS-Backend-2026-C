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
import dataSource from '../config/data-source';
import { Facility } from '../models/facility.entity';
import { PropertyFacility } from '../models/property-facility.entity';
import { Property } from '../models/property.entity';

class AddFacilityDto {
    facilityId!: number;
    amount!: number;
}

@EntityController({
    baseRoute: '/properties',
    entity: Property,
})
class PropertyController extends BaseController {

    @Get('')
    async getAll() {
        return this.repository.find();
    }

    @Post('')
    async create(@Body() data: Partial<Property>) {
        const property = this.repository.create(data);
        return await this.repository.save(property);
    }


    @Post('/:id/facilities')
    async addFacility(
        @Param('id') id: number,
        @Body() body: AddFacilityDto,
    ) {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new Error('Property not found');

        const facilityRepo = dataSource.getRepository(Facility);
        const facility = await facilityRepo.findOneBy({ id: body.facilityId });
        if (!facility) throw new Error('Facility not found');

        const pfRepo = dataSource.getRepository(PropertyFacility);
        const existing = await pfRepo.findOneBy({ property: { id }, facility: { id: body.facilityId } });
        if (existing) {
            existing.amount = body.amount;
            return pfRepo.save(existing);
        }

        const pf = pfRepo.create({ property, facility, amount: body.amount });
        return pfRepo.save(pf);
    }

    @Delete('/:id/facilities/:facilityId')
    async removeFacility(
        @Param('id') id: number,
        @Param('facilityId') facilityId: number,
    ) {
        const pfRepo = dataSource.getRepository(PropertyFacility);
        const pf = await pfRepo.findOneBy({ property: { id }, facility: { id: facilityId } });
        if (!pf) throw new Error('Facility link not found');
        return pfRepo.remove(pf);
    }

    @Get('/:id')
    async getById(@Param('id') id: number): Promise<ObjectLiteral> {
        const results = await this.repository.findOneBy({ id });

        if (!results) {
            throw new Error('Property not found');
        }

        return results;
    }

    @Patch('/:id')
    async update(
        @Param('id') id: number,
        @Body() property: Partial<Property>,
    ): Promise<ObjectLiteral> {
        const propertyForUpdate = await this.repository.findOneBy({ id });

        if (!propertyForUpdate) {
            throw new Error('Property not found');
        }

        Object.assign(propertyForUpdate, property);
        const results = await this.repository.save(propertyForUpdate);

        return results;
    }

    @Delete('/:id')
    async remove(@Param('id') id: number) {
        return `property #${id} removed`;
    }
}

export default PropertyController;