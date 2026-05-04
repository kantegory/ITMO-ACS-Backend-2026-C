export interface AccommodationAvailabilityResult {
  eventType: 'accommodation.availability.success' | 'accommodation.availability.failure';
  rentId: string;
  accommodationId: string;
  startDate: string;
  endDate: string;
  landlordId: string;      
  reason?: string;
  timestamp: number;
}

export interface AccommodationBlocked {
  eventType: 'accommodation.blocked';
  rentId: string;
  accommodationId: string;
  startDate: string;
  endDate: string;
  timestamp: number;
}

export interface AccommodationBlockFailed {
  eventType: 'accommodation.block.failed';
  rentId: string;
  accommodationId: string;
  startDate: string;
  endDate: string;
  reason: string;
  timestamp: number;
}

export interface AccommodationUnblocked {
  eventType: 'accommodation.unblocked';
  rentId: string;
  accommodationId: string;
  startDate: string;
  endDate: string;
  timestamp: number;
}
