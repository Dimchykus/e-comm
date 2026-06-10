import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateProductDto,
  FindAllProductsDto,
  MICROSERVICES,
  PRODUCT_PATTERNS,
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

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Slug or SKU already exists' })
  create(@Body() dto: CreateProductDto) {
    return this.send(PRODUCT_PATTERNS.CREATE, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  findAll(@Query() query: FindAllProductsDto) {
    return this.send(PRODUCT_PATTERNS.FIND_ALL, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by name, description or brand' })
  @ApiResponse({ status: 200, description: 'Paginated search results' })
  search(@Query() query: SearchProductsDto) {
    return this.send(PRODUCT_PATTERNS.SEARCH, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'The product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.send(PRODUCT_PATTERNS.FIND_ONE, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Updated product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.send(PRODUCT_PATTERNS.UPDATE, { id, data: dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.send(PRODUCT_PATTERNS.DELETE, id);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Adjust product stock by a delta' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product with updated stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 422, description: 'Insufficient stock' })
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.send(PRODUCT_PATTERNS.UPDATE_STOCK, { id, data: dto });
  }
}
