import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { TableModule } from './table/table.module';
import { ReservationModule } from './reservation/reservation.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebsocketModule } from './websocket/websocket.module';
import { StorageModule } from './storage/storage.module';
import { NotificationModule } from './notification/notification.module';
import { RedisModule } from './redis/redis.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { BrandingModule } from './branding/branding.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantGuard } from './common/guards/tenant.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: process.env.REDIS_URL
        ? process.env.REDIS_URL
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
          },
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    TenantModule,
    MenuModule,
    OrderModule,
    PaymentModule,
    TableModule,
    ReservationModule,
    InventoryModule,
    AnalyticsModule,
    WebsocketModule,
    StorageModule,
    NotificationModule,
    RecommendationModule,
    BrandingModule,
  ],
  providers: [TenantGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
