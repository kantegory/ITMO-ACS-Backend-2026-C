import { IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

// Тело запроса POST /cuisines — то же самое, что и CityCreateDto, только для кухонь.
class CuisineCreateDto {
    @IsString()
    @MinLength(1)
    @Type(() => String)
    name: string;
}

export { CuisineCreateDto };
