import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MICROSERVICES, PRODUCTS_PATTERNS } from '@repo/shared';
import { of, throwError } from 'rxjs';
import { AppService } from './app.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

describe('AppService (shopping-cart)', () => {
  let service: AppService;

  const cartRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const cartItemRepository = {
    save: jest.fn(),
    remove: jest.fn(),
  };
  const productsClient = {
    send: jest.fn(),
  };

  const buildCart = (items: Partial<CartItem>[] = []): Cart =>
    Object.assign(new Cart(), {
      id: 'cart-1',
      userId: 'user-1',
      items: items.map((item) => Object.assign(new CartItem(), item)),
    });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: getRepositoryToken(Cart), useValue: cartRepository },
        { provide: getRepositoryToken(CartItem), useValue: cartItemRepository },
        { provide: MICROSERVICES.PRODUCTS_SERVICE, useValue: productsClient },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('get', () => {
    it('returns the existing cart for a user', async () => {
      cartRepository.findOneBy.mockResolvedValue(buildCart());

      const result = await service.get('user-1');

      expect(result).toMatchObject({ id: 'cart-1', userId: 'user-1' });
      expect(cartRepository.save).not.toHaveBeenCalled();
    });

    it('creates an empty cart on first access', async () => {
      cartRepository.findOneBy.mockResolvedValue(null);
      cartRepository.save.mockResolvedValue(buildCart());

      const result = await service.get('user-1');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', items: [] }),
      );
      expect(result.items).toEqual([]);
    });
  });

  describe('addProductToCart', () => {
    it('adds a new item with product details from the products service', async () => {
      cartRepository.findOneBy.mockResolvedValue(buildCart());
      productsClient.send.mockReturnValue(
        of({ id: 'product-1', name: 'Widget', price: 19.99 }),
      );
      cartItemRepository.save.mockResolvedValue(undefined);

      const result = await service.addProductToCart({
        cartId: 'cart-1',
        productId: 'product-1',
      });

      expect(productsClient.send).toHaveBeenCalledWith(
        PRODUCTS_PATTERNS.FIND_BY_ID,
        { id: 'product-1' },
      );
      expect(result).toMatchObject({
        productId: 'product-1',
        name: 'Widget',
        price: 19.99,
        quantity: 1,
      });
    });

    it('increments the quantity when the product is already in the cart', async () => {
      const cart = buildCart([
        { id: 'item-1', productId: 'product-1', name: 'Widget', quantity: 2 },
      ]);
      cartRepository.findOneBy.mockResolvedValue(cart);
      cartItemRepository.save.mockResolvedValue(undefined);

      const result = await service.addProductToCart({
        cartId: 'cart-1',
        productId: 'product-1',
      });

      expect(result.quantity).toBe(3);
      expect(productsClient.send).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the cart does not exist', async () => {
      cartRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.addProductToCart({ cartId: 'missing', productId: 'product-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the product lookup fails', async () => {
      cartRepository.findOneBy.mockResolvedValue(buildCart());
      productsClient.send.mockReturnValue(
        throwError(() => new Error('service down')),
      );

      await expect(
        service.addProductToCart({ cartId: 'cart-1', productId: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeProductFromCart', () => {
    it('removes the item from the cart', async () => {
      const cart = buildCart([
        { id: 'item-1', productId: 'product-1', quantity: 1 },
      ]);
      cartRepository.findOneBy.mockResolvedValue(cart);
      cartItemRepository.remove.mockResolvedValue(undefined);

      const result = await service.removeProductFromCart({
        cartId: 'cart-1',
        productId: 'product-1',
      });

      expect(cartItemRepository.remove).toHaveBeenCalledWith(cart.items[0]);
      expect(result.productId).toBe('product-1');
    });

    it('throws NotFoundException when the product is not in the cart', async () => {
      cartRepository.findOneBy.mockResolvedValue(buildCart());

      await expect(
        service.removeProductFromCart({
          cartId: 'cart-1',
          productId: 'missing',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('setProductQuantityInCart', () => {
    it('sets the quantity of an existing item', async () => {
      const cart = buildCart([
        { id: 'item-1', productId: 'product-1', quantity: 1 },
      ]);
      cartRepository.findOneBy.mockResolvedValue(cart);
      cartItemRepository.save.mockResolvedValue(undefined);

      const result = await service.setProductQuantityInCart({
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 5,
      });

      expect(result.quantity).toBe(5);
      expect(cartItemRepository.save).toHaveBeenCalledWith(cart.items[0]);
    });
  });

  describe('clear', () => {
    it('removes all items from the cart', async () => {
      const cart = buildCart([
        { id: 'item-1', productId: 'product-1', quantity: 1 },
      ]);
      cartRepository.findOneBy.mockResolvedValue(cart);
      cartItemRepository.remove.mockResolvedValue(undefined);

      const result = await service.clear('user-1');

      expect(cartItemRepository.remove).toHaveBeenCalled();
      expect(result.items).toEqual([]);
    });

    it('throws NotFoundException when the cart does not exist', async () => {
      cartRepository.findOneBy.mockResolvedValue(null);

      await expect(service.clear('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
