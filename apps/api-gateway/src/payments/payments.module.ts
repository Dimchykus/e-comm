import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from '@repo/shared';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES.PAYMENT_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 4005,
        },
      },
    ]),
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
