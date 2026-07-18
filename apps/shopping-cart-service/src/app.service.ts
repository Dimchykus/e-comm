import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import {
  AddProductToCartDto,
  CreateCartDto,
  MICROSERVICES,
  PRODUCTS_PATTERNS,
  PublicCartDto,
  PublicCartItemDto,
  PublicProductDto,
  RemoveProductFromCartDto,
  SetProductQuantityInCartDto,
} from '@repo/shared';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { CartItem } from './entities/cart-item.entity';
import { toPublicCart, toPublicCartItem } from './utlis/map';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @Inject(MICROSERVICES.PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy,
  ) {}

  private findProduct(productId: string): Promise<PublicProductDto> {
    return firstValueFrom(
      this.productsClient
        .send<PublicProductDto>(PRODUCTS_PATTERNS.FIND_BY_ID, {
          id: productId,
        })
        .pipe(
          catchError(() =>
            throwError(() => new NotFoundException('Product not found')),
          ),
        ),
    );
  }

  async create(createCartDto: CreateCartDto): Promise<PublicCartDto> {
    const cart = new Cart();

    cart.userId = createCartDto.userId;
    cart.items = [];

    const savedCart = await this.cartRepository.save(cart);

    return toPublicCart(savedCart);
  }

  async get(userId: string): Promise<PublicCartDto> {
    let cart = await this.cartRepository.findOneBy({ userId });

    if (!cart) {
      cart = new Cart();
      cart.userId = userId;
      cart.items = [];
      cart = await this.cartRepository.save(cart);
    }

    return toPublicCart(cart);
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

    const existingItem = cart.items.find(
      (item) => item.productId === addProductToCartDto.productId,
    );

    if (existingItem) {
      existingItem.quantity += 1;

      await this.cartItemRepository.save(existingItem);

      return toPublicCartItem(existingItem);
    }

    const product = await this.findProduct(addProductToCartDto.productId);

    const item = new CartItem();
    item.cart = cart;
    item.productId = product.id;
    item.name = product.name;
    item.price = product.price;
    item.quantity = 1;

    await this.cartItemRepository.save(item);

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

    await this.cartItemRepository.remove(item);

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

  async clear(userId: string): Promise<PublicCartDto> {
    const cart = await this.cartRepository.findOneBy({ userId });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    cart.items = [];

    return toPublicCart(cart);
  }
}
