import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  NOTIFICATION_EVENTS,
  OrderCreatedEvent,
  OrderShippedEvent,
  PaymentFailedEvent,
  PaymentSucceededEvent,
} from '@repo/shared';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern(NOTIFICATION_EVENTS.ORDER_CREATED)
  handleOrderCreated(@Payload() event: OrderCreatedEvent): Promise<void> {
    return this.appService.handleOrderCreated(event);
  }

  @EventPattern(NOTIFICATION_EVENTS.PAYMENT_SUCCEEDED)
  handlePaymentSucceeded(
    @Payload() event: PaymentSucceededEvent,
  ): Promise<void> {
    return this.appService.handlePaymentSucceeded(event);
  }

  @EventPattern(NOTIFICATION_EVENTS.PAYMENT_FAILED)
  handlePaymentFailed(@Payload() event: PaymentFailedEvent): Promise<void> {
    return this.appService.handlePaymentFailed(event);
  }

  @EventPattern(NOTIFICATION_EVENTS.ORDER_SHIPPED)
  handleOrderShipped(@Payload() event: OrderShippedEvent): Promise<void> {
    return this.appService.handleOrderShipped(event);
  }
}
