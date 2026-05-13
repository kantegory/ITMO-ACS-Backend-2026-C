import {
    Body,
    Get,
    Post,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { City } from '../models/city.entity';

@EntityController({
    baseRoute: '/cities',
    entity: City,
})
class CityController extends BaseController {

    @Get('')
    async getAll() {
        return await this.repository.find();
    }

    @Post('')
    async create(@Body() data: Partial<City>) {
        const city = this.repository.create(data);
        return await this.repository.save(city);
    }
}

export default CityController;