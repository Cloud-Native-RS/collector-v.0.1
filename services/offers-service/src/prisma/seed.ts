import { Currency, OfferStatus, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Use DATABASE_URL from environment or fallback
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://collector:collector_dev_pass@localhost:5432/collector_offers_db?schema=public',
    },
  },
});

async function main() {
  console.log('🌱 Seeding Offers Service database for Cloud Native doo...');

  // Cloud Native doo tenant ID
  const tenantId = '217e632c-3c60-4bc4-935e-25297db24ae3';
  
  // Use real customer IDs from registry service (Cloud Native doo tenants)
  // These will be fetched dynamically or use first 10 customers from Cloud Native doo
  const customerIds = [
    '0073756f-03b1-4a65-981b-7352f18b09b2',
    '032b9a96-7452-44ca-9578-195e0fd3d5eb',
    '04ce8701-d7f5-4015-920b-789545d8eeda',
    '04e2175a-0b6c-4f4f-a579-915ac6a45d5b',
    '052d7bd7-1eb9-4b83-b8e5-69c255400374',
    '07f2ee79-d56f-4c48-87d2-d801f794f6ff',
    '08717eb1-fc2e-4d6d-b551-9102057e37a4',
    '0db92371-e059-4360-8a47-b6979354a9d4',
    '1466bed4-c56f-4df8-bc2d-6834e2d6742a',
    '14a41935-1836-4763-ad07-de2683ef5b75',
  ];
  const customerId = customerIds[0]; // Use first customer as primary
  
  // Clean existing offers for this tenant
  console.log('🧹 Cleaning existing offers...');
  await prisma.offerLineItem.deleteMany({ where: { tenantId } });
  await prisma.offer.deleteMany({ where: { tenantId } });
  console.log('   ✅ Cleaned existing offers');

  // Create sample offer
  const offer = await prisma.offer.create({
    data: {
      offerNumber: 'OFF-00001',
      customerId,
      status: OfferStatus.DRAFT,
      issueDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currency: Currency.USD,
      subtotal: new Decimal('1000.00'),
      discountTotal: new Decimal('50.00'),
      taxTotal: new Decimal('95.00'),
      grandTotal: new Decimal('1045.00'),
      tenantId,
      version: 1,
      lineItems: {
        create: [
          {
            productId: 'product-1',
            description: 'Sample Product 1',
            quantity: new Decimal('10'),
            unitPrice: new Decimal('100.00'),
            discountPercent: new Decimal('5.00'),
            taxPercent: new Decimal('10.00'),
            totalPrice: new Decimal('1045.00'),
            lineNumber: 1,
            tenantId,
          },
        ],
      },
    },
  });

  console.log(`✅ Created offer: ${offer.offerNumber}`);

  // ==================== ADDITIONAL OFFERS (49 more to reach 50 total) ====================
  console.log('📄 Creating additional 49 offers to reach 50 total for Cloud Native doo...');
  const bulkOffers: Promise<Awaited<ReturnType<typeof prisma.offer.create>>>[] = [];
  for (let i = 0; i < 49; i++) {
    const number = `OFF-${String(i + 2).padStart(5, '0')}`;
    const qty = (i % 10) + 1;
    const unit = new Decimal('100.00');
    const discount = new Decimal(((i % 6) * 2).toString());
    const tax = new Decimal('10.00');
    const subtotal = unit.mul(qty);
    const taxTotal = subtotal.mul(tax).div(100);
    const discountTotal = subtotal.mul(discount).div(100);
    const grandTotal = subtotal.minus(discountTotal).plus(taxTotal);

    const statuses = [OfferStatus.DRAFT, OfferStatus.SENT, OfferStatus.APPROVED, OfferStatus.REJECTED, OfferStatus.EXPIRED];
    bulkOffers.push(
      prisma.offer.create({
        data: {
          offerNumber: number,
          customerId: customerIds[i % customerIds.length],
          status: statuses[i % statuses.length],
          issueDate: new Date(Date.now() - (i % 20) * 24 * 60 * 60 * 1000),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          currency: Currency.USD,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          tenantId,
          version: 1,
          lineItems: {
            create: [
              {
                productId: `product-${(i % 5) + 1}`,
                description: `Sample Product ${(i % 5) + 1}`,
                quantity: new Decimal(qty.toString()),
                unitPrice: unit,
                discountPercent: discount,
                taxPercent: tax,
                totalPrice: grandTotal,
                lineNumber: 1,
                tenantId,
              },
            ],
          },
        },
      })
    );
  }
  await Promise.all(bulkOffers);
  console.log('✅ Created 50 total offers for Cloud Native doo');
  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

