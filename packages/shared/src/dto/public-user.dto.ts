import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../interfaces/user.interface";

export class PublicUserDto {
  @ApiProperty({
    example: "9f1c2d3e-4b5a-6789-0abc-def123456789",
    description: "Unique identifier of the user.",
  })
  id: string;

  @ApiProperty({ example: "jane.doe@example.com" })
  email: string;

  @ApiProperty({ example: "Jane" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiProperty({ example: "+15551234567", nullable: true })
  phone: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ example: false })
  isEmailVerified: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: "https://cdn.example.com/avatars/jane.png",
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    example: "1990-05-15T00:00:00.000Z",
    type: String,
    format: "date-time",
    nullable: true,
  })
  dateOfBirth: Date | null;

  @ApiProperty({
    example: "2026-01-01T12:00:00.000Z",
    type: String,
    format: "date-time",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2026-01-01T12:00:00.000Z",
    type: String,
    format: "date-time",
  })
  updatedAt: Date;
}
