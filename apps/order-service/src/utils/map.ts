import { OrderItem } from '@/entities/order-item.entity';
import { Order } from '@/entities/order.entity';
import { PublicOrderDto, PublicOrderItemDto } from '@repo/shared';

export const toPublicOrder = (order: Order): PublicOrderDto => {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    items: order.items?.map(toPublicOrderItem) ?? [],
    createdAt: order.createdAt,
  };
};

export const toPublicOrderItem = (item: OrderItem): PublicOrderItemDto => {
  return {
    id: item.id,
    productId: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  };
};
