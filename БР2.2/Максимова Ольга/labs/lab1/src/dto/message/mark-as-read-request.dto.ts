import { IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class MarkAsReadRequest {
    @IsBoolean()
    @Type(() => Boolean)
    is_read: boolean;
}