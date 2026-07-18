import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MICROSERVICES } from '@repo/shared';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: MICROSERVICES.PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 4002,
        },
      },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME', 'postgres'),
        entities: [Cart, CartItem],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: false,
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Cart, CartItem]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
