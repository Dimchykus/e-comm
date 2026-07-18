import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateOrderDto,
  MICROSERVICES,
  NOTIFICATION_EVENTS,
  OrderStatus,
  PaymentSucceededEvent,
  PRODUCTS_PATTERNS,
  PublicCartDto,
  PublicOrderDto,
  SHOPPING_CART_PATTERNS,
  UpdateOrderStatusDto,
} from '@repo/shared';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { toPublicOrder } from './utils/map';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(MICROSERVICES.NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @Inject(MICROSERVICES.SHOPPING_CART_SERVICE)
    private readonly cartClient: ClientProxy,
    @Inject(MICROSERVICES.PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy,
  ) {}

  private emitEvent(event: string, payload: unknown): void {
    this.notificationClient.emit(event, payload).subscribe({
      error: (err) => this.logger.error(`Failed to emit ${event}`, err),
    });
  }

  private sendToCart<T>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.cartClient
        .send<T>(pattern, payload)
        .pipe(
          catchError(() =>
            throwError(
              () => new BadRequestException('Failed to load the user cart'),
            ),
          ),
        ),
    );
  }

  async create(createOrderDto: CreateOrderDto): Promise<PublicOrderDto> {
    const { userId } = createOrderDto;

    const cart = await this.sendToCart<PublicCartDto>(
      SHOPPING_CART_PATTERNS.GET,
      { userId },
    );

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const order = new Order();

    order.userId = userId;
    order.status = OrderStatus.PENDING;
    order.items = cart.items.map((cartItem) => {
      const item = new OrderItem();
      item.productId = cartItem.productId;
      item.name = cartItem.name;
      item.price = cartItem.price;
      item.quantity = cartItem.quantity;
      return item;
    });
    order.total = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const savedOrder = await this.orderRepository.save(order);

    await this.sendToCart(SHOPPING_CART_PATTERNS.CLEAR, { userId });

    this.emitEvent(NOTIFICATION_EVENTS.ORDER_CREATED, {
      orderId: savedOrder.id,
      userId: savedOrder.userId,
      total: savedOrder.total,
    });

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

    if (order.status === OrderStatus.SHIPPED) {
      this.emitEvent(NOTIFICATION_EVENTS.ORDER_SHIPPED, {
        orderId: order.id,
        userId: order.userId,
      });
    }

    return toPublicOrder(order);
  }

  async cancel(orderId: string): Promise<PublicOrderDto> {
    const order = await this.orderRepository.findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Order in status "${order.status}" cannot be cancelled`,
      );
    }

    order.status = OrderStatus.CANCELLED;

    await this.orderRepository.save(order);

    return toPublicOrder(order);
  }

  async handlePaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
    const order = await this.orderRepository.findOneBy({ id: event.orderId });

    if (!order) {
      this.logger.warn(`No order found for payment ${event.paymentId}`);
      return;
    }

    order.status = OrderStatus.PAID;

    await this.orderRepository.save(order);

    for (const item of order.items) {
      this.productsClient
        .send(PRODUCTS_PATTERNS.UPDATE_STOCK, {
          id: item.productId,
          data: { delta: -item.quantity },
        })
        .subscribe({
          error: (err) =>
            this.logger.error(
              `Failed to decrement stock for product ${item.productId}`,
              err,
            ),
        });
    }
  }
}
