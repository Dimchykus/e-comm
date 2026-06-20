import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsInt } from "class-validator";

export class SetProductQuantityInCartDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsString()
  @IsNotEmpty()
  cartId: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
