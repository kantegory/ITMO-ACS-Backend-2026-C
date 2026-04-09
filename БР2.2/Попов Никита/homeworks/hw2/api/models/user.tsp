import "./enum.tsp";

namespace RestaurantApi;

model User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: utcDateTime;
}