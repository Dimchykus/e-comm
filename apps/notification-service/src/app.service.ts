import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_EVENTS,
  NotificationChannel,
  NotificationStatus,
  OrderCreatedEvent,
  OrderShippedEvent,
  PaymentFailedEvent,
  PaymentSucceededEvent,
} from '@repo/shared';
import { NotificationLog } from './entities/notification-log.entity';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
  ) {}

  handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    return this.deliver(
      NOTIFICATION_EVENTS.ORDER_CREATED,
      event.userId,
      `Your order ${event.orderId} has been placed. Total: $${event.total}`,
    );
  }

  handlePaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
    return this.deliver(
      NOTIFICATION_EVENTS.PAYMENT_SUCCEEDED,
      event.userId,
      `Payment of $${event.amount} for order ${event.orderId} was successful`,
    );
  }

  handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    return this.deliver(
      NOTIFICATION_EVENTS.PAYMENT_FAILED,
      event.userId,
      `Payment for order ${event.orderId} failed. Please try again`,
    );
  }

  handleOrderShipped(event: OrderShippedEvent): Promise<void> {
    return this.deliver(
      NOTIFICATION_EVENTS.ORDER_SHIPPED,
      event.userId,
      `Your order ${event.orderId} has been shipped`,
    );
  }

  // SendGrid/Twilio integration pending; deliveries are logged only
  private async deliver(
    event: string,
    userId: string,
    message: string,
  ): Promise<void> {
    this.logger.log(`[${event}] to user ${userId}: ${message}`);

    const log = new NotificationLog();
    log.event = event;
    log.userId = userId;
    log.channel = NotificationChannel.EMAIL;
    log.message = message;
    log.status = NotificationStatus.SENT;

    await this.notificationLogRepository.save(log);
  }
}
