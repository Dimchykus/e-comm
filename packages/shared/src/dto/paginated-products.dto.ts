import { ApiProperty } from "@nestjs/swagger";
import { PublicProductDto } from "./public-product.dto";

export class PaginatedProductsDto {
  @ApiProperty({ type: [PublicProductDto] })
  data: PublicProductDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
