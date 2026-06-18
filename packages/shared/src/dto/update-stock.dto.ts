import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export class UpdateStockDto {
  @ApiProperty({
    example: -2,
    description: "Stock change: positive to restock, negative to decrement",
  })
  @IsInt()
  delta: number;
}
