import { Get } from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Amenity } from '../models/amenity.entity';

@EntityController({
    baseRoute: '/amenities',
    entity: Amenity,
})
class AmenityController extends BaseController {
    @Get('')
    async list() {
        const data = await this.repository.find({
            order: { id: 'ASC' },
        });
        return { data };
    }
}

export default AmenityController;
