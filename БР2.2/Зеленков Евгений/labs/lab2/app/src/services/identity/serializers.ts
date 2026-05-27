import { User } from './entities';

export function userDto(user: User) {
  return {
    id: user.id,
    name: user.name,
    birthdate: user.birthdate,
    phone: user.phone,
    isVerified: user.isVerified,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function internalUserDto(user: User) {
  return {
    id: user.id,
    role: user.role,
    isVerified: user.isVerified
  };
}
