import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateCartDto,
  MICROSERVICES,
  PublicCartDto,
  PublicCartItemDto,
  SHOPPING_CART_PATTERNS,
} from '@repo/shared';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { toHttpException } from '../common/rpc-error.util';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { SetCartItemQuantityDto } from './dto/set-cart-item-quantity.dto';

@ApiTags('carts')
@Controller('carts')
export class ShoppingCartController {
  constructor(
    @Inject(MICROSERVICES.SHOPPING_CART_SERVICE)
    private readonly shoppingCartClient: ClientProxy,
  ) {}

  private send<T = unknown>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.shoppingCartClient
        .send<T>(pattern, payload)
        .pipe(catchError((err) => throwError(() => toHttpException(err)))),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new cart' })
  @ApiResponse({ status: 201, type: PublicCartDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  createCart(@Body() createCartDto: CreateCartDto): Promise<PublicCartDto> {
    return this.send(SHOPPING_CART_PATTERNS.CREATE, createCartDto);
  }

  @Post(':cartId/items')
  @ApiOperation({ summary: 'Add a product to the cart' })
  @ApiResponse({ status: 201, type: PublicCartItemDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Cart or product not found' })
  addItem(
    @Param('cartId') cartId: string,
    @Body() { productId }: AddCartItemDto,
  ): Promise<PublicCartItemDto> {
    return this.send(SHOPPING_CART_PATTERNS.ADD_PRODUCT, { cartId, productId });
  }

  @Delete(':cartId/items/:productId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a product from the cart' })
  @ApiResponse({ status: 200, type: PublicCartItemDto })
  @ApiResponse({ status: 404, description: 'Cart or product not found' })
  removeItem(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
  ): Promise<PublicCartItemDto> {
    return this.send(SHOPPING_CART_PATTERNS.REMOVE_PRODUCT, {
      cartId,
      productId,
    });
  }

  @Patch(':cartId/items/:productId')
  @ApiOperation({ summary: 'Set the quantity of a product in the cart' })
  @ApiResponse({ status: 200, type: PublicCartItemDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Cart or product not found' })
  setItemQuantity(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body() { quantity }: SetCartItemQuantityDto,
  ): Promise<PublicCartItemDto> {
    return this.send(SHOPPING_CART_PATTERNS.SET_PRODUCT_QUANTITY, {
      cartId,
      productId,
      quantity,
    });
  }
}
