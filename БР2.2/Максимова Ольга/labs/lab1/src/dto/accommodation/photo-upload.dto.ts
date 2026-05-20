import { IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class PhotoUploadDto {
    @IsUrl()
    photo_url: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    is_main?: boolean;
}