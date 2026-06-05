import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from './constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES.USERS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 4001,
        },
      },
      {
        name: MICROSERVICES.PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 4002,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
