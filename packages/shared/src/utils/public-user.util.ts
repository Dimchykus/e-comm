import { PublicUserDto } from "../dto/public-user.dto";
import { IUser } from "../interfaces/user.interface";

/**
 * Single source of truth for which user fields are safe to expose to clients.
 * Add or remove a key here and the `toPublicUser` mapper updates automatically.
 * Keep the `PublicUserDto` class properties in sync with this list.
 */
export const PUBLIC_USER_FIELDS = [
  "id",
  "email",
  "firstName",
  "lastName",
  "phone",
  "role",
  "isEmailVerified",
  "isActive",
  "avatarUrl",
  "dateOfBirth",
  "createdAt",
  "updatedAt",
] as const;

/** Maps any full user object down to only its public-safe fields. */
export function toPublicUser(user: IUser): PublicUserDto {
  const result = new PublicUserDto();

  for (const key of PUBLIC_USER_FIELDS) {
    (result[key] as PublicUserDto[typeof key]) = user[key];
  }

  return result;
}
