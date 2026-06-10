import { IAddress } from './address.interface';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  dateOfBirth: Date | null;
  addresses?: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}
