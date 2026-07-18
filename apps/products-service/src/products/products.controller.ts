import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateProductDto,
  FindAllProductsDto,
  PaginatedProductsDto,
  PRODUCTS_PATTERNS,
  PublicProductDto,
  SearchProductsDto,
  UpdateProductPayload,
  UpdateStockPayload,
} from '@repo/shared';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(PRODUCTS_PATTERNS.FIND_ALL)
  findAllProducts(
    @Payload() findAllProductsDto: FindAllProductsDto,
  ): Promise<PaginatedProductsDto> {
    return this.productsService.findAll(findAllProductsDto);
  }

  @MessagePattern(PRODUCTS_PATTERNS.FIND_BY_ID)
  getProduct(@Payload('id') id: string): Promise<PublicProductDto> {
    return this.productsService.findById(id);
  }

  @MessagePattern(PRODUCTS_PATTERNS.SEARCH)
  searchProducts(
    @Payload() searchProductsDto: SearchProductsDto,
  ): Promise<PaginatedProductsDto> {
    return this.productsService.search(searchProductsDto);
  }

  @MessagePattern(PRODUCTS_PATTERNS.CREATE)
  createProduct(
    @Payload() createProductDto: CreateProductDto,
  ): Promise<PublicProductDto> {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern(PRODUCTS_PATTERNS.UPDATE)
  updateProduct(
    @Payload() { id, data }: UpdateProductPayload,
  ): Promise<PublicProductDto> {
    return this.productsService.update(id, data);
  }

  @MessagePattern(PRODUCTS_PATTERNS.UPDATE_STOCK)
  updateStock(
    @Payload() { id, data }: UpdateStockPayload,
  ): Promise<PublicProductDto> {
    return this.productsService.updateStock(id, data.delta);
  }

  @MessagePattern(PRODUCTS_PATTERNS.DELETE)
  deleteProduct(@Payload('id') id: string): Promise<void> {
    return this.productsService.delete(id);
  }
}
