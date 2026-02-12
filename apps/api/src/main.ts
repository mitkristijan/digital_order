import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import * as express from 'express';

const CORS_ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'Accept'];
const CORS_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || [];
  if (allowed.length === 0) return true;
  if (allowed.includes(origin)) return true;
  // Vercel production and preview URLs (e.g. ...-xxx-team.vercel.app, ...-xxx-mitrovics-projects.vercel.app)
  if (origin.includes('.vercel.app')) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  return false;
}

/** Add CORS headers to response when origin is allowed. Call before sending any response. */
function addCorsHeaders(req: express.Request, res: express.Response): void {
  const origin = req.get('Origin');
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', CORS_METHODS);
    res.setHeader('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS.join(','));
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false, // CORS handled by our middleware below (ensures OPTIONS runs first for Vercel preview + Render cold start)
    bodyParser: true,
    rawBody: true,
  });

  // CORS middleware - runs first for all requests (critical for Render cold start + Vercel preview)
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === 'OPTIONS') {
      addCorsHeaders(req, res);
      return res.status(204).end();
    }
    addCorsHeaders(req, res);
    next();
  });

  // Increase body size limit for image uploads (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());

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
