import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

async function generateTableQrCode(tenantSlug: string, tableNumber: string): Promise<string> {
  const baseUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production' ? null : 'http://localhost:3001');
  if (!baseUrl) {
    throw new Error(
      'FRONTEND_URL must be set in production for QR code generation. Set it to your customer app URL (e.g. https://order.yourdomain.com).'
    );
  }
  const qrData = `${baseUrl.replace(/\/$/, '')}/${tenantSlug}/${tableNumber}/menu`;
  return QRCode.toDataURL(qrData);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@digitalorder.com' },
    update: {},
    create: {
      email: 'admin@digitalorder.com',
      phone: '+1234567890',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Created super admin:', superAdmin.email);

  // Create Demo Tenant (subdomain matches customer app home page /demo-tenant/menu)
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo-tenant' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      subdomain: 'demo-tenant',
      ownerId: superAdmin.id,
      subscriptionTier: 'PROFESSIONAL',
      status: 'ACTIVE',
      settings: {
        theme: {
          primaryColor: '#4F46E5',
          logo: null,
          favicon: null,
        },
        features: {
          tableOrdering: true,
          deliveryOrdering: true,
          takeawayOrdering: true,
          reservations: true,
          inventory: true,
          loyaltyProgram: false,
        },
        limits: {
          maxMenuItems: 500,
          maxTables: 50,
          maxStaff: 25,
          maxOrders: 5000,
        },
        business: {
          address: '123 Main St, New York, NY 10001',
          phone: '+1234567890',
          email: 'demo@restaurant.com',
          taxId: '12-3456789',
          currency: 'USD',
          timezone: 'America/New_York',
        },
      },
    },
  });

  console.log('✅ Created demo tenant:', demoTenant.name);

  // Create Testera Tenant (for local testing - /testera/menu)
  const testeraTenant = await prisma.tenant.upsert({
    where: { subdomain: 'testera' },
    update: { status: 'ACTIVE' }, // Ensure ACTIVE if tenant existed (e.g. from admin registration)
    create: {
      name: 'Test Restaurant',
      subdomain: 'testera',
      ownerId: superAdmin.id,
      subscriptionTier: 'PROFESSIONAL',
      status: 'ACTIVE',
      settings: {
        theme: {
          primaryColor: '#ea580c',
          logo: null,
          favicon: null,
        },
        features: {
          tableOrdering: true,
          deliveryOrdering: true,
          takeawayOrdering: true,
          reservations: false,
          inventory: false,
          loyaltyProgram: false,
        },
        limits: {
          maxMenuItems: 500,
          maxTables: 50,
          maxStaff: 25,
          maxOrders: 5000,
        },
        business: {
          address: 'Test Address',
          phone: '+1234567890',
          email: 'test@testera.com',
          currency: 'USD',
          timezone: 'Europe/Ljubljana',
        },
      },
    },
  });

  console.log('✅ Created testera tenant:', testeraTenant.name);

  await prisma.tenantAccess.upsert({
    where: {
      userId_tenantId: {
        userId: superAdmin.id,
        tenantId: testeraTenant.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      tenantId: testeraTenant.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Testera menu
  await prisma.orderItem.deleteMany({
    where: { menuItem: { tenantId: testeraTenant.id } },
  });
  await prisma.menuItem.deleteMany({ where: { tenantId: testeraTenant.id } });
  await prisma.category.deleteMany({ where: { tenantId: testeraTenant.id } });

  const testeraCategory = await prisma.category.create({
    data: {
      tenantId: testeraTenant.id,
      name: 'Food',
      description: 'Main dishes',
      sortOrder: 1,
      active: true,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        tenantId: testeraTenant.id,
        categoryId: testeraCategory.id,
        name: 'pica',
        description: 'pica test',
        basePrice: 3.0,
        prepTime: 15,
        dietaryTags: ['vege'],
        active: true,
      },
    ],
  });

  await prisma.table.deleteMany({ where: { tenantId: testeraTenant.id } });
  const testeraSlug = testeraTenant.menuSlug ?? testeraTenant.subdomain;
  for (let i = 0; i < 5; i++) {
    const tableNumber = `${i + 1}`;
    const qrCode = await generateTableQrCode(testeraSlug, tableNumber);
    await prisma.table.create({
      data: {
        tenantId: testeraTenant.id,
        tableNumber,
        capacity: 4,
        location: 'Main',
        qrCode,
        status: 'AVAILABLE',
      },
    });
  }

  // Grant super admin access to demo tenant
  await prisma.tenantAccess.upsert({
    where: {
      userId_tenantId: {
        userId: superAdmin.id,
        tenantId: demoTenant.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      tenantId: demoTenant.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Clear existing menu data to avoid duplicates/wrong category associations from previous runs
  // Must delete OrderItems first (they reference MenuItems via foreign key)
  await prisma.orderItem.deleteMany({
    where: { menuItem: { tenantId: demoTenant.id } },
  });
  await prisma.menuItem.deleteMany({ where: { tenantId: demoTenant.id } });
  await prisma.category.deleteMany({ where: { tenantId: demoTenant.id } });

  // Create Categories
  const appetizers = await prisma.category.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Appetizers',
      description: 'Start your meal with our delicious appetizers',
      sortOrder: 1,
      active: true,
    },
  });

  const mains = await prisma.category.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Main Courses',
      description: 'Hearty and satisfying main dishes',
      sortOrder: 2,
      active: true,
    },
  });

  const desserts = await prisma.category.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Desserts',
      description: 'Sweet treats to end your meal',
      sortOrder: 3,
      active: true,
    },
  });

  const beverages = await prisma.category.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Beverages',
      description: 'Refreshing drinks',
      sortOrder: 4,
      active: true,
    },
  });

  console.log('✅ Created categories');

  // Create Menu Items
  await prisma.menuItem.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        categoryId: appetizers.id,
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan and croutons',
        basePrice: 8.99,
        prepTime: 10,
        dietaryTags: ['vegetarian'],
        active: true,
      },
      {
        tenantId: demoTenant.id,
        categoryId: appetizers.id,
        name: 'Buffalo Wings',
        description: 'Spicy chicken wings with blue cheese dip',
        basePrice: 12.99,
        prepTime: 15,
        allergens: ['dairy'],
        active: true,
      },
      {
        tenantId: demoTenant.id,
        categoryId: mains.id,
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with seasonal vegetables',
        basePrice: 24.99,
        prepTime: 20,
        allergens: ['fish'],
        dietaryTags: ['gluten-free'],
        active: true,
      },
      {
        tenantId: demoTenant.id,
        categoryId: mains.id,
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato, mozzarella, and basil',
        basePrice: 16.99,
        prepTime: 18,
        allergens: ['dairy', 'wheat'],
        dietaryTags: ['vegetarian'],
        active: true,
      },
      {
        tenantId: demoTenant.id,
        categoryId: desserts.id,
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center',
        basePrice: 7.99,
        prepTime: 12,
        allergens: ['dairy', 'eggs', 'wheat'],
        active: true,
      },
      {
        tenantId: demoTenant.id,
        categoryId: beverages.id,
        name: 'Fresh Lemonade',
        description: 'Homemade lemonade with mint',
        basePrice: 3.99,
        prepTime: 5,
        dietaryTags: ['vegan'],
        active: true,
      },
    ],
  });

  console.log('✅ Created menu items');

  // Create Tables (clear existing to avoid duplicate qrCode)
  await prisma.table.deleteMany({ where: { tenantId: demoTenant.id } });
  const demoTenantSlug = demoTenant.menuSlug ?? demoTenant.subdomain;
  for (let i = 0; i < 10; i++) {
    const tableNumber = `T${i + 1}`;
    const qrCode = await generateTableQrCode(demoTenantSlug, tableNumber);
    await prisma.table.create({
      data: {
        tenantId: demoTenant.id,
        tableNumber,
        capacity: i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 6,
        location: i < 5 ? 'Main Dining' : 'Patio',
        qrCode,
        status: 'AVAILABLE',
      },
    });
  }

  console.log('✅ Created tables');

  // Create Demo Staff
  const waiter = await prisma.user.upsert({
    where: { email: 'waiter@demo.com' },
    update: {},
    create: {
      email: 'waiter@demo.com',
      phone: '+1234567891',
      passwordHash: await bcrypt.hash('Waiter@123', 10),
      role: 'WAITER',
      firstName: 'John',
      lastName: 'Waiter',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const kitchen = await prisma.user.upsert({
    where: { email: 'kitchen@demo.com' },
    update: {},
    create: {
      email: 'kitchen@demo.com',
      phone: '+1234567892',
      passwordHash: await bcrypt.hash('Kitchen@123', 10),
      role: 'KITCHEN',
      firstName: 'Chef',
      lastName: 'Mike',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await prisma.staff.deleteMany({ where: { tenantId: demoTenant.id } });
  await prisma.staff.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        userId: waiter.id,
        position: 'Waiter',
        hourlyRate: 15.0,
        active: true,
      },
      {
        tenantId: demoTenant.id,
        userId: kitchen.id,
        position: 'Chef',
        hourlyRate: 25.0,
        active: true,
      },
    ],
  });

  console.log('✅ Created staff members');

  // Create Demo Customer
  await prisma.user.upsert({
    where: { phone: '+1234567893' },
    update: {},
    create: {
      phone: '+1234567893',
      firstName: 'Jane',
      lastName: 'Customer',
      phoneVerified: true,
    },
  });

  console.log('✅ Created demo customer');

  // Invalidate menu cache so API serves fresh data (avoids 400 from stale cart item IDs)
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    for (const tenant of [demoTenant, testeraTenant]) {
      const keys = await redis.keys(`tenant:${tenant.id}:menu:*`);
      const catKeys = await redis.keys(`tenant:${tenant.id}:categories`);
      const all = [...keys, ...catKeys];
      if (all.length > 0) {
        await redis.del(...all);
        console.log(`✅ Cleared menu cache for ${tenant.subdomain}`);
      }
    }
    redis.disconnect();
  } catch (e) {
    console.warn('⚠️ Could not clear Redis cache (Redis may be offline):', (e as Error).message);
  }

  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('📝 Demo Credentials:');
  console.log('Super Admin: admin@digitalorder.com / Admin@123');
  console.log('Waiter: waiter@demo.com / Waiter@123');
  console.log('Kitchen: kitchen@demo.com / Kitchen@123');
  console.log('Tenant Subdomains: demo-tenant, testera');
  console.log('Customer menu: http://localhost:3001/demo-tenant/menu or http://localhost:3001/testera/menu');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
