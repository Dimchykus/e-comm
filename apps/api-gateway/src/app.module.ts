import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from './constants';
import { ProductsModule } from './products/products.module';

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
    ]),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
