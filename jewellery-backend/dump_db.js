const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('=== PRODUCTS TABLE ===');
  console.log(JSON.stringify(await prisma.product.findMany(), null, 2));

  console.log('\n=== GALLERY ITEMS TABLE ===');
  console.log(JSON.stringify(await prisma.galleryItem.findMany(), null, 2));

  console.log('\n=== FAQS TABLE ===');
  console.log(JSON.stringify(await prisma.faq.findMany(), null, 2));

  console.log('\n=== ORDERS TABLE ===');
  console.log(JSON.stringify(await prisma.order.findMany({ include: { product: true } }), null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
