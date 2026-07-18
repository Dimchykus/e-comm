import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateOrderDto,
  OrderStatus,
  PublicOrderDto,
  UpdateOrderStatusDto,
} from '@repo/shared';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { toPublicOrder } from './utils/map';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<PublicOrderDto> {
    const order = new Order();

    order.userId = createOrderDto.userId;
    order.status = OrderStatus.PENDING;
    order.items = createOrderDto.items.map((itemDto) => {
      const item = new OrderItem();
      item.productId = itemDto.productId;
      item.name = itemDto.name;
      item.price = itemDto.price;
      item.quantity = itemDto.quantity;
      return item;
    });
    order.total = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const savedOrder = await this.orderRepository.save(order);

    return toPublicOrder(savedOrder);
  }

  async findById(orderId: string): Promise<PublicOrderDto> {
    const order = await this.orderRepository.findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return toPublicOrder(order);
  }

  async findByUser(userId: string): Promise<PublicOrderDto[]> {
    const orders = await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return orders.map(toPublicOrder);
  }

  async updateStatus(
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<PublicOrderDto> {
    const order = await this.orderRepository.findOneBy({
      id: updateOrderStatusDto.orderId,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = updateOrderStatusDto.status;

    await this.orderRepository.save(order);

    return toPublicOrder(order);
  }
}
