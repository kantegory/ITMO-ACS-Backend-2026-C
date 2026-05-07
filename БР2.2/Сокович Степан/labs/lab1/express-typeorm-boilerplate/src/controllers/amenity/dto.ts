export class AmenityResponseDto {
    id: number;
    name: string;
}

export class AmenitiesListResponseDto {
    data: AmenityResponseDto[];
}
