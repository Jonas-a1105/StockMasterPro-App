import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from '@shared/infrastructure/http/filters/domain-exception.filter';
import { validateRequiredEnvVars } from '@shared/infrastructure/config/env.validation';

async function bootstrap() {
  validateRequiredEnvVars();
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api');

  const frontendUrl = process.env.FRONTEND_URL!;
  const isProduction = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProduction
      ? frontendUrl // En producción solo el dominio explícito
      : [frontendUrl, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  app.useGlobalFilters(new DomainExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`StockMaster PRO API running on port ${port}`);
}
void bootstrap();
