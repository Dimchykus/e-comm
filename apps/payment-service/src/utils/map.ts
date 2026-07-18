import { Payment } from '@/entities/payment.entity';
import { PublicPaymentDto } from '@repo/shared';

export const toPublicPayment = (payment: Payment): PublicPaymentDto => {
  return {
    id: payment.id,
    orderId: payment.orderId,
    userId: payment.userId,
    amount: payment.amount,
    status: payment.status,
    createdAt: payment.createdAt,
  };
};
