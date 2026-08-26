// Seed script — populates the database with initial data
// Run: node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clear existing data ──────────────────────────────────────────────────
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.faq.deleteMany();

  // ── Products (pendant sizes) ─────────────────────────────────────────────
  const products = await prisma.product.createMany({
    data: [
      {
        name: '18 mm Pendant',
        sizeLabel: '18 mm',
        sizeMm: 18,
        priceInr: 11900,
        description: 'Our most popular size. Elegant and subtle.',
        isActive: true,
      },
      {
        name: '20 mm Pendant',
        sizeLabel: '20 mm',
        sizeMm: 20,
        priceInr: 12700,
        description: 'Slightly larger for more terrain detail.',
        isActive: true,
      },
      {
        name: '25 mm Pendant',
        sizeLabel: '25 mm',
        sizeMm: 25,
        priceInr: 15700,
        description: 'Our statement size. Bold and detailed.',
        isActive: true,
      },
      {
        name: '30 mm Pendant',
        sizeLabel: '30 mm',
        sizeMm: 30,
        priceInr: 19400,
        description: 'Maximum terrain depth and presence.',
        isActive: true,
      },
    ],
  });
  console.log(`✅ Created ${products.count} products`);

  // ── Gallery Items ────────────────────────────────────────────────────────
  const gallery = await prisma.galleryItem.createMany({
    data: [
      {
        index: 1,
        name: 'Mountain Ridge',
        subtitle: 'Handmade terrain',
        bgColor: '#d7d5cb',
        darkPendant: false,
      },
      {
        index: 2,
        name: 'Black Terrain',
        subtitle: 'Hand-finished',
        bgColor: '#22221f',
        darkPendant: true,
      },
      {
        index: 3,
        name: 'Your Coordinates',
        subtitle: 'Custom landscape',
        bgColor: '#c6c4bb',
        darkPendant: false,
      },
    ],
  });
  console.log(`✅ Created ${gallery.count} gallery items`);

  // ── FAQs ─────────────────────────────────────────────────────────────────
  const faqs = await prisma.faq.createMany({
    data: [
      {
        index: 1,
        question: 'What is a terrain pendant?',
        answer:
          'A terrain pendant is a piece of jewellery created from the actual landscape of a location. Mountains, valleys and terrain lines become part of the pendant.',
      },
      {
        index: 2,
        question: 'Can I choose any location?',
        answer:
          'Yes. You can choose virtually any location on Earth — a city, mountain, home, travel destination or any meaningful place.',
      },
      {
        index: 3,
        question: 'Can I add coordinates or engraving?',
        answer:
          'Yes. Coordinates and a short personalized message can be added to the back of the pendant.',
      },
      {
        index: 4,
        question: 'How long does production take?',
        answer:
          'Production usually takes approximately 7–14 days depending on the selected configuration.',
      },
      {
        index: 5,
        question: 'How do I create my pendant?',
        answer:
          'Open the configurator, select a location, choose the pendant size and add optional engraving.',
      },
    ],
  });
  console.log(`✅ Created ${faqs.count} FAQ items`);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('   You can now start the backend server with: npm run dev');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
