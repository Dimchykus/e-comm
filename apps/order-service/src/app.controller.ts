import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateOrderDto,
  FindOrderByIdPayload,
  FindOrdersByUserPayload,
  ORDERS_PATTERNS,
  PublicOrderDto,
  UpdateOrderStatusDto,
} from '@repo/shared';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern(ORDERS_PATTERNS.CREATE)
  createOrder(
    @Payload() createOrderDto: CreateOrderDto,
  ): Promise<PublicOrderDto> {
    return this.appService.create(createOrderDto);
  }

  @MessagePattern(ORDERS_PATTERNS.FIND_BY_ID)
  findOrderById(
    @Payload() { orderId }: FindOrderByIdPayload,
  ): Promise<PublicOrderDto> {
    return this.appService.findById(orderId);
  }

  @MessagePattern(ORDERS_PATTERNS.FIND_BY_USER)
  findOrdersByUser(
    @Payload() { userId }: FindOrdersByUserPayload,
  ): Promise<PublicOrderDto[]> {
    return this.appService.findByUser(userId);
  }

  @MessagePattern(ORDERS_PATTERNS.UPDATE_STATUS)
  updateOrderStatus(
    @Payload() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<PublicOrderDto> {
    return this.appService.updateStatus(updateOrderStatusDto);
  }
}
