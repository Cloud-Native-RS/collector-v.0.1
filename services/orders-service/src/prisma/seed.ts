import { OrderStatus, PaymentStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Orders Service database for Cloud Native doo...');

  // Cloud Native doo tenant ID (can be overridden via env)
  const tenantId = process.env.TENANT_ID || '217e632c-3c60-4bc4-935e-25297db24ae3';

  // Use real customer IDs from registry service (Cloud Native doo tenants)
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
  
  // Clean existing orders for this tenant
  console.log('🧹 Cleaning existing orders...');
  await prisma.orderStatusHistory.deleteMany({ where: { tenantId } });
  await prisma.shippingAddress.deleteMany({ where: { tenantId } });
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.orderLineItem.deleteMany({ where: { tenantId } });
  await prisma.order.deleteMany({ where: { tenantId } });
  console.log('   ✅ Cleaned existing orders');

  const productIds = [
    'product-laptop-001-id',
    'product-laptop-002-id',
    'product-mouse-001-id',
    'product-monitor-001-id',
    'product-shirt-001-id',
    'product-book-001-id',
  ];

  const productSKUs = ['LAPTOP-001', 'LAPTOP-002', 'MOUSE-001', 'MONITOR-001', 'SHIRT-MED-BLUE', 'BOOK-TECH-001'];
  const productPrices = [1299.99, 2499.99, 99.99, 599.99, 25.99, 45.99];
  const taxRates = [0.20, 0.20, 0.20, 0.20, 0.20, 0.00];

  // Order 1: Pending order
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now().toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[0],
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      subtotal: 1399.98,
      taxTotal: 280.00,
      shippingCost: 25.00,
      discountAmount: 0,
      grandTotal: 1704.98,
      currency: 'USD',
      tenantId,
      notes: 'Customer requested express shipping',
      lineItems: {
        create: [
          {
            productId: productIds[0],
            description: 'Dell XPS 13 Laptop',
            quantity: 1,
            unitPrice: productPrices[0],
            discountPercent: 0,
            taxPercent: taxRates[0] * 100,
            totalPrice: productPrices[0] * (1 + taxRates[0]),
            sku: productSKUs[0],
            reserved: false,
            tenantId,
          },
          {
            productId: productIds[2],
            description: 'Wireless Mouse Logitech MX Master 3',
            quantity: 1,
            unitPrice: productPrices[2],
            discountPercent: 0,
            taxPercent: taxRates[2] * 100,
            totalPrice: productPrices[2] * (1 + taxRates[2]),
            sku: productSKUs[2],
            reserved: false,
            tenantId,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            notes: 'Order created',
            tenantId,
          },
        ],
      },
    },
  });

  // Create shipping address for order 1
  await prisma.shippingAddress.create({
    data: {
      orderId: order1.id,
      fullName: 'John Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
      phone: '+1-555-0100',
      email: 'john.doe@example.com',
      tenantId,
    },
  });

  // Relation is maintained via ShippingAddress.orderId; no need to set on Order

  // Order 2: Confirmed and paid order
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${(Date.now() + 1).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[1],
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 2749.98,
      taxTotal: 549.99,
      shippingCost: 0,
      discountAmount: 100.00,
      grandTotal: 3199.97,
      currency: 'USD',
      paymentReference: `ch_${Date.now()}`,
      tenantId,
      notes: 'Premium customer, free shipping',
      lineItems: {
        create: [
          {
            productId: productIds[1],
            description: 'MacBook Pro 16"',
            quantity: 1,
            unitPrice: productPrices[1],
            discountPercent: 4,
            taxPercent: taxRates[1] * 100,
            totalPrice: productPrices[1] * 0.96 * (1 + taxRates[1]),
            sku: productSKUs[1],
            reserved: true,
            tenantId,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: 'STRIPE',
            paymentReference: `ch_${Date.now()}`,
            status: 'SUCCEEDED',
            amount: 3199.97,
            currency: 'USD',
            paymentMethod: 'card',
            last4: '4242',
            transactionId: `txn_${Date.now()}`,
            processedAt: new Date(),
            tenantId,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            notes: 'Order created',
            tenantId,
          },
          {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            notes: 'Payment received via Stripe',
            tenantId,
          },
        ],
      },
    },
  });

  await prisma.shippingAddress.create({
    data: {
      orderId: order2.id,
      fullName: 'Jane Smith',
      street: '555 Tech Boulevard',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'United States',
      phone: '+1-555-0500',
      email: 'jane.smith@example.com',
      tenantId,
    },
  });

  // Order 3: Processing order
  void await prisma.order.create({
    data: {
      orderNumber: `ORD-${(Date.now() + 2).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[2],
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 1545.96,
      taxTotal: 309.19,
      shippingCost: 15.00,
      discountAmount: 0,
      grandTotal: 1870.15,
      currency: 'USD',
      paymentReference: `paypal_${Date.now()}`,
      tenantId,
      lineItems: {
        create: [
          {
            productId: productIds[3],
            description: 'LG UltraWide 34" Monitor',
            quantity: 2,
            unitPrice: productPrices[3],
            discountPercent: 0,
            taxPercent: taxRates[3] * 100,
            totalPrice: productPrices[3] * 2 * (1 + taxRates[3]),
            sku: productSKUs[3],
            reserved: true,
            tenantId,
          },
          {
            productId: productIds[4],
            description: 'Cotton T-Shirt Medium Blue',
            quantity: 5,
            unitPrice: productPrices[4],
            discountPercent: 10,
            taxPercent: taxRates[4] * 100,
            totalPrice: productPrices[4] * 5 * 0.9 * (1 + taxRates[4]),
            sku: productSKUs[4],
            reserved: true,
            tenantId,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: 'PAYPAL',
            paymentReference: `paypal_${Date.now()}`,
            status: 'SUCCEEDED',
            amount: 1870.15,
            currency: 'USD',
            paymentMethod: 'paypal',
            processedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            tenantId,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            notes: 'Order created',
            tenantId,
          },
          {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            notes: 'Payment received via PayPal',
            tenantId,
          },
          {
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            notes: 'Order is being prepared for shipment',
            tenantId,
          },
        ],
      },
    },
  });

  // Order 4: Shipped order
  void await prisma.order.create({
    data: {
      orderNumber: `ORD-${(Date.now() + 3).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[1],
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 45.99,
      taxTotal: 0,
      shippingCost: 5.00,
      discountAmount: 0,
      grandTotal: 50.99,
      currency: 'USD',
      paymentReference: `bank_${Date.now()}`,
      tenantId,
      lineItems: {
        create: [
          {
            productId: productIds[5],
            description: 'Clean Code by Robert Martin',
            quantity: 1,
            unitPrice: productPrices[5],
            discountPercent: 0,
            taxPercent: taxRates[5] * 100,
            totalPrice: productPrices[5],
            sku: productSKUs[5],
            reserved: false,
            tenantId,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: 'BANK_TRANSFER',
            paymentReference: `bank_${Date.now()}`,
            status: 'SUCCEEDED',
            amount: 50.99,
            currency: 'USD',
            paymentMethod: 'bank_transfer',
            processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            tenantId,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            notes: 'Order created',
            tenantId,
          },
          {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            notes: 'Payment received',
            tenantId,
          },
          {
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            notes: 'Order processed',
            tenantId,
          },
          {
            status: 'SHIPPED',
            paymentStatus: 'PAID',
            notes: 'Order shipped with tracking number',
            tenantId,
          },
        ],
      },
    },
  });

  // Order 5: Delivered order
  void await prisma.order.create({
    data: {
      orderNumber: `ORD-${(Date.now() + 4).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[0],
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 1249.99,
      taxTotal: 249.99,
      shippingCost: 0,
      discountAmount: 50.00,
      grandTotal: 1499.98,
      currency: 'USD',
      paymentReference: `stripe_${Date.now()}`,
      tenantId,
      lineItems: {
        create: [
          {
            productId: productIds[0],
            description: 'Dell XPS 13 Laptop',
            quantity: 1,
            unitPrice: productPrices[0] - 50,
            discountPercent: 0,
            taxPercent: taxRates[0] * 100,
            totalPrice: (productPrices[0] - 50) * (1 + taxRates[0]),
            sku: productSKUs[0],
            reserved: false,
            tenantId,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: 'STRIPE',
            paymentReference: `ch_delivered_${Date.now()}`,
            status: 'SUCCEEDED',
            amount: 1499.98,
            currency: 'USD',
            paymentMethod: 'card',
            last4: '1234',
            transactionId: `txn_delivered_${Date.now()}`,
            processedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            tenantId,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            notes: 'Order created',
            tenantId,
          },
          {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            notes: 'Payment received',
            tenantId,
          },
          {
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            notes: 'Order processed',
            tenantId,
          },
          {
            status: 'SHIPPED',
            paymentStatus: 'PAID',
            notes: 'Order shipped',
            tenantId,
          },
          {
            status: 'DELIVERED',
            paymentStatus: 'PAID',
            notes: 'Order delivered successfully',
            tenantId,
          },
        ],
      },
    },
  });

  console.log('✅ Orders Service seed completed successfully');
  console.log(`   📦 Created 5 orders with various statuses`);

  // ==================== ADDITIONAL ORDERS (45 more to reach 50 total) ====================
  console.log('📦 Creating additional 45 orders to reach 50 total for Cloud Native doo...');
  const statuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELED];
  const paymentStatuses: PaymentStatus[] = [PaymentStatus.UNPAID, PaymentStatus.PAID, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.FAILED];
  const bulkPromises: Promise<Awaited<ReturnType<typeof prisma.order.create>>>[] = [];
  for (let i = 0; i < 45; i++) {
    const customerId = customerIds[i % customerIds.length];
    const skuIdx = i % productSKUs.length;
    const unitPrice = productPrices[skuIdx];
    const taxPercent = Math.round(taxRates[skuIdx] * 100);
    const qty = (i % 5) + 1;
    const subtotal = +(unitPrice * qty).toFixed(2);
    const taxTotal = +((subtotal * taxPercent) / 100).toFixed(2);
    const shipping = i % 3 === 0 ? 0 : 9.99;
    const grandTotal = +(subtotal + taxTotal + shipping).toFixed(2);

    bulkPromises.push(
      prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${String(i + 6).padStart(3, '0')}`,
          customerId,
          status: statuses[i % statuses.length],
          paymentStatus: paymentStatuses[i % paymentStatuses.length],
          subtotal,
          taxTotal,
          shippingCost: shipping,
          discountAmount: 0,
          grandTotal,
          currency: 'USD',
          tenantId,
          lineItems: {
            create: [
              {
                productId: productIds[skuIdx],
                description: `Item ${productSKUs[skuIdx]}`,
                quantity: qty,
                unitPrice: unitPrice,
                discountPercent: 0,
                taxPercent,
                totalPrice: +((unitPrice * qty) * (1 + taxPercent / 100)).toFixed(2),
                sku: productSKUs[skuIdx],
                reserved: false,
                tenantId,
              },
            ],
          },
          statusHistory: {
            create: [
              {
                status: statuses[i % statuses.length],
                paymentStatus: paymentStatuses[i % paymentStatuses.length],
                notes: 'Order created',
                tenantId,
              },
            ],
          },
        },
      })
    );
  }
  await Promise.all(bulkPromises);
  console.log('✅ Created 50 total orders for Cloud Native doo');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

