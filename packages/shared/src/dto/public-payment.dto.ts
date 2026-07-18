import { ApiProperty } from "@nestjs/swagger";
import { PaymentStatus } from "../interfaces/payment.interface";

export class PublicPaymentDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  orderId: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  userId: string;

  @ApiProperty({ example: 59.98 })
  amount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.SUCCEEDED })
  status: PaymentStatus;

  @ApiProperty({ example: "2026-07-18T12:00:00.000Z" })
  createdAt: Date;
}
