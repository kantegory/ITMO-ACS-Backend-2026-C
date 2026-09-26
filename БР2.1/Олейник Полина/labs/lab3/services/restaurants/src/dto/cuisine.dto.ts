import { IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

// Копия лр1/src/dto/cuisine.dto.ts.
class CuisineCreateDto {
    @IsString()
    @MinLength(1)
    @Type(() => String)
    name: string;
}

export { CuisineCreateDto };
