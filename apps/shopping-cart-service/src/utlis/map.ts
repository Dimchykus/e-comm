import { CartItem } from '@/entities/cart-item.entity';
import { Cart } from '@/entities/cart.entity';
import { PublicCartDto, PublicCartItemDto } from '@repo/shared';

export const toPublicCart = (cart: Cart): PublicCartDto => {
  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items?.map(toPublicCartItem) ?? [],
  };
};

export const toPublicCartItem = (cartItem: CartItem): PublicCartItemDto => {
  return {
    id: cartItem.id,
    productId: cartItem.productId,
    name: cartItem.name,
    price: cartItem.price,
    quantity: cartItem.quantity,
  };
};
