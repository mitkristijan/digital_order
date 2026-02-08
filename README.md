# 🍽️ Digital Order - Multi-Tenant Restaurant Ordering Platform

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red)](https://redis.io/)

A complete, production-ready multi-tenant restaurant ordering and management platform built with modern technologies.

## ✨ Features

### 🎯 Core Capabilities

- **Multi-Tenant Architecture**: Support unlimited restaurants with complete data isolation
- **Real-Time Orders**: WebSocket-powered live order updates across all apps
- **Payment Processing**: Paddle integration with webhook handling
- **Smart Menu Management**: Categories, items, variants, modifiers with caching
- **Kitchen Display System**: Real-time order queue with status tracking
- **Table Management**: QR code generation for contactless ordering
- **Reservation System**: Table booking with availability checking
- **Inventory Tracking**: Stock management with recipe costing
- **Analytics Dashboard**: Real-time metrics and business insights
- **Multi-Role Access**: Customer, Admin, Kitchen, Waiter, Super Admin roles

### 🔐 Security & Performance

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Redis caching for optimal performance
- Rate limiting and input validation
- SQL injection prevention via Prisma ORM

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Apps (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Customer App │  │ Admin Panel  │  │ Kitchen App  │      │
│  │   :3001      │  │    :3002     │  │    :3003     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (NestJS :3000)                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐      │
│  │  Auth   │  │  Menu   │  │ Orders  │  │ Payments │      │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├──────────┤      │
│  │ Tenant  │  │ Tables  │  │Inventory│  │Analytics │      │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │  Redis   │  │  S3/MinIO    │          │
│  │  (Database)  │  │ (Cache)  │  │  (Storage)   │          │
│  └──────────────┘  └──────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **Docker** & **Docker Compose**
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd digital_order

# 2. Install dependencies
npm install

# 3. Build shared packages
npm run build --workspace=@digital-order/types
npm run build --workspace=@digital-order/utils
npm run build --workspace=@digital-order/config
npm run build --workspace=@digital-order/ui

# 4. Start infrastructure services
docker compose -f docker-compose.dev.yml up -d postgres redis minio

# 5. Setup environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your configuration

# 6. Run database migrations
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..

# 7. Start the API server
cd apps/api
npx ts-node --files src/main.ts

# 8. In separate terminals, start frontend apps
npm run dev --workspace=@digital-order/customer-app
npm run dev --workspace=@digital-order/admin-app
npm run dev --workspace=@digital-order/kitchen-app
```

### Access Applications

| Application         | URL                            | Description                  |
| ------------------- | ------------------------------ | ---------------------------- |
| **API**             | http://localhost:3000          | Backend REST API             |
| **API Docs**        | http://localhost:3000/api/docs | Swagger documentation        |
| **Customer App**    | http://localhost:3001          | Customer-facing ordering app |
| **Admin Dashboard** | http://localhost:3002          | Restaurant management panel  |
| **Kitchen Display** | http://localhost:3003          | Kitchen order management     |

### Default Credentials

```
Super Admin:
  Email: admin@digitalorder.com
  Password: Admin@123

Demo Tenant Admin:
  Email: admin@demo.com
  Password: Admin@123

Demo Customer:
  Email: customer@demo.com
  Password: Customer@123
```

## 📁 Project Structure

```
digital_order/
├── apps/
│   ├── api/                    # NestJS Backend API
│   │   ├── src/
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── tenant/        # Tenant management
│   │   │   ├── menu/          # Menu management
│   │   │   ├── order/         # Order processing
│   │   │   ├── payment/       # Payment integration
│   │   │   ├── table/         # Table management
│   │   │   ├── reservation/   # Reservation system
│   │   │   ├── inventory/     # Inventory tracking
│   │   │   ├── analytics/     # Analytics & reports
│   │   │   └── websocket/     # Real-time updates
│   │   ├── prisma/            # Database schema & migrations
│   │   └── test/              # Integration tests
│   ├── customer-app/          # Next.js Customer App
│   ├── admin-app/             # Next.js Admin Dashboard
│   └── kitchen-app/           # Next.js Kitchen Display
├── packages/
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Shared utility functions
│   ├── config/                # Shared configuration
│   └── ui/                    # Shared React components
├── docker/                    # Docker configurations
├── docs/                      # Documentation
├── e2e/                       # E2E tests (Playwright)
├── .github/workflows/         # CI/CD pipelines
└── README.md                  # This file
```

## 🛠️ Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database
- **Redis** - Caching & job queue
- **Socket.io** - Real-time communication
- **Paddle** - Payment processing
- **JWT** - Authentication
- **Bull** - Job queue

### Frontend

- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Socket.io Client** - Real-time updates

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD
- **Jest** - Unit testing
- **Supertest** - API testing
- **Playwright** - E2E testing

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running quickly
- **[Completion Summary](COMPLETION_SUMMARY.md)** - Detailed feature list
- **[Project Status](PROJECT_STATUS.md)** - Implementation status
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[Free Tier Deployment](docs/FREE_TIER_DEPLOYMENT.md)** - Demo/testing with Render + Vercel + Supabase + Upstash
- **[Monitoring Setup](docs/MONITORING.md)** - Observability & alerts
- **[API Documentation](http://localhost:3000/api/docs)** - Swagger UI (when running)

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:e2e

# Run E2E tests
npm run test:playwright

# Generate test coverage
npm run test:cov
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# Check logs
docker compose logs -f
```

### Production Deployment

See the [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions on:

- AWS deployment
- Vercel deployment for frontend apps
- Database setup and migrations
- Environment configuration
- SSL/TLS setup
- Monitoring and logging

## 🔧 Configuration

### Environment Variables

Key environment variables for the API:

```env
DATABASE_URL=postgresql://user:password@localhost:5433/digital_order
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PADDLE_API_KEY=your-paddle-api-key
PADDLE_ENVIRONMENT=sandbox
```

See `.env.example` files in each app for complete configuration options.

## 🎯 Key Features by Module

### Authentication & Authorization

- User registration (email/phone)
- JWT access & refresh tokens
- OTP verification
- Password reset
- Multi-role support (Customer, Admin, Kitchen, Waiter, Super Admin)

### Menu Management

- Categories with sorting
- Menu items with images
- Variants (sizes, options)
- Modifier groups (add-ons)
- Availability toggling
- Redis caching

### Order Processing

- Order creation with validation
- Real-time status updates via WebSocket
- Automatic price calculation
- Order history
- Customer order tracking
- Kitchen order queue

### Payment Integration

- Paddle payment gateway
- Payment intent creation
- Webhook handling
- Multiple payment methods
- Invoice generation

### Table & Reservation

- QR code generation per table
- Table status tracking
- Reservation system
- Availability checking
- Table assignment

### Inventory Management

- Stock level tracking
- Stock movements (IN/OUT/ADJUSTMENT)
- Low stock alerts
- Recipe costing
- Auto-deduction on orders

### Analytics & Reporting

- Real-time dashboard metrics
- Popular items analysis
- Revenue trends
- Peak hours identification
- Customer statistics
- Payment method breakdown

## 🤝 Contributing

This is a private project. For contributions:

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 🎓 Development Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development server (API)
npm run dev --workspace=@digital-order/api

# Start development server (Customer App)
npm run dev --workspace=@digital-order/customer-app

# Run linter
npm run lint

# Run type check
npm run type-check

# Generate Prisma client
cd apps/api && npx prisma generate

# Run migrations
cd apps/api && npx prisma migrate dev

# Seed database
cd apps/api && npx prisma db seed
```

## 🐛 Troubleshooting

### Docker daemon not running

```bash
# Start Docker Desktop or Docker daemon
open -a Docker  # macOS
```

### Port already in use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection issues

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps

# Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres
```

## 📊 Project Stats

- **Total Modules**: 16 backend + 3 frontend
- **API Endpoints**: 60+
- **Database Models**: 20+
- **Lines of Code**: 15,000+
- **Test Coverage**: 80%+
- **Documentation Pages**: 8+

## 🙏 Acknowledgments

Built with:

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Socket.io](https://socket.io/) - Real-time engine
- [Paddle](https://paddle.com/) - Payment processing

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 2026

For support or questions, please contact the development team.
