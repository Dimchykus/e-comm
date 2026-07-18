import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateProductDto,
  FindAllProductsDto,
  MICROSERVICES,
  PaginatedProductsDto,
  PRODUCTS_PATTERNS,
  PublicProductDto,
  SearchProductsDto,
  UpdateProductDto,
  UpdateStockDto,
} from '@repo/shared';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { toHttpException } from '../common/rpc-error.util';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(MICROSERVICES.PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy,
  ) {}

  private send<T = unknown>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.productsClient
        .send<T>(pattern, payload)
        .pipe(catchError((err) => throwError(() => toHttpException(err)))),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List products with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated products',
    type: PaginatedProductsDto,
  })
  findAllProducts(
    @Query() findAllProductsDto: FindAllProductsDto,
  ): Promise<PaginatedProductsDto> {
    return this.send(PRODUCTS_PATTERNS.FIND_ALL, findAllProductsDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by name or description' })
  @ApiResponse({
    status: 200,
    description: 'Paginated search results',
    type: PaginatedProductsDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  searchProducts(
    @Query() searchProductsDto: SearchProductsDto,
  ): Promise<PaginatedProductsDto> {
    return this.send(PRODUCTS_PATTERNS.SEARCH, searchProductsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: PublicProductDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProduct(@Param('id') id: string): Promise<PublicProductDto> {
    return this.send(PRODUCTS_PATTERNS.FIND_BY_ID, { id });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: PublicProductDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<PublicProductDto> {
    return this.send(PRODUCTS_PATTERNS.CREATE, createProductDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated',
    type: PublicProductDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<PublicProductDto> {
    return this.send(PRODUCTS_PATTERNS.UPDATE, { id, data: updateProductDto });
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Adjust product stock by a delta' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stock updated',
    type: PublicProductDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<PublicProductDto> {
    return this.send(PRODUCTS_PATTERNS.UPDATE_STOCK, {
      id,
      data: updateStockDto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  deleteProduct(@Param('id') id: string): Promise<void> {
    return this.send(PRODUCTS_PATTERNS.DELETE, { id });
  }
}
