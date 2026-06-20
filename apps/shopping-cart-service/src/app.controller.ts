import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddProductToCartDto,
  CreateCartDto,
  PublicCartDto,
  PublicCartItemDto,
  RemoveProductFromCartDto,
  SetProductQuantityInCartDto,
  SHOPPING_CART_PATTERNS,
} from '@repo/shared';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern(SHOPPING_CART_PATTERNS.CREATE)
  createCart(@Payload() createCartDto: CreateCartDto): Promise<PublicCartDto> {
    return this.appService.create(createCartDto);
  }

  @MessagePattern(SHOPPING_CART_PATTERNS.ADD_PRODUCT)
  addProductToCart(
    @Payload() addProductToCartDto: AddProductToCartDto,
  ): Promise<PublicCartItemDto> {
    return this.appService.addProductToCart(addProductToCartDto);
  }

  @MessagePattern(SHOPPING_CART_PATTERNS.REMOVE_PRODUCT)
  removeProductFromCart(
    @Payload() removeProductFromCartDto: RemoveProductFromCartDto,
  ): Promise<PublicCartItemDto> {
    return this.appService.removeProductFromCart(removeProductFromCartDto);
  }

  @MessagePattern(SHOPPING_CART_PATTERNS.SET_PRODUCT_QUANTITY)
  setProductQuantityInCart(
    @Payload() setProductQuantityInCartDto: SetProductQuantityInCartDto,
  ): Promise<PublicCartItemDto> {
    return this.appService.setProductQuantityInCart(
      setProductQuantityInCartDto,
    );
  }
}
