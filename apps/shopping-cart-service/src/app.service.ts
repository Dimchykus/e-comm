import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import {
  AddProductToCartDto,
  CreateCartDto,
  PublicCartDto,
  PublicCartItemDto,
  RemoveProductFromCartDto,
  SetProductQuantityInCartDto,
} from '@repo/shared';
import { CartItem } from './entities/cart-item.entity';
import { toPublicCart, toPublicCartItem } from './utlis/map';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async create(createCartDto: CreateCartDto): Promise<PublicCartDto> {
    const cart = new Cart();

    cart.userId = createCartDto.userId;
    cart.items = [];

    const savedCart = await this.cartRepository.save(cart);

    return toPublicCart(savedCart);
  }

  async addProductToCart(
    addProductToCartDto: AddProductToCartDto,
  ): Promise<PublicCartItemDto> {
    const cart = await this.cartRepository.findOneBy({
      id: addProductToCartDto.cartId,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = new CartItem();
    item.productId = addProductToCartDto.productId;
    item.quantity = 1;

    await this.cartItemRepository.save(item);

    cart.items.push(item);

    await this.cartRepository.save(cart);

    return toPublicCartItem(item);
  }

  async removeProductFromCart(
    removeProductFromCartDto: RemoveProductFromCartDto,
  ): Promise<PublicCartItemDto> {
    const cart = await this.cartRepository.findOneBy({
      id: removeProductFromCartDto.cartId,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find(
      (item) => item.productId === removeProductFromCartDto.productId,
    );

    if (!item) {
      throw new NotFoundException('Product not found in cart');
    }

    cart.items = cart.items.filter(
      (item) => item.productId !== removeProductFromCartDto.productId,
    );

    await this.cartRepository.save(cart);

    return toPublicCartItem(item);
  }

  async setProductQuantityInCart(
    setProductQuantityDto: SetProductQuantityInCartDto,
  ): Promise<PublicCartItemDto> {
    const cart = await this.cartRepository.findOneBy({
      id: setProductQuantityDto.cartId,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find(
      (item) => item.productId === setProductQuantityDto.productId,
    );

    if (!item) {
      throw new NotFoundException('Product not found in cart');
    }

    item.quantity = setProductQuantityDto.quantity;

    await this.cartItemRepository.save(item);

    return toPublicCartItem(item);
  }
}
