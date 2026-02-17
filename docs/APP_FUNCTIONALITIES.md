# App Functionalities

This document describes the detailed functionalities of the Digital Order application for **Customer** and **Admin** roles.

---

## Table of Contents

1. [Customer App](#customer-app)
2. [Admin App](#admin-app)

---

## Customer App

The customer app is a mobile-first web application for diners to browse menus, place orders, and track order status. Customers reach the app via a tenant-specific link (e.g. `/{tenant-id}/dashboard` or `/{menu-slug}/menu`).

### Entry Points

- **Root** (`/`): Redirects to the tenant dashboard.
- **Dashboard** (`/{tenantId}/dashboard`): Landing page with branded hero and quick actions.
- **Table** (`/{tenantId}/table/{tableNumber}`): Scans QR or visits table-specific URL; validates table, stores table number in cart, redirects to menu.

### 1. Restaurant Dashboard

**Purpose:** Introduces the restaurant and provides shortcuts to main actions.

**Features:**
- Branded hero section with configurable:
  - App name
  - Gradient colors (start, mid, end)
  - Optional background image
- Action cards:
  - **Browse Menu** — navigates to the menu
  - **Track Order** — navigates to order tracking (enter order number)

### 2. Menu Browsing

**Purpose:** Browse menu items by category and add items to the cart.

**Features:**
- **Category tabs:** Switch between categories (e.g. Starters, Mains, Drinks).
- **Menu grid:** Responsive grid of menu item cards.
- **Menu item card:**
  - Image, name, price, short description
  - Dietary tags (Vegan, Gluten-free, etc.)
  - Sold-out badge when unavailable
  - Quick **Add** button (adds item with default options)
  - Tap card to open item detail page
- **Cart icon:** Header badge with total item count.
- **Cart drawer:** Slide-out panel with current cart and checkout button.
- **Active order banner:** When a non-completed order exists, shows a banner linking to order status.
- **Branding:** Layout uses tenant branding (colors, background image).

### 3. Menu Item Detail

**Purpose:** View full details and add item with variants and modifiers.

**URL:** `/{tenantId}/menu/{itemId}`

**Features:**
- Image carousel (if multiple images).
- Name, price, description.
- Dietary tags and allergens.
- Variants (e.g. size) — selectable if available.
- Modifiers (e.g. extra cheese) — add-ons with optional price.
- **Add to Cart** — adds configured item.
- **You might also like:** Suggested items (admin-configured or same category).
- **Sold Out** state when unavailable.

### 4. Shopping Cart

**Purpose:** Review and adjust cart before checkout.

**Features:**
- List of items with:
  - Image, name, variant, modifiers
  - Quantity controls (+ / −)
  - Remove item
  - Line total
- **Upsell recommendations:** “You might also like” based on cart contents.
- **Total:** Subtotal and item count.
- **Order** button → Checkout.

### 5. Checkout

**Purpose:** Submit order with customer details.

**URL:** `/{tenantId}/checkout`

**Features:**
- **Order summary:** Items, quantities, line totals, grand total.
- **Table number:** Shown when ordered from a table.
- **Customer details:**
  - Name (optional)
  - Special requests (optional)
- **Payment notice:** “Payment at counter after order.”
- **Submit Order:** Creates order and redirects to success screen.
- **Validation:** Prevents submit if cart is empty; clears invalid items if menu changed.

### 6. Order Success

**Purpose:** Confirmation after placing an order.

**Features:**
- Success message and order number.
- Notice to pay at the counter.
- **Track Order** — go to order status page.
- **Back to Menu** — continue browsing.
- Order summary with items and current status.
- Banner hidden once order is completed, delivered, or cancelled.

### 7. Order Tracking

**Purpose:** Check status of an order by order number.

**URLs:**
- `/{tenantId}/track-order` — enter order number form
- `/{tenantId}/order/{orderNumber}` — order status view

**Features:**
- **Enter order number:** Text input (e.g. ORD-12345) → loads order.
- **Order status display:**
  - Order number (large)
  - Status badge (New, Preparing, Ready, Completed, Cancelled)
  - Progress timeline: Order Placed → Preparing → Ready for Pickup
  - Order items with quantities and prices
  - Total
  - Special requests (if any)
- **Real-time updates:** Status reflects changes from admin.

### 8. Active Order Banner

**Purpose:** Quick access to order status while order is in progress.

**Features:**
- Shown on menu page when there is an active order (not completed/cancelled).
- Displays order number, status, and total.
- Tapping opens order status page.
- Automatically hidden when order reaches final state.

### 9. Table-Scoped Ordering

**Purpose:** Associate orders with a table via QR code or direct link.

**Features:**
- URL `/{tenantId}/table/{tableNumber}` validates table and stores it in cart.
- Table number is used in checkout and shown to staff.
- If table API fails, user is still redirected to menu; table number may be used if available.

---

## Admin App

The admin app is a web dashboard for restaurant staff to manage orders, menu, analytics, and settings. Access requires login (email + password).

### Authentication

- **Login** (`/login`): Email and password.
- **Register** (`/register`): Account creation (when enabled).
- **Logout:** Clears session and redirects to login.
- **Auth guard:** Protected routes require authenticated user.
- **Tenant routing:** After login, redirects to tenant dashboard (subdomain or tenant slug).

### Navigation

- **Orders** — Order dashboard
- **Menu** — Menu management
- **Analytics** — Analytics dashboard
- **Settings** — Branding and profile

### 1. Order Dashboard

**Purpose:** Real-time order management and overview.

**URL:** `/{tenantId}/dashboard`

**Features:**
- **Summary metrics (today):**
  - Date
  - Orders completed
  - Items sold
  - Revenue
- **Kanban-style columns:**
  - **New Orders** (PENDING, PENDING_PAYMENT): Accept button
  - **Preparing** (CONFIRMED, PREPARING): Start Preparing → Mark Ready
  - **Ready** (READY): Complete button
- **Order card:**
  - Order number, table, customer name
  - Status badge
  - Time since order
  - Item list with quantities
  - Special requests
  - Total amount
  - Status actions (Accept, Start Preparing, Mark Ready, Complete)
- **Sold Today:** Floating button to expand completed/delivered orders for today.
- **Real-time updates:** WebSocket (when enabled) for live order changes.

### 2. Menu Management

**Purpose:** Manage menu items, categories, and availability.

**URL:** `/{tenantId}/menu`

**Features:**
- **Summary stats:**
  - Total items
  - Available
  - Sold out
- **Search:** By name, description, or category.
- **View modes:** List and grid.
- **Add Item:** Opens create form.
- **Edit Item:** Opens edit form for existing item.
- **Menu item table:**
  - Name, category, price, availability
  - **Availability toggle:** Available / Sold Out
  - Edit action
- **Create/Edit form:**
  - Name, description, base price
  - Category (existing or create new)
  - Prep time (minutes)
  - Allergens (tags)
  - Dietary tags (e.g. Vegan, Gluten-free)
  - Image upload
  - Variants (e.g. Small, Medium, Large with price modifiers)
  - Modifier groups (e.g. Extra toppings with min/max selection)
  - Suggested items (related items for upsell)
- **Form validation:** Required fields and pricing rules.

### 3. Analytics Dashboard

**Purpose:** Business performance and insights.

**URL:** `/{tenantId}/analytics`

**Features:**
- **Tabs:** Overview, Orders.
- **Overview tab:**
  - **Today metrics:**
    - Total orders
    - Revenue
    - Average order value
    - Peak hour
  - **Change vs yesterday:** For orders and revenue.
  - **Charts:**
    - Revenue by day (last 7 days)
    - Orders by hour (today)
  - **Popular items:** Most ordered items.
- **Orders tab:** History and filters for past orders.

### 4. Settings

**Purpose:** Branding, menu link, and profile.

**URL:** `/{tenantId}/settings`

**Features:**
- **Customer menu link:**
  - Shareable URL for customer menu.
  - Copy and open in new tab.
  - **Regenerate link:** New slug; old link invalidated.
- **Branding tab:**
  - App name
  - Primary color
  - Accent color
  - Hero gradient (start, mid, end)
  - Content background image
  - Save changes
- **Profile tab:**
  - First name, last name
  - Email, phone
  - Profile picture
  - Save changes

---

## Data Flow Summary

| Actor   | Action                | Result                                              |
|---------|-----------------------|-----------------------------------------------------|
| Customer| Browse menu           | Load categories and items (tenant-scoped)          |
| Customer| Add to cart           | Store in local cart (variants, modifiers)          |
| Customer| Submit order          | Create order via API; table, name, requests sent   |
| Customer| Track order           | View order status by order number                  |
| Admin   | Accept order          | Set status to CONFIRMED                            |
| Admin   | Start preparing       | Set status to PREPARING                            |
| Admin   | Mark ready            | Set status to READY                                |
| Admin   | Complete              | Set status to COMPLETED                            |
| Admin   | Edit menu             | CRUD items, categories, availability               |
| Admin   | Update branding       | Save tenant branding (colors, images)              |

---

## Order Status Lifecycle

```
PENDING / PENDING_PAYMENT → CONFIRMED → PREPARING → READY → COMPLETED
                    ↓
               CANCELLED
```

---

## Technical Notes

- **Multi-tenant:** All data is tenant-scoped (tenantId).
- **Customer app:** No login; uses tenant/slug in URL.
- **Admin app:** JWT-based auth; role-based access.
- **Payment:** Pay at counter; no online payment integration.
- **Order type:** Dine-in by default; table number optional.
