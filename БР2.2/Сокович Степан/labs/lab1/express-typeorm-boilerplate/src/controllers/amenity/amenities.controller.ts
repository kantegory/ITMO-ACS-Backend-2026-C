import { Get } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import { Amenity } from '../../models/amentity.entity';

import { AmenitiesListResponseDto } from './dto';

@EntityController({
    baseRoute: '/amenities',
    entity: Amenity,
})
class AmenitiesController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Получить справочник удобств' })
    @ResponseSchema(AmenitiesListResponseDto, { statusCode: 200 })
    async getAmenities(): Promise<AmenitiesListResponseDto> {
        const amenities = await this.repository.find() as Amenity[];

        return {
            data: amenities.map((amenity) => ({
                id: amenity.id,
                name: amenity.name,
            })),
        };
    }
}

export default AmenitiesController;
