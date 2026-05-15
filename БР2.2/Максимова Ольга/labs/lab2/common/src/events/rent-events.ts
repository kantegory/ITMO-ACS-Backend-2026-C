export interface RentCreated {
  eventType: 'rent.created';
  rentId: string;
  tenantId: string;
  accommodationId: string;
  landlordId: string;
  startDate: string;
  endDate: string;
  amount: number;
  timestamp: number;
}

export interface RentCancelled {
  eventType: 'rent.cancelled';
  rentId: string;
  cancelledBy: 'tenant' | 'landlord' | 'system'; 
  reason: string;
  timestamp: number;
}

export interface RentFailed {
  eventType: 'rent.failed';
  rentId: string;
  step: 'user_validation' | 'availability_check' | 'payment_hold';
  reason: string;
  timestamp: number;
}

export interface RentConfirmed {
  eventType: "rent.confirmed";
  rentId: string;
  accommodationId: string;
  timestamp: number;
};