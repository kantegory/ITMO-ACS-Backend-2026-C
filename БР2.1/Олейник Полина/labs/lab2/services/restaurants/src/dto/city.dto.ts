import { IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

// Копия лр1/src/dto/city.dto.ts.
class CityCreateDto {
    @IsString()
    @MinLength(1)
    @Type(() => String)
    name: string;
}

export { CityCreateDto };
