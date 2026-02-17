import "./enum.tsp";

using Http;

namespace RestaurantApi;

model Booking {
  id: string;
  userId: string;
  restaurantId: string;
  fromDate: utcDateTime;
  toDate: utcDateTime;
  guestCount: int32;
  status: BookingStatus;
  createdAt: utcDateTime;
}

model CreateBookingDto {
  fromDate: utcDateTime;
  toDate: utcDateTime;
  guestCount: int32;
  comment?: string;
}