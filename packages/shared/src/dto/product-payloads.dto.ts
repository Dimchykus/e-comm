import { Type } from "class-transformer";
import { IsUUID, ValidateNested } from "class-validator";
import { UpdateProductDto } from "./update-product.dto";
import { UpdateStockDto } from "./update-stock.dto";

/** TCP message payloads for patterns that target a single product. */
export class UpdateProductPayload {
  @IsUUID()
  id: string;

  @ValidateNested()
  @Type(() => UpdateProductDto)
  data: UpdateProductDto;
}

export class UpdateStockPayload {
  @IsUUID()
  id: string;

  @ValidateNested()
  @Type(() => UpdateStockDto)
  data: UpdateStockDto;
}
