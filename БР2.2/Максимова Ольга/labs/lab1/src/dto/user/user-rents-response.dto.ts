import { Rent as RentEntity } from '../../models/rent.entity';

export class UserRentsResponseDto {
    as_tenant: RentEntity[];
    as_landlord: RentEntity[];
}