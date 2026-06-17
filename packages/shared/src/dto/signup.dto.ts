import { UserRole } from "..";

export class SignupDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}
