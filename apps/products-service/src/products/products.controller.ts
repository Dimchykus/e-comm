import { Body, Controller, Get, Param } from '@nestjs/common';
import {
  CreateProductDto,
  PRODUCTS_PATTERNS,
  PublicProductDto,
  UpdateProductDto,
} from '@repo/shared';
import { ProductsService } from './products.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  @MessagePattern(PRODUCTS_PATTERNS.FIND_BY_ID)
  getProduct(@Param('id') id: string): Promise<PublicProductDto> {
    return this.productsService.findById(id);
  }

  @MessagePattern(PRODUCTS_PATTERNS.CREATE)
  createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<PublicProductDto> {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern(PRODUCTS_PATTERNS.UPDATE)
  updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<PublicProductDto> {
    return this.productsService.update(id, updateProductDto);
  }

  @MessagePattern(PRODUCTS_PATTERNS.DELETE)
  deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productsService.delete(id);
  }
}
