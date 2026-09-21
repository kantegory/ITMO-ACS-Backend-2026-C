import { IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

// Тело запроса POST /cities. Ответ для City отдельного DTO не требует —
// сущность City и так безопасна для отдачи напрямую (нет пароля и т.п.).
class CityCreateDto {
    @IsString()
    @MinLength(1) // название не должно быть пустой строкой
    @Type(() => String)
    name: string;
}

export { CityCreateDto };
