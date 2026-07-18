import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ChargePaymentDto,
  ChargePaymentResponseDto,
  GetPaymentHistoryPayload,
  PAYMENTS_PATTERNS,
  PublicPaymentDto,
  RefundPaymentPayload,
  StripeWebhookPayload,
} from '@repo/shared';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern(PAYMENTS_PATTERNS.CHARGE)
  chargePayment(
    @Payload() chargePaymentDto: ChargePaymentDto,
  ): Promise<ChargePaymentResponseDto> {
    return this.appService.charge(chargePaymentDto);
  }

  @MessagePattern(PAYMENTS_PATTERNS.WEBHOOK)
  handleWebhook(
    @Payload() webhookPayload: StripeWebhookPayload,
  ): Promise<{ received: boolean }> {
    return this.appService.handleWebhook(webhookPayload);
  }

  @MessagePattern(PAYMENTS_PATTERNS.REFUND)
  refundPayment(
    @Payload() { paymentId }: RefundPaymentPayload,
  ): Promise<PublicPaymentDto> {
    return this.appService.refund(paymentId);
  }

  @MessagePattern(PAYMENTS_PATTERNS.GET_HISTORY)
  getPaymentHistory(
    @Payload() { userId }: GetPaymentHistoryPayload,
  ): Promise<PublicPaymentDto[]> {
    return this.appService.getHistory(userId);
  }
}
