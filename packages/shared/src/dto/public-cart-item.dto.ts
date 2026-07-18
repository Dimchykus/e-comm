import { ApiProperty } from "@nestjs/swagger";

export class PublicCartItemDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  productId: string;

  @ApiProperty({ example: "Wireless Mouse" })
  name: string;

  @ApiProperty({ example: 29.99 })
  price: number;

  @ApiProperty({ example: 1 })
  quantity: number;
}
