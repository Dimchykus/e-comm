import { ApiProperty } from "@nestjs/swagger";
import { PublicCartItemDto } from "./public-cart-item.dto";

export class PublicCartDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  userId: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  items: PublicCartItemDto[];
}
