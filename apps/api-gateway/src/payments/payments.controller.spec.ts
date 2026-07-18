import { HttpException, RawBodyRequest } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MICROSERVICES, PAYMENTS_PATTERNS, PaymentStatus } from '@repo/shared';
import type { Request } from 'express';
import { of, throwError } from 'rxjs';
import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const paymentClient = { send: jest.fn() };

  const payment = {
    id: 'payment-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: 25.5,
    status: PaymentStatus.PENDING,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: MICROSERVICES.PAYMENT_SERVICE, useValue: paymentClient },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('chargePayment forwards the dto', async () => {
    const chargeDto = { orderId: 'order-1', userId: 'user-1', amount: 25.5 };
    paymentClient.send.mockReturnValue(
      of({ ...payment, clientSecret: 'secret' }),
    );

    const result = await controller.chargePayment(chargeDto);

    expect(result.clientSecret).toBe('secret');
    expect(paymentClient.send).toHaveBeenCalledWith(
      PAYMENTS_PATTERNS.CHARGE,
      chargeDto,
    );
  });

  it('handleStripeWebhook forwards the raw body and signature', async () => {
    paymentClient.send.mockReturnValue(of({ received: true }));
    const req = {
      rawBody: Buffer.from('raw-payload'),
    } as RawBodyRequest<Request>;

    const result = await controller.handleStripeWebhook(req, 'sig-header');

    expect(result).toEqual({ received: true });
    expect(paymentClient.send).toHaveBeenCalledWith(PAYMENTS_PATTERNS.WEBHOOK, {
      body: 'raw-payload',
      signature: 'sig-header',
    });
  });

  it('handleStripeWebhook defaults missing raw body and signature to empty strings', async () => {
    paymentClient.send.mockReturnValue(of({ received: true }));
    const req = {} as RawBodyRequest<Request>;

    await controller.handleStripeWebhook(req, undefined as unknown as string);

    expect(paymentClient.send).toHaveBeenCalledWith(PAYMENTS_PATTERNS.WEBHOOK, {
      body: '',
      signature: '',
    });
  });

  it('refundPayment sends the payment id', async () => {
    paymentClient.send.mockReturnValue(
      of({ ...payment, status: PaymentStatus.REFUNDED }),
    );

    await controller.refundPayment('payment-1');

    expect(paymentClient.send).toHaveBeenCalledWith(PAYMENTS_PATTERNS.REFUND, {
      paymentId: 'payment-1',
    });
  });

  it('getPaymentHistory sends the user id', async () => {
    paymentClient.send.mockReturnValue(of([payment]));

    await expect(controller.getPaymentHistory('user-1')).resolves.toEqual([
      payment,
    ]);
    expect(paymentClient.send).toHaveBeenCalledWith(
      PAYMENTS_PATTERNS.GET_HISTORY,
      { userId: 'user-1' },
    );
  });

  it('maps RPC errors to HttpExceptions with the original status', async () => {
    paymentClient.send.mockReturnValue(
      throwError(() => ({ statusCode: 400, message: 'Cannot refund' })),
    );

    const promise = controller.refundPayment('payment-1');

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await promise.catch((err: HttpException) => {
      expect(err.getStatus()).toBe(400);
    });
  });
});
