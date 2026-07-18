import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChargePaymentDto,
  MICROSERVICES,
  NOTIFICATION_EVENTS,
  PaymentStatus,
  PublicPaymentDto,
} from '@repo/shared';
import { Payment } from './entities/payment.entity';
import { toPublicPayment } from './utils/map';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject(MICROSERVICES.NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
  ) {}

  private emitEvent(event: string, payload: unknown): void {
    this.notificationClient.emit(event, payload).subscribe({
      error: (err) => this.logger.error(`Failed to emit ${event}`, err),
    });
  }

  async charge(chargePaymentDto: ChargePaymentDto): Promise<PublicPaymentDto> {
    const payment = new Payment();

    payment.orderId = chargePaymentDto.orderId;
    payment.userId = chargePaymentDto.userId;
    payment.amount = chargePaymentDto.amount;
    // Stripe Payment Intents integration pending; charges succeed immediately
    payment.status = PaymentStatus.SUCCEEDED;
    payment.stripePaymentIntentId = null;

    const savedPayment = await this.paymentRepository.save(payment);

    this.emitEvent(NOTIFICATION_EVENTS.PAYMENT_SUCCEEDED, {
      paymentId: savedPayment.id,
      orderId: savedPayment.orderId,
      userId: savedPayment.userId,
      amount: savedPayment.amount,
    });

    return toPublicPayment(savedPayment);
  }

  async refund(paymentId: string): Promise<PublicPaymentDto> {
    const payment = await this.paymentRepository.findOneBy({ id: paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

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
}
