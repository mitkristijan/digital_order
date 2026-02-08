# Monitoring Setup

## Application Monitoring

### Sentry Integration

```bash
# Install Sentry
npm install --save @sentry/node @sentry/nestjs @sentry/nextjs
```

#### Backend (NestJS)

```typescript
// apps/api/src/main.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Frontend (Next.js)

```javascript
// apps/customer-app/sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## Health Checks

### API Health Endpoint

```typescript
// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.pingCheck('database'),
    ]);
  }
}
```

## Metrics Dashboard

### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - '3000:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Logging

### Structured Logging

```typescript
// apps/api/src/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }

  error(message: string, trace?: string, context?: string) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      trace,
      context,
      timestamp: new Date().toISOString(),
    }));
  }

  warn(message: string, context?: string) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

## Performance Monitoring

### Key Metrics

1. **API Response Times**
   - p50, p95, p99 latencies
   - Endpoint-specific metrics

2. **Database Performance**
   - Query execution times
   - Connection pool usage
   - Slow query log

3. **Cache Hit Rates**
   - Redis cache effectiveness
   - Menu data cache performance

4. **WebSocket Connections**
   - Active connections
   - Message throughput
   - Connection errors

### Custom Metrics

```typescript
// apps/api/src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private orderProcessingTimes: number[] = [];

  recordOrderProcessing(duration: number) {
    this.orderProcessingTimes.push(duration);
  }

  getAverageOrderProcessingTime() {
    return this.orderProcessingTimes.reduce((a, b) => a + b, 0) / this.orderProcessingTimes.length;
  }
}
```
