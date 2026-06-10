export interface IAddress {
  id: string;
  userId: string;
  label: string | null;
  firstName: string;
  lastName: string;
  street: string;
  street2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
