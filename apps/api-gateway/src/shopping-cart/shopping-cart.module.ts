import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from '@repo/shared';
import { ShoppingCartController } from './shopping-cart.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES.SHOPPING_CART_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 4003,
        },
      },
    ]),
  ],
  controllers: [ShoppingCartController],
})
export class ShoppingCartModule {}
