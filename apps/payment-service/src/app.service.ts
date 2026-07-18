import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import {
  ChargePaymentDto,
  ChargePaymentResponseDto,
  MICROSERVICES,
  NOTIFICATION_EVENTS,
  PaymentStatus,
  PublicPaymentDto,
  StripeWebhookPayload,
} from '@repo/shared';
import { Payment } from './entities/payment.entity';
import { STRIPE_CLIENT } from './stripe.provider';
import { toPublicPayment } from './utils/map';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject(MICROSERVICES.NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @Inject(MICROSERVICES.ORDER_SERVICE)
    private readonly orderClient: ClientProxy,
    @Inject(STRIPE_CLIENT)
    private readonly stripe: Stripe,
    private readonly config: ConfigService,
  ) {}

  // TCP has no pub/sub, so each interested service gets its own emit
  private emitEvent(event: string, payload: unknown): void {
    for (const client of [this.notificationClient, this.orderClient]) {
      client.emit(event, payload).subscribe({
        error: (err) => this.logger.error(`Failed to emit ${event}`, err),
      });
    }
  }

  async charge(
    chargePaymentDto: ChargePaymentDto,
  ): Promise<ChargePaymentResponseDto> {
    // Stripe amounts are in the smallest currency unit (cents)
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(chargePaymentDto.amount * 100),
      currency: this.config.get('STRIPE_CURRENCY', 'usd'),
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: chargePaymentDto.orderId,
        userId: chargePaymentDto.userId,
      },
    });

    const payment = new Payment();

    payment.orderId = chargePaymentDto.orderId;
    payment.userId = chargePaymentDto.userId;
    payment.amount = chargePaymentDto.amount;
    payment.status = PaymentStatus.PENDING;
    payment.stripePaymentIntentId = paymentIntent.id;

    const savedPayment = await this.paymentRepository.save(payment);

    return {
      ...toPublicPayment(savedPayment),
      clientSecret: paymentIntent.client_secret,
    };
  }

  async refund(paymentId: string): Promise<PublicPaymentDto> {
    const payment = await this.paymentRepository.findOneBy({ id: paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    if (!payment.stripePaymentIntentId) {
      throw new BadRequestException('Payment has no Stripe payment intent');
    }

    await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
    });

    payment.status = PaymentStatus.REFUNDED;

    await this.paymentRepository.save(payment);

    return toPublicPayment(payment);
  }

  async getHistory(userId: string): Promise<PublicPaymentDto[]> {
    const payments = await this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return payments.map(toPublicPayment);
  }

  async handleWebhook(
    webhookPayload: StripeWebhookPayload,
  ): Promise<{ received: boolean }> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        webhookPayload.body,
        webhookPayload.signature,
        this.config.get('STRIPE_WEBHOOK_SECRET', ''),
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.settlePayment(
          event.data.object,
          PaymentStatus.SUCCEEDED,
          NOTIFICATION_EVENTS.PAYMENT_SUCCEEDED,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.settlePayment(
          event.data.object,
          PaymentStatus.FAILED,
          NOTIFICATION_EVENTS.PAYMENT_FAILED,
        );
        break;
      default:
        this.logger.log(`Ignoring Stripe event ${event.type}`);
    }

    return { received: true };
  }

  private async settlePayment(
    paymentIntent: Stripe.PaymentIntent,
    status: PaymentStatus,
    notificationEvent: string,
  ): Promise<void> {
    const payment = await this.paymentRepository.findOneBy({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      this.logger.warn(
        `No payment found for Stripe payment intent ${paymentIntent.id}`,
      );
      return;
    }

    payment.status = status;

    await this.paymentRepository.save(payment);

    this.emitEvent(notificationEvent, {
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
    });
  }
}
