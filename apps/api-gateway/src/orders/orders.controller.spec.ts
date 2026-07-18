import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MICROSERVICES, ORDERS_PATTERNS, OrderStatus } from '@repo/shared';
import { of, throwError } from 'rxjs';
import { OrdersController } from './orders.controller';

describe('OrdersController', () => {
  let controller: OrdersController;

  const orderClient = { send: jest.fn() };

  const order = {
    id: 'order-1',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    total: 25.5,
    items: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: MICROSERVICES.ORDER_SERVICE, useValue: orderClient },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('createOrder forwards the dto', async () => {
    orderClient.send.mockReturnValue(of(order));

    await expect(controller.createOrder({ userId: 'user-1' })).resolves.toEqual(
      order,
    );
    expect(orderClient.send).toHaveBeenCalledWith(ORDERS_PATTERNS.CREATE, {
      userId: 'user-1',
    });
  });

  it('findOrderById sends the order id', async () => {
    orderClient.send.mockReturnValue(of(order));

    await expect(controller.findOrderById('order-1')).resolves.toEqual(order);
    expect(orderClient.send).toHaveBeenCalledWith(ORDERS_PATTERNS.FIND_BY_ID, {
      orderId: 'order-1',
    });
  });

  it('findOrdersByUser sends the user id', async () => {
    orderClient.send.mockReturnValue(of([order]));

    await expect(controller.findOrdersByUser('user-1')).resolves.toEqual([
      order,
    ]);
    expect(orderClient.send).toHaveBeenCalledWith(
      ORDERS_PATTERNS.FIND_BY_USER,
      { userId: 'user-1' },
    );
  });

  it('updateOrderStatus sends the order id and new status', async () => {
    orderClient.send.mockReturnValue(
      of({ ...order, status: OrderStatus.SHIPPED }),
    );

    await controller.updateOrderStatus('order-1', {
      status: OrderStatus.SHIPPED,
    });

    expect(orderClient.send).toHaveBeenCalledWith(
      ORDERS_PATTERNS.UPDATE_STATUS,
      { orderId: 'order-1', status: OrderStatus.SHIPPED },
    );
  });

  it('cancelOrder sends the order id', async () => {
    orderClient.send.mockReturnValue(
      of({ ...order, status: OrderStatus.CANCELLED }),
    );

    await controller.cancelOrder('order-1');

    expect(orderClient.send).toHaveBeenCalledWith(ORDERS_PATTERNS.CANCEL, {
      orderId: 'order-1',
    });
  });

  it('maps RPC errors to HttpExceptions with the original status', async () => {
    orderClient.send.mockReturnValue(
      throwError(() => ({ statusCode: 404, message: 'Order not found' })),
    );

    const promise = controller.findOrderById('missing');

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await promise.catch((err: HttpException) => {
      expect(err.getStatus()).toBe(404);
    });
  });
});
