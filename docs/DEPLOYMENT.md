# Production Deployment Guide

## Infrastructure Requirements

### Required Services

- **Application Server**: AWS ECS/Fargate, DigitalOcean App Platform, or similar
- **Database**: AWS RDS PostgreSQL 15+ (Multi-AZ for high availability)
- **Cache**: AWS ElastiCache Redis (Cluster mode)
- **Storage**: AWS S3 + CloudFront CDN
- **Load Balancer**: AWS ALB with SSL/TLS termination

### Frontend Hosting

- **Customer App**: Vercel or AWS Amplify (Port 3001 → https://order.yourdomain.com)
- **Admin App**: Vercel or AWS Amplify (Port 3002 → https://admin.yourdomain.com)
- **Kitchen App**: Vercel or AWS Amplify (Port 3003 → https://kitchen.yourdomain.com)

### Backend Hosting

- **API**: AWS ECS Fargate or DigitalOcean App Platform (Port 3000 → https://api.yourdomain.com)

## Environment Variables

### Production API (.env.production)

```env
# Database
DATABASE_URL="postgresql://user:password@prod-db.rds.amazonaws.com:5432/digital_order"
REDIS_URL="redis://prod-redis.cache.amazonaws.com:6379"

# JWT
JWT_SECRET="<generate-secure-random-secret>"
JWT_REFRESH_SECRET="<generate-secure-random-secret>"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# AWS S3
AWS_S3_ENDPOINT=""  # Leave empty for AWS S3
AWS_S3_ACCESS_KEY="<your-access-key>"
AWS_S3_SECRET_KEY="<your-secret-key>"
AWS_S3_BUCKET="digital-order-prod"
AWS_S3_REGION="us-east-1"

# Paddle
PADDLE_API_KEY="<your-paddle-api-key>"
PADDLE_ENVIRONMENT="production"
PADDLE_WEBHOOK_SECRET="<your-webhook-secret>"
PADDLE_CLIENT_TOKEN="<your-client-token>"

# Email
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="<your-smtp-user>"
SMTP_PASSWORD="<your-smtp-password>"
EMAIL_FROM="noreply@yourdomain.com"

# SMS
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="<your-account-sid>"
TWILIO_AUTH_TOKEN="<your-auth-token>"
TWILIO_PHONE_NUMBER="<your-phone-number>"

# App
NODE_ENV="production"
PORT="3000"
API_URL="https://api.yourdomain.com"
FRONTEND_URL="https://order.yourdomain.com"
ADMIN_URL="https://admin.yourdomain.com"

# Security
BCRYPT_ROUNDS="12"
CORS_ORIGIN="https://order.yourdomain.com,https://admin.yourdomain.com,https://kitchen.yourdomain.com"

# Rate Limiting
RATE_LIMIT_TTL="60"
RATE_LIMIT_MAX="100"
```

## Deployment Steps

### 1. Database Setup

```bash
# Run migrations
cd apps/api
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 2. Build Applications

```bash
# Build all packages
npm run build --workspace=@digital-order/types
npm run build --workspace=@digital-order/utils
npm run build --workspace=@digital-order/config
npm run build --workspace=@digital-order/ui

# Build API
npm run build --workspace=@digital-order/api

# Build Next.js apps
npm run build --workspace=@digital-order/customer-app
npm run build --workspace=@digital-order/admin-app
npm run build --workspace=@digital-order/kitchen-app
```

### 3. Deploy Backend (AWS ECS Example)

```bash
# Build and push Docker image
docker build -t digital-order-api:latest -f apps/api/Dockerfile .
docker tag digital-order-api:latest <your-ecr-repo>/digital-order-api:latest
docker push <your-ecr-repo>/digital-order-api:latest

# Update ECS service
aws ecs update-service --cluster digital-order --service api --force-new-deployment
```

### 4. Deploy Frontend (Vercel Example)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy customer app
cd apps/customer-app
vercel --prod

# Deploy admin app
cd ../admin-app
vercel --prod

# Deploy kitchen app
cd ../kitchen-app
vercel --prod
```

## Monitoring & Logging

### Application Monitoring

- **APM**: DataDog, New Relic, or Sentry
- **Logs**: CloudWatch Logs, Papertrail, or LogDNA
- **Uptime**: Pingdom or UptimeRobot

### Metrics to Track

- API response times (p50, p95, p99)
- Error rates per endpoint
- Database query performance
- Cache hit rates
- WebSocket connection count
- Order processing times

### Alerts

- API downtime > 1 minute
- Error rate > 5%
- Database connections > 80% of pool
- High memory/CPU usage
- Payment gateway failures

## Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups (automated)
- [ ] Rotate JWT secrets regularly
- [ ] Use secrets manager (AWS Secrets Manager, etc.)
- [ ] Enable database encryption at rest
- [ ] Configure WAF rules
- [ ] Set up DDoS protection
- [ ] Implement audit logging

## Backup & Disaster Recovery

### Database Backups

- Automated daily backups (AWS RDS automated backups)
- Retention: 30 days
- Cross-region replication for critical data

### Restore Procedure

```bash
# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier restored-instance \
  --db-snapshot-identifier <snapshot-id>
```

## Scaling

### Horizontal Scaling

- API: Auto-scale based on CPU/memory (AWS ECS auto-scaling)
- Frontend: Vercel handles this automatically
- Database: Read replicas for heavy read operations

### Vertical Scaling

- Increase instance sizes during peak hours
- Database connection pooling (already configured)

## Cost Optimization

- Use CDN for static assets (CloudFront)
- Enable database query caching (Redis)
- Implement API response caching
- Use spot instances for non-critical workloads
- Monitor and optimize slow database queries

## Support & Maintenance

- Regular dependency updates
- Security patch deployment
- Performance monitoring and optimization
- Regular database maintenance (VACUUM, ANALYZE)
