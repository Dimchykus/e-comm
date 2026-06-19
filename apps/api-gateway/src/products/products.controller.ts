import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateProductDto,
  MICROSERVICES,
  PRODUCTS_PATTERNS,
  PublicProductDto,
  UpdateProductDto,
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
    return this.send(PRODUCTS_PATTERNS.UPDATE, { id, updateProductDto });
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
