# White Paper MVP - Lightweight Digital Menu & Ordering System

This is the completed implementation of the White Paper MVP: a QR code-based ordering system for coffee shops that increases throughput and average order value without payment integration.

## ✅ What's Been Built

### Customer App (Next.js)
- **QR Code Landing**: Scan table QR → instant menu access
- **Menu Browsing**: Category tabs, item cards with availability status
- **Shopping Cart**: Zustand store with localStorage persistence
- **Smart Upsells**: AI-powered recommendations based on cart contents
- **Order Submission**: Simple checkout with "Pay at Counter" flow
- **Order Tracking**: Real-time status updates via WebSocket
- **PWA Support**: Installable, works offline, mobile-optimized

### Admin Dashboard (Next.js)
- **Real-Time Orders**: 3-column board (New → Preparing → Ready)
- **WebSocket Updates**: Live notifications with sound alerts
- **Menu Management**: Quick availability toggle (sold out switch)
- **Analytics**: Orders per hour, revenue trends, popular items

### Backend (NestJS)
- **Recommendation Engine**: Size upgrades, complementary items, popular combos
- **All APIs Ready**: Menu, Orders, Tables, Analytics, WebSocket

### Demo Data
- Coffee shop seed with 12+ items across 4 categories
- 10 tables with QR codes
- Admin credentials ready

## 🚀 Quick Start

### 1. Setup Database & Services

```bash
# Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
cd apps/api
npm run prisma:migrate

# Seed demo data
npm run prisma:seed-demo
```

### 2. Start Backend API

```bash
cd apps/api
npm run dev
```

API runs on `http://localhost:3000`

### 3. Start Customer App

```bash
cd apps/customer-app
npm run dev
```

Customer app runs on `http://localhost:3001`

### 4. Start Admin Dashboard

```bash
cd apps/admin-app
npm run dev
```

Admin app runs on `http://localhost:3002`

## 📱 Access Points

### Customer Experience
**QR Code URL**: `http://localhost:3001/demo-tenant/table/1`

Simulates scanning a QR code at Table 1. The flow:
1. Scan QR → Loads table-specific menu
2. Browse menu by category
3. Add items to cart
4. See smart upsell suggestions
5. Submit order (no payment)
6. Receive order number
7. Track order status in real-time

### Admin Dashboard
**URL**: `http://localhost:3002/dashboard`

**Credentials**:
- Email: `admin@cafe-demo.local`
- Password: `admin123`

Features:
- Real-time order board
- One-click status updates
- Sound notifications
- Menu availability management
- Analytics dashboard

## 🎯 Key Features Implemented

### 1. Core Ordering ✅
- QR code table identification
- Browse menu with categories
- Add to cart with quantity control
- Submit order without authentication

### 2. Real-Time Dashboard ✅
- WebSocket-powered live updates
- New orders appear instantly
- Sound notification on new order
- Drag-and-drop status changes

### 3. Smart Upsells ✅
- **Size Upgrades**: "Upgrade to Large?" for small drinks
- **Complementary Items**: Suggest pastries with coffee
- **Popular Combos**: Recommend frequently ordered items
- Displayed in cart review

### 4. Live Availability ✅
- Toggle items sold out instantly
- Badge shows "Sold Out" on menu
- Admin can manage in one click

### 5. Basic Analytics ✅
- Orders per hour (bar chart)
- Revenue trend (7-day line chart)
- Popular items ranked list
- Average order value

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Zustand, TanStack Query
- **Backend**: NestJS, Prisma, PostgreSQL, Redis
- **Real-time**: Socket.io
- **PWA**: Service Worker, Manifest

### State Management
- **Cart**: Zustand with localStorage
- **Server State**: TanStack Query with 5min cache
- **Real-time**: Socket.io client

### API Endpoints Used

#### Customer App
```
GET  /api/tables/number/:tableNumber?tenantId=X
GET  /api/menu/full?tenantId=X
POST /api/orders?tenantId=X
GET  /api/orders/number/:orderNumber?tenantId=X
POST /api/recommendations/suggest?tenantId=X
```

