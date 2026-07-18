import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChargePaymentDto,
  PaymentStatus,
  PublicPaymentDto,
} from '@repo/shared';
import { Payment } from './entities/payment.entity';
import { toPublicPayment } from './utils/map';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async charge(chargePaymentDto: ChargePaymentDto): Promise<PublicPaymentDto> {
    const payment = new Payment();

    payment.orderId = chargePaymentDto.orderId;
    payment.userId = chargePaymentDto.userId;
    payment.amount = chargePaymentDto.amount;
    // Stripe Payment Intents integration pending; charges succeed immediately
    payment.status = PaymentStatus.SUCCEEDED;
    payment.stripePaymentIntentId = null;

    const savedPayment = await this.paymentRepository.save(payment);

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
