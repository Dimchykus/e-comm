import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ChargePaymentDto,
  ChargePaymentResponseDto,
  MICROSERVICES,
  PAYMENTS_PATTERNS,
  PublicPaymentDto,
} from '@repo/shared';
import type { Request } from 'express';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { toHttpException } from '../common/rpc-error.util';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(MICROSERVICES.PAYMENT_SERVICE)
    private readonly paymentClient: ClientProxy,
  ) {}

  private send<T = unknown>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.paymentClient
        .send<T>(pattern, payload)
        .pipe(catchError((err) => throwError(() => toHttpException(err)))),
    );
  }

  @Post('charge')
  @ApiOperation({ summary: 'Create a Stripe payment intent for an order' })
  @ApiResponse({ status: 201, type: ChargePaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  chargePayment(
    @Body() chargePaymentDto: ChargePaymentDto,
  ): Promise<ChargePaymentResponseDto> {
    return this.send(PAYMENTS_PATTERNS.CHARGE, chargePaymentDto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    return this.send(PAYMENTS_PATTERNS.WEBHOOK, {
      body: req.rawBody?.toString('utf8') ?? '',
      signature: signature ?? '',
    });
  }

  @Post(':paymentId/refund')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 200, type: PublicPaymentDto })
  @ApiResponse({ status: 400, description: 'Payment cannot be refunded' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  refundPayment(
    @Param('paymentId') paymentId: string,
  ): Promise<PublicPaymentDto> {
    return this.send(PAYMENTS_PATTERNS.REFUND, { paymentId });
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Get a user's payment history" })
  @ApiResponse({ status: 200, type: [PublicPaymentDto] })
  getPaymentHistory(
    @Param('userId') userId: string,
  ): Promise<PublicPaymentDto[]> {
    return this.send(PAYMENTS_PATTERNS.GET_HISTORY, { userId });
  }
}
