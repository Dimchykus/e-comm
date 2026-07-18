import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateOrderDto,
  MICROSERVICES,
  ORDERS_PATTERNS,
  PublicOrderDto,
} from '@repo/shared';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { toHttpException } from '../common/rpc-error.util';
import { UpdateOrderStatusBodyDto } from './dto/update-order-status.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(MICROSERVICES.ORDER_SERVICE)
    private readonly orderClient: ClientProxy,
  ) {}

  private send<T = unknown>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.orderClient
        .send<T>(pattern, payload)
        .pipe(catchError((err) => throwError(() => toHttpException(err)))),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  @ApiResponse({ status: 201, type: PublicOrderDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  createOrder(@Body() createOrderDto: CreateOrderDto): Promise<PublicOrderDto> {
    return this.send(ORDERS_PATTERNS.CREATE, createOrderDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Get a user's order history" })
  @ApiResponse({ status: 200, type: [PublicOrderDto] })
  findOrdersByUser(@Param('userId') userId: string): Promise<PublicOrderDto[]> {
    return this.send(ORDERS_PATTERNS.FIND_BY_USER, { userId });
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get an order by id' })
  @ApiResponse({ status: 200, type: PublicOrderDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOrderById(@Param('orderId') orderId: string): Promise<PublicOrderDto> {
    return this.send(ORDERS_PATTERNS.FIND_BY_ID, { orderId });
  }

  @Patch(':orderId/status')
  @ApiOperation({ summary: 'Update the status of an order' })
  @ApiResponse({ status: 200, type: PublicOrderDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() { status }: UpdateOrderStatusBodyDto,
  ): Promise<PublicOrderDto> {
    return this.send(ORDERS_PATTERNS.UPDATE_STATUS, { orderId, status });
  }
}
