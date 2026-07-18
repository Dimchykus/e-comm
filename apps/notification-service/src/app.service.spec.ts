import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NOTIFICATION_EVENTS,
  NotificationChannel,
  NotificationStatus,
} from '@repo/shared';
import { AppService } from './app.service';
import { NotificationLog } from './entities/notification-log.entity';

describe('AppService (notification)', () => {
  let service: AppService;

  const notificationLogRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    notificationLogRepository.save.mockImplementation((log: NotificationLog) =>
      Promise.resolve(log),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: notificationLogRepository,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('logs a sent email notification for order.created', async () => {
    await service.handleOrderCreated({
      orderId: 'order-1',
      userId: 'user-1',
      total: 25.5,
    });

    expect(notificationLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NOTIFICATION_EVENTS.ORDER_CREATED,
        userId: 'user-1',
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.SENT,
        message: expect.stringContaining('order-1') as string,
      }),
    );
  });

  it('logs a notification for payment.succeeded with the amount', async () => {
    await service.handlePaymentSucceeded({
      paymentId: 'payment-1',
      orderId: 'order-1',
      userId: 'user-1',
      amount: 25.5,
    });

    expect(notificationLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NOTIFICATION_EVENTS.PAYMENT_SUCCEEDED,
        userId: 'user-1',
        message: expect.stringContaining('25.5') as string,
      }),
    );
  });

  it('logs a notification for payment.failed', async () => {
    await service.handlePaymentFailed({
      paymentId: 'payment-1',
      orderId: 'order-1',
      userId: 'user-1',
      amount: 25.5,
    });

    expect(notificationLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NOTIFICATION_EVENTS.PAYMENT_FAILED,
        userId: 'user-1',
      }),
    );
  });

  it('logs a notification for order.shipped', async () => {
    await service.handleOrderShipped({
      orderId: 'order-1',
      userId: 'user-1',
    });

    expect(notificationLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NOTIFICATION_EVENTS.ORDER_SHIPPED,
        userId: 'user-1',
        message: expect.stringContaining('shipped') as string,
      }),
    );
  });
});
