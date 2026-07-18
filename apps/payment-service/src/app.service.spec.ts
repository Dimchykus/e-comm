import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  MICROSERVICES,
  NOTIFICATION_EVENTS,
  PaymentStatus,
} from '@repo/shared';
import { of } from 'rxjs';
import { AppService } from './app.service';
import { Payment } from './entities/payment.entity';
import { STRIPE_CLIENT } from './stripe.provider';

describe('AppService (payment)', () => {
  let service: AppService;

  const paymentRepository = {
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };
  const notificationClient = { emit: jest.fn() };
  const orderClient = { emit: jest.fn() };
  const stripe = {
    paymentIntents: { create: jest.fn() },
    refunds: { create: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  };
  const config = {
    get: jest.fn(
      (_key: string, defaultValue?: unknown) => defaultValue as string,
    ),
  };

  const buildPayment = (status: PaymentStatus): Payment =>
    Object.assign(new Payment(), {
      id: 'payment-1',
      orderId: 'order-1',
      userId: 'user-1',
      amount: 25.5,
      status,
      stripePaymentIntentId: 'pi_1',
    });

  beforeEach(async () => {
    jest.clearAllMocks();
    notificationClient.emit.mockReturnValue(of(undefined));
    orderClient.emit.mockReturnValue(of(undefined));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepository },
        {
          provide: MICROSERVICES.NOTIFICATION_SERVICE,
          useValue: notificationClient,
        },
        { provide: MICROSERVICES.ORDER_SERVICE, useValue: orderClient },
        { provide: STRIPE_CLIENT, useValue: stripe },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('charge', () => {
    it('creates a Stripe payment intent in cents and saves a pending payment', async () => {
      stripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_1',
        client_secret: 'pi_1_secret',
      });
      paymentRepository.save.mockImplementation((payment: Payment) =>
        Promise.resolve(Object.assign(payment, { id: 'payment-1' })),
      );

      const result = await service.charge({
        orderId: 'order-1',
        userId: 'user-1',
        amount: 25.5,
      });

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2550,
          currency: 'usd',
          metadata: { orderId: 'order-1', userId: 'user-1' },
        }),
      );
      expect(result).toMatchObject({
        id: 'payment-1',
        status: PaymentStatus.PENDING,
        clientSecret: 'pi_1_secret',
      });
    });
  });

  describe('refund', () => {
    it('refunds a succeeded payment through Stripe', async () => {
      paymentRepository.findOneBy.mockResolvedValue(
        buildPayment(PaymentStatus.SUCCEEDED),
      );
      stripe.refunds.create.mockResolvedValue({ id: 're_1' });
      paymentRepository.save.mockImplementation((payment: Payment) =>
        Promise.resolve(payment),
      );

      const result = await service.refund('payment-1');

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_1',
      });
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });

    it('throws NotFoundException when the payment does not exist', async () => {
      paymentRepository.findOneBy.mockResolvedValue(null);

      await expect(service.refund('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects refunding a payment that has not succeeded', async () => {
      paymentRepository.findOneBy.mockResolvedValue(
        buildPayment(PaymentStatus.PENDING),
      );

      await expect(service.refund('payment-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(stripe.refunds.create).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it("returns the user's payments, newest first", async () => {
      paymentRepository.find.mockResolvedValue([
        buildPayment(PaymentStatus.SUCCEEDED),
      ]);

      const result = await service.getHistory('user-1');

      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'payment-1', amount: 25.5 });
    });
  });

  describe('handleWebhook', () => {
    const webhookPayload = { body: 'raw-body', signature: 'sig' };

    it('rejects an invalid webhook signature', async () => {
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('bad signature');
      });

      await expect(
        service.handleWebhook(webhookPayload),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marks the payment succeeded and notifies both services', async () => {
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_1' } },
      });
      paymentRepository.findOneBy.mockResolvedValue(
        buildPayment(PaymentStatus.PENDING),
      );
      paymentRepository.save.mockImplementation((payment: Payment) =>
        Promise.resolve(payment),
      );

      const result = await service.handleWebhook(webhookPayload);

      expect(result).toEqual({ received: true });
      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.SUCCEEDED }),
      );
      const expectedEvent = {
        paymentId: 'payment-1',
        orderId: 'order-1',
        userId: 'user-1',
        amount: 25.5,
      };
      expect(notificationClient.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.PAYMENT_SUCCEEDED,
        expectedEvent,
      );
      expect(orderClient.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.PAYMENT_SUCCEEDED,
        expectedEvent,
      );
    });

    it('marks the payment failed on payment_intent.payment_failed', async () => {
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_1' } },
      });
      paymentRepository.findOneBy.mockResolvedValue(
        buildPayment(PaymentStatus.PENDING),
      );
      paymentRepository.save.mockImplementation((payment: Payment) =>
        Promise.resolve(payment),
      );

      await service.handleWebhook(webhookPayload);

      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.FAILED }),
      );
      expect(notificationClient.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.PAYMENT_FAILED,
        expect.objectContaining({ paymentId: 'payment-1' }),
      );
    });

    it('acknowledges but ignores unrelated event types', async () => {
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'charge.updated',
        data: { object: { id: 'ch_1' } },
      });

      const result = await service.handleWebhook(webhookPayload);

      expect(result).toEqual({ received: true });
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });
  });
});
