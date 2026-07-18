import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MICROSERVICES, SHOPPING_CART_PATTERNS } from '@repo/shared';
import { of, throwError } from 'rxjs';
import { ShoppingCartController } from './shopping-cart.controller';

describe('ShoppingCartController', () => {
  let controller: ShoppingCartController;

  const shoppingCartClient = { send: jest.fn() };

  const cart = { id: 'cart-1', userId: 'user-1', items: [] };
  const cartItem = {
    id: 'item-1',
    productId: 'product-1',
    name: 'Widget',
    price: 19.99,
    quantity: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingCartController],
      providers: [
        {
          provide: MICROSERVICES.SHOPPING_CART_SERVICE,
          useValue: shoppingCartClient,
        },
      ],
    }).compile();

    controller = module.get<ShoppingCartController>(ShoppingCartController);
  });

  it('createCart forwards the dto', async () => {
    shoppingCartClient.send.mockReturnValue(of(cart));

    await expect(controller.createCart({ userId: 'user-1' })).resolves.toEqual(
      cart,
    );
    expect(shoppingCartClient.send).toHaveBeenCalledWith(
      SHOPPING_CART_PATTERNS.CREATE,
      { userId: 'user-1' },
    );
  });

  it('getCart requests the cart by user id', async () => {
    shoppingCartClient.send.mockReturnValue(of(cart));

    await expect(controller.getCart('user-1')).resolves.toEqual(cart);
    expect(shoppingCartClient.send).toHaveBeenCalledWith(
      SHOPPING_CART_PATTERNS.GET,
      { userId: 'user-1' },
    );
  });

  it('addItem sends the cart and product ids', async () => {
    shoppingCartClient.send.mockReturnValue(of(cartItem));

    await expect(
      controller.addItem('cart-1', { productId: 'product-1' }),
    ).resolves.toEqual(cartItem);
    expect(shoppingCartClient.send).toHaveBeenCalledWith(
      SHOPPING_CART_PATTERNS.ADD_PRODUCT,
      { cartId: 'cart-1', productId: 'product-1' },
    );
  });

  it('setItemQuantity sends the new quantity', async () => {
    shoppingCartClient.send.mockReturnValue(of({ ...cartItem, quantity: 4 }));

    await controller.setItemQuantity('cart-1', 'product-1', { quantity: 4 });

    expect(shoppingCartClient.send).toHaveBeenCalledWith(
      SHOPPING_CART_PATTERNS.SET_PRODUCT_QUANTITY,
      { cartId: 'cart-1', productId: 'product-1', quantity: 4 },
    );
  });

  it('removeItem sends the cart and product ids', async () => {
    shoppingCartClient.send.mockReturnValue(of(cartItem));

    await controller.removeItem('cart-1', 'product-1');

    expect(shoppingCartClient.send).toHaveBeenCalledWith(
      SHOPPING_CART_PATTERNS.REMOVE_PRODUCT,
      { cartId: 'cart-1', productId: 'product-1' },
    );
  });

  it('clearCart maps RPC errors to HttpExceptions', async () => {
    shoppingCartClient.send.mockReturnValue(
      throwError(() => ({ statusCode: 404, message: 'Cart not found' })),
    );

    const promise = controller.clearCart('missing');

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await promise.catch((err: HttpException) => {
      expect(err.getStatus()).toBe(404);
    });
  });
});
