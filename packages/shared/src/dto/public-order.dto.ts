import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "../interfaces/order.interface";
import { PublicOrderItemDto } from "./public-order-item.dto";

export class PublicOrderDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  userId: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: 59.98 })
  total: number;

  @ApiProperty({ type: [PublicOrderItemDto] })
  items: PublicOrderItemDto[];

  @ApiProperty({ example: "2026-07-18T12:00:00.000Z" })
  createdAt: Date;
}
