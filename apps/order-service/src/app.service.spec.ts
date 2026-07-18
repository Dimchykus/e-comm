import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  MICROSERVICES,
  NOTIFICATION_EVENTS,
  OrderStatus,
  PRODUCTS_PATTERNS,
  SHOPPING_CART_PATTERNS,
} from '@repo/shared';
import { of, throwError } from 'rxjs';
import { AppService } from './app.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

describe('AppService (order)', () => {
  let service: AppService;

  const orderRepository = {
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };
  const notificationClient = { emit: jest.fn() };
  const cartClient = { send: jest.fn() };
  const productsClient = { send: jest.fn() };

  const cart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      { productId: 'product-1', name: 'Widget', price: 10, quantity: 2 },
      { productId: 'product-2', name: 'Gadget', price: 5.5, quantity: 1 },
    ],
  };

  const buildOrder = (status: OrderStatus): Order =>
    Object.assign(new Order(), {
      id: 'order-1',
      userId: 'user-1',
      status,
      total: 25.5,
      items: [
        Object.assign(new OrderItem(), {
          id: 'item-1',
          productId: 'product-1',
          name: 'Widget',
          price: 10,
          quantity: 2,
        }),
      ],
    });

  beforeEach(async () => {
    jest.clearAllMocks();
    notificationClient.emit.mockReturnValue(of(undefined));
    productsClient.send.mockReturnValue(of(undefined));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        {
          provide: MICROSERVICES.NOTIFICATION_SERVICE,
          useValue: notificationClient,
        },
        { provide: MICROSERVICES.SHOPPING_CART_SERVICE, useValue: cartClient },
        { provide: MICROSERVICES.PRODUCTS_SERVICE, useValue: productsClient },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('create', () => {
    it('creates a pending order from the cart, clears it, and emits order.created', async () => {
      cartClient.send.mockImplementation((pattern: string) =>
        of(pattern === SHOPPING_CART_PATTERNS.GET ? cart : {}),
      );
      orderRepository.save.mockImplementation((order: Order) =>
        Promise.resolve(Object.assign(order, { id: 'order-1' })),
      );

      const result = await service.create({ userId: 'user-1' });

      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.total).toBe(25.5);
      expect(result.items).toHaveLength(2);
      expect(cartClient.send).toHaveBeenCalledWith(
        SHOPPING_CART_PATTERNS.CLEAR,
        { userId: 'user-1' },
      );
      expect(notificationClient.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.ORDER_CREATED,
        { orderId: 'order-1', userId: 'user-1', total: 25.5 },
      );
    });

    it('rejects when the cart is empty', async () => {
      cartClient.send.mockReturnValue(of({ ...cart, items: [] }));

      await expect(service.create({ userId: 'user-1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('rejects when the cart service is unavailable', async () => {
      cartClient.send.mockReturnValue(throwError(() => new Error('down')));

      await expect(service.create({ userId: 'user-1' })).rejects.toThrow(
        'Failed to load the user cart',
      );
    });
  });

  describe('findById', () => {
    it('returns the order when found', async () => {
      orderRepository.findOneBy.mockResolvedValue(
        buildOrder(OrderStatus.PENDING),
      );

      await expect(service.findById('order-1')).resolves.toMatchObject({
        id: 'order-1',
        status: OrderStatus.PENDING,
      });
    });

    it('throws NotFoundException when missing', async () => {
      orderRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByUser', () => {
    it('returns the orders of the user, newest first', async () => {
      orderRepository.find.mockResolvedValue([buildOrder(OrderStatus.PAID)]);

      const result = await service.findByUser('user-1');

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('updates the status and emits order.shipped when shipped', async () => {
      orderRepository.findOneBy.mockResolvedValue(
        buildOrder(OrderStatus.PROCESSING),
      );
      orderRepository.save.mockImplementation((order: Order) =>
        Promise.resolve(order),
      );

      const result = await service.updateStatus({
        orderId: 'order-1',
        status: OrderStatus.SHIPPED,
      });

      expect(result.status).toBe(OrderStatus.SHIPPED);
      expect(notificationClient.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.ORDER_SHIPPED,
        { orderId: 'order-1', userId: 'user-1' },
      );
    });

    it('does not emit order.shipped for other statuses', async () => {
      orderRepository.findOneBy.mockResolvedValue(buildOrder(OrderStatus.PAID));
      orderRepository.save.mockImplementation((order: Order) =>
        Promise.resolve(order),
      );

      await service.updateStatus({
        orderId: 'order-1',
        status: OrderStatus.PROCESSING,
      });

      expect(notificationClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels a pending order', async () => {
      orderRepository.findOneBy.mockResolvedValue(
        buildOrder(OrderStatus.PENDING),
      );
      orderRepository.save.mockImplementation((order: Order) =>
        Promise.resolve(order),
      );

      const result = await service.cancel('order-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('rejects cancelling a delivered order', async () => {
      orderRepository.findOneBy.mockResolvedValue(
        buildOrder(OrderStatus.DELIVERED),
      );

      await expect(service.cancel('order-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(orderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentSucceeded', () => {
    const event = {
      paymentId: 'payment-1',
      orderId: 'order-1',
      userId: 'user-1',
      amount: 25.5,
    };

    it('marks the order paid and decrements stock for each item', async () => {
      const order = buildOrder(OrderStatus.PENDING);
      orderRepository.findOneBy.mockResolvedValue(order);
      orderRepository.save.mockImplementation((toSave: Order) =>
        Promise.resolve(toSave),
      );

      await service.handlePaymentSucceeded(event);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.PAID }),
      );
      expect(productsClient.send).toHaveBeenCalledWith(
        PRODUCTS_PATTERNS.UPDATE_STOCK,
        { id: 'product-1', data: { delta: -2 } },
      );
    });

    it('ignores payments for unknown orders', async () => {
      orderRepository.findOneBy.mockResolvedValue(null);

      await service.handlePaymentSucceeded(event);

      expect(orderRepository.save).not.toHaveBeenCalled();
      expect(productsClient.send).not.toHaveBeenCalled();
    });
  });
});
