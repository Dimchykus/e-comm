import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateProductDto,
  FindAllProductsDto,
  PRODUCT_PATTERNS,
  SearchProductsDto,
  UpdateProductPayload,
  UpdateStockPayload,
} from '@repo/shared';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(PRODUCT_PATTERNS.CREATE)
  create(@Payload() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @MessagePattern(PRODUCT_PATTERNS.FIND_ALL)
  findAll(@Payload() query: FindAllProductsDto) {
    return this.productsService.findAll(query);
  }

  @MessagePattern(PRODUCT_PATTERNS.FIND_ONE)
  findOne(@Payload() id: string) {
    return this.productsService.findOne(id);
  }

  @MessagePattern(PRODUCT_PATTERNS.UPDATE)
  update(@Payload() payload: UpdateProductPayload) {
    return this.productsService.update(payload.id, payload.data);
  }

  @MessagePattern(PRODUCT_PATTERNS.DELETE)
  remove(@Payload() id: string) {
    return this.productsService.remove(id);
  }

  @MessagePattern(PRODUCT_PATTERNS.SEARCH)
  search(@Payload() query: SearchProductsDto) {
    return this.productsService.search(query);
  }

  @MessagePattern(PRODUCT_PATTERNS.UPDATE_STOCK)
  updateStock(@Payload() payload: UpdateStockPayload) {
    return this.productsService.updateStock(payload.id, payload.data);
  }
}
