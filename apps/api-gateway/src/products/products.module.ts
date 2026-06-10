import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from '@repo/shared';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES.PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 4002,
        },
      },
    ]),
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
