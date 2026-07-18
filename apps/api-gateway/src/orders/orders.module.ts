import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from '@repo/shared';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES.ORDER_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 4004,
        },
      },
    ]),
  ],
  controllers: [OrdersController],
})
export class OrdersModule {}
