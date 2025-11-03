import { DeliveryStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding delivery service database...');

  const tenantId = 'default-tenant';

  // Create sample carriers
  const carriers = [
    {
      name: 'DHL Express',
      apiEndpoint: 'https://api.dhl.com/v1',
      trackingUrlTemplate: 'https://www.dhl.com/tracking?trackingNumber={trackingNumber}',
      active: true,
      tenantId,
    },
    {
      name: 'UPS',
      apiEndpoint: 'https://api.ups.com/v1',
      trackingUrlTemplate: 'https://www.ups.com/track?tracknum={trackingNumber}',
      active: true,
      tenantId,
    },
    {
      name: 'GLS',
      apiEndpoint: 'https://api.gls-group.com/v1',
      trackingUrlTemplate: 'https://gls-group.com/tracking?trackingNumber={trackingNumber}',
      active: true,
      tenantId,
    },
  ];

  const createdCarriers = [];
  for (const carrier of carriers) {
    const existing = await prisma.carrier.findFirst({
      where: { name: carrier.name, tenantId: carrier.tenantId },
    });

    if (!existing) {
      const created = await prisma.carrier.create({ data: carrier });
      createdCarriers.push(created);
      console.log(`✅ Created carrier: ${carrier.name}`);
    } else {
      createdCarriers.push(existing);
      console.log(`⏭️  Carrier already exists: ${carrier.name}`);
    }
  }

  // Mock customer and order IDs (in production these come from registry and orders services)
  const customerIds = [
    'customer-001',
    'customer-002',
    'customer-003',
    'customer-004',
    'customer-005',
  ];

  const orderIds = Array.from({ length: 25 }, (_, i) => `order-${String(i + 1).padStart(3, '0')}`);
  const productIds = Array.from({ length: 10 }, (_, i) => `product-${String(i + 1).padStart(3, '0')}`);

  // Create 25 delivery notes
  console.log('📦 Creating 25 delivery notes...');
  const deliveryNotes = [];
  const statuses: DeliveryStatus[] = [DeliveryStatus.PENDING, DeliveryStatus.DISPATCHED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED];

  for (let i = 0; i < 25; i++) {
    const deliveryNumber = `DN-${String(i + 1).padStart(5, '0')}`;
    const customerId = customerIds[i % customerIds.length];
    const orderId = orderIds[i];
    const status = statuses[i % statuses.length];
    const carrier = i % 3 === 0 ? createdCarriers[0] : i % 3 === 1 ? createdCarriers[1] : createdCarriers[2];

    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        deliveryNumber,
        orderId,
        customerId,
        status,
        carrierId: carrier.id,
        trackingNumber: status !== DeliveryStatus.PENDING ? `TRACK-${Date.now()}-${i}` : null,
        shippedAt: status !== DeliveryStatus.PENDING ? new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000) : null,
        deliveredAt: status === DeliveryStatus.DELIVERED ? new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000) : null,
        deliveryAddressId: `address-${i % 10}`,
        tenantId,
        items: {
          create: [
            {
              productId: productIds[i % productIds.length],
              description: `Product ${i + 1}`,
              quantity: (i % 5) + 1,
              unit: 'pcs',
              tenantId,
            },
          ],
        },
        events: {
          create: [
            {
              eventType: 'CREATED',
              timestamp: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000),
              tenantId,
            },
            ...(status !== DeliveryStatus.PENDING ? [{
              eventType: 'DISPATCHED' as const,
              timestamp: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000),
              tenantId,
            }] : []),
          ],
        },
      },
    });

    deliveryNotes.push(deliveryNote);
  }

  console.log(`✅ Created ${deliveryNotes.length} delivery notes`);
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