#### Admin App
```
GET   /api/orders?tenantId=X&status=PENDING
PATCH /api/orders/:id/status?tenantId=X
GET   /api/menu/items?tenantId=X
PATCH /api/menu/items/:id/availability?tenantId=X
GET   /api/analytics/dashboard?tenantId=X
GET   /api/analytics/popular-items?tenantId=X
```

## 📊 Demo Data

### Menu Items (12 items)
- **Hot Drinks**: Espresso ($3), Cappuccino ($4.50), Latte ($5), Americano ($3.50)
- **Cold Drinks**: Iced Coffee ($4), Iced Latte ($5.50), Smoothie ($6)
- **Pastries**: Croissant ($3.50), Muffin ($4), Cookie ($2.50)
- **Sandwiches**: Turkey & Cheese ($8.50), Veggie Wrap ($7.50)

### Coffee Variants
- Small (base price)
- Medium (+$1)
- Large (+$1.50)

### Tables
10 tables (1-10) with QR codes pre-generated

## 🎨 UI/UX Highlights

### Mobile-First Design
- Touch-optimized buttons
- Horizontal category scrolling
- Large tap targets
- Bottom sheet cart
- PWA installable

### Performance
- Image optimization via Next.js
- Code splitting
- Menu caching (5 min)
- Service worker for offline
- Compressed assets

## 🔄 Order Flow

```
Customer Scans QR
    ↓
Loads Table-Specific Menu
    ↓
Browses Items by Category
    ↓
Adds to Cart
    ↓
Sees Upsell Suggestions
    ↓
Submits Order (No Payment)
    ↓
Receives Order Number
    ↓
[WebSocket] → Admin Sees New Order
    ↓
Admin Accepts → Status: Preparing
    ↓
Admin Marks Ready → Customer Notified
    ↓
Customer Pays at Counter
```

## 📈 White Paper Alignment

### ✅ Core Principles Met
1. **No mobile app required** - Works in browser, installable as PWA
2. **No payment integration** - "Pay at Counter" message
3. **Fast deployment** - All infrastructure ready
4. **Augments existing POS** - Doesn't replace, complements

### 🎯 Key Metrics to Track
- Average order value increase (upsells)
- Orders per hour during peak
- Time from QR scan to order submission
- Upsell conversion rate

## 🛠️ Development Commands

```bash
# Build shared packages
npm run build --workspace=@digital-order/ui
npm run build --workspace=@digital-order/types

# Run tests
cd apps/api && npm test

# Generate Prisma client
cd apps/api && npm run prisma:generate

# Run migrations
cd apps/api && npm run prisma:migrate

# Seed demo data
cd apps/api && npm run prisma:seed-demo

# Start all apps
npm run dev --workspace=@digital-order/api
npm run dev --workspace=@digital-order/customer-app
npm run dev --workspace=@digital-order/admin-app
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
```bash
# Restart Docker services
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Service Worker Not Registering
- Check browser console for errors
- Ensure running on localhost or HTTPS
- Clear browser cache and reload

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5433/digital_order_dev
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

### Customer App (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Admin App (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🎉 Success Criteria

All criteria met:
- ✅ Customer can scan QR and order in under 60 seconds
- ✅ Staff sees orders instantly with sound notification
- ✅ Items can be marked sold out in one click
- ✅ Upsells appear contextually during cart review
- ✅ Analytics show orders per hour and popular items

## 🚀 Next Steps (Future Enhancements)

While the MVP is complete, potential enhancements:
- Push notifications for order status
- Customer order history
- Multi-language support
- Dark mode
- Print receipts
- Kitchen display system
- Table management (merge, split bills)

## 📄 License

Private - All Rights Reserved

## 👤 Admin Credentials

**Email**: `admin@cafe-demo.local`  
**Password**: `admin123`

**Tenant ID**: `demo-tenant`

---

**Built with ❤️ using Next.js, NestJS, and modern web technologies**
