import { RentStatus } from '../models/rent.entity';

export type AccommodationItem = {
  title: string;
  roomsNum: number;
  // isRented: boolean;
  address: {
    city: string;
    district?: string | null;
    street: string;
    house_num: string;
    building?: string | null;
  };
  rentTerms: {
    price: number;
    deposit?: number | null;
    commission?: number | null;
    withKids: boolean;
    withPets: boolean;
  };
};

export class AccommodationLookupItem {
  accommodationId!: string;
  accommodation!: AccommodationItem;
}

export type RentWithAccommodationDto = {
  // id: string;
  // accommodation_id: string;
  // landlord_id: string | null;
  // tenant_id: string;
  total_amount: number;
  start_date: Date;
  end_date: Date;
  status: RentStatus;
  // created_at: Date;
  // updated_at: Date;
  accommodation: AccommodationItem | null;
};

export type CreateRentDto = {
  tenantId: string;
  accommodationId: string;
  startDate: string;
  endDate: string;
};

export interface UserValDTO {
  id: string;
  is_verified: boolean;
}
