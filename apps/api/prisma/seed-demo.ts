import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting coffee shop demo seed...');

  // Create admin user first (needed for tenant owner)
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      email: 'admin@cafe-demo.local',
      phone: '+1234567890',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'TENANT_ADMIN',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create demo tenant with owner relation
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'cafe-demo' },
    update: {},
    create: {
      name: 'Cafe Demo',
      subdomain: 'cafe-demo',
      domain: 'cafe-demo.local',
      ownerId: adminUser.id,
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        businessHours: {
          monday: { open: '07:00', close: '20:00' },
          tuesday: { open: '07:00', close: '20:00' },
          wednesday: { open: '07:00', close: '20:00' },
          thursday: { open: '07:00', close: '20:00' },
          friday: { open: '07:00', close: '22:00' },
          saturday: { open: '08:00', close: '22:00' },
          sunday: { open: '08:00', close: '18:00' },
        },
      },
      status: 'ACTIVE',
    },
  });

  console.log('✅ Tenant created:', tenant.name);

  // Create categories
  const categories = [
    { name: 'Hot Drinks', description: 'Freshly brewed hot beverages', sortOrder: 1 },
    { name: 'Cold Drinks', description: 'Refreshing cold beverages', sortOrder: 2 },
    { name: 'Pastries', description: 'Freshly baked pastries', sortOrder: 3 },
    { name: 'Sandwiches', description: 'Made-to-order sandwiches', sortOrder: 4 },
  ];

  const createdCategories = await Promise.all(
    categories.map(async (cat) => {
      const existing = await prisma.category.findFirst({
        where: { tenantId: tenant.id, name: cat.name },
      });
      if (existing) return existing;
      
      return prisma.category.create({
        data: {
          ...cat,
          tenantId: tenant.id,
        },
      });
    })
  );

  console.log('✅ Categories created:', createdCategories.length);

  // Create menu items
  const hotDrinksCategory = createdCategories.find((c) => c.name === 'Hot Drinks');
  const coldDrinksCategory = createdCategories.find((c) => c.name === 'Cold Drinks');
  const pastriesCategory = createdCategories.find((c) => c.name === 'Pastries');
  const sandwichesCategory = createdCategories.find((c) => c.name === 'Sandwiches');

  const menuItems = [
    // Hot Drinks
    {
      name: 'Espresso',
      description: 'Rich and bold espresso shot',
      basePrice: 3.0,
      categoryId: hotDrinksCategory.id,
      availability: true,
      dietaryTags: ['Vegan'],
    },
    {
      name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
      basePrice: 4.5,
      categoryId: hotDrinksCategory.id,
      availability: true,
    },
    {
      name: 'Latte',
      description: 'Smooth espresso with steamed milk',
      basePrice: 5.0,
      categoryId: hotDrinksCategory.id,
      availability: true,
    },
    {
      name: 'Americano',
      description: 'Espresso with hot water',
      basePrice: 3.5,
      categoryId: hotDrinksCategory.id,
      availability: true,
      dietaryTags: ['Vegan'],
    },
    // Cold Drinks
    {
      name: 'Iced Coffee',
      description: 'Cold brew over ice',
      basePrice: 4.0,
      categoryId: coldDrinksCategory.id,
      availability: true,
      dietaryTags: ['Vegan'],
    },
    {
      name: 'Iced Latte',
      description: 'Espresso with cold milk over ice',
      basePrice: 5.5,
      categoryId: coldDrinksCategory.id,
      availability: true,
    },
    {
      name: 'Fruit Smoothie',
      description: 'Blended fresh fruit smoothie',
      basePrice: 6.0,
      categoryId: coldDrinksCategory.id,
      availability: true,
      dietaryTags: ['Vegan', 'Gluten-Free'],
    },
    // Pastries
    {
      name: 'Croissant',
      description: 'Buttery, flaky croissant',
      basePrice: 3.5,
      categoryId: pastriesCategory.id,
      availability: true,
    },
    {
      name: 'Blueberry Muffin',
      description: 'Moist muffin with fresh blueberries',
      basePrice: 4.0,
      categoryId: pastriesCategory.id,
      availability: true,
    },
    {
      name: 'Chocolate Chip Cookie',
      description: 'Warm, gooey chocolate chip cookie',
      basePrice: 2.5,
      categoryId: pastriesCategory.id,
      availability: true,
    },
    // Sandwiches
    {
      name: 'Turkey & Cheese',
      description: 'Sliced turkey with cheddar on sourdough',
      basePrice: 8.5,
      categoryId: sandwichesCategory.id,
      availability: true,
    },
    {
      name: 'Veggie Wrap',
      description: 'Fresh vegetables in a whole wheat wrap',
      basePrice: 7.5,
      categoryId: sandwichesCategory.id,
      availability: true,
      dietaryTags: ['Vegetarian'],
    },
  ];

  const createdMenuItems = await Promise.all(
    menuItems.map(async (item) => {
      const existing = await prisma.menuItem.findFirst({
        where: { tenantId: tenant.id, categoryId: item.categoryId, name: item.name },
      });
      if (existing) return existing;
      
      return prisma.menuItem.create({
        data: {
          ...item,
          tenantId: tenant.id,
        },
      });
    })
  );

  console.log('✅ Menu items created:', createdMenuItems.length);

  // Add variants for coffee drinks
  const coffeeDrinks = createdMenuItems.filter((item) =>
    ['Latte', 'Cappuccino', 'Iced Latte', 'Iced Coffee'].includes(item.name)
  );

  for (const drink of coffeeDrinks) {
    const existingVariants = await prisma.menuItemVariant.findMany({
      where: { menuItemId: drink.id },
    });
    
    if (existingVariants.length === 0) {
      await prisma.menuItemVariant.createMany({
        data: [
          { menuItemId: drink.id, name: 'Small', priceModifier: 0, active: true },
          { menuItemId: drink.id, name: 'Medium', priceModifier: 1.0, active: true },
          { menuItemId: drink.id, name: 'Large', priceModifier: 1.5, active: true },
        ],
      });
    }
  }

  console.log('✅ Variants created for coffee drinks');

  // Create tables with QR codes
  const existingTables = await prisma.table.findMany({
    where: { tenantId: tenant.id },
  });

  if (existingTables.length === 0) {
    const tables = Array.from({ length: 10 }, (_, i) => ({
      tableNumber: `${i + 1}`,
      capacity: i % 3 === 0 ? 2 : i % 3 === 1 ? 4 : 6,
      tenantId: tenant.id,
      status: 'AVAILABLE' as const,
      qrCode: `https://cafe-demo.local/table/${i + 1}`,
    }));

    await prisma.table.createMany({
      data: tables,
    });

    console.log('✅ Tables created: 10');
  } else {
    console.log('✅ Tables already exist:', existingTables.length);
  }

  console.log('🎉 Coffee shop demo seed completed!');
  console.log('\n📝 Credentials:');
  console.log('   Email: admin@cafe-demo.local');
  console.log('   Password: admin123');
  console.log('\n🔗 URLs:');
  console.log('   Customer: http://localhost:3001/demo-tenant/table/1');
  console.log('   Admin: http://localhost:3002/dashboard');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
