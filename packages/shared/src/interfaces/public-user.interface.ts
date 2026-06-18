import { IUser } from './user.interface';

/**
 * Single source of truth for which user fields are safe to expose to clients.
 * Add or remove a key here and both the `PublicUser` type and the
 * `toPublicUser` mapper update automatically.
 */
export const PUBLIC_USER_FIELDS = [
  'id',
  'email',
  'firstName',
  'lastName',
  'phone',
  'role',
  'isEmailVerified',
  'isActive',
  'avatarUrl',
  'dateOfBirth',
  'createdAt',
  'updatedAt',
] as const;

export type PublicUser = Pick<IUser, (typeof PUBLIC_USER_FIELDS)[number]>;

/** Maps any full user object down to only its public-safe fields. */
export function toPublicUser(user: IUser): PublicUser {
  const result = {} as PublicUser;

  for (const key of PUBLIC_USER_FIELDS) {
    (result[key] as PublicUser[typeof key]) = user[key];
  }

  return result;
}
