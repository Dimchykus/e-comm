import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: 4002,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new RpcException({
          statusCode: 400,
          message: errors.flatMap((error) =>
            Object.values(error.constraints ?? {}),
          ),
          error: 'Bad Request',
        }),
    }),
  );

  await app.listen();

  console.log('Products service is running on port 4002');
}

bootstrap();
