import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import * as express from 'express';

function getCorsOrigin(): (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void {
  const allowed = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || [];
  const allowAllForDemo = allowed.length === 0;

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowAllForDemo) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return callback(null, true);
    callback(null, false);
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: getCorsOrigin(),
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      optionsSuccessStatus: 204,
    },
    bodyParser: true,
    rawBody: true,
  });

  // Increase body size limit for image uploads (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Digital Order API')
    .setDescription('Multi-tenant restaurant ordering platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('tenants', 'Tenant management')
    .addTag('menu', 'Menu management')
    .addTag('orders', 'Order management')
    .addTag('payments', 'Payment processing')
    .addTag('tables', 'Table management')
    .addTag('reservations', 'Reservation management')
    .addTag('inventory', 'Inventory management')
    .addTag('analytics', 'Analytics and reporting')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
