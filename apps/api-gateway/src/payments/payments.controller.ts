import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChargePaymentDto,
  MICROSERVICES,
  PAYMENTS_PATTERNS,
  PublicPaymentDto,
} from '@repo/shared';
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
  @ApiOperation({ summary: 'Charge a payment for an order' })
  @ApiResponse({ status: 201, type: PublicPaymentDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  chargePayment(
    @Body() chargePaymentDto: ChargePaymentDto,
  ): Promise<PublicPaymentDto> {
    return this.send(PAYMENTS_PATTERNS.CHARGE, chargePaymentDto);
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
