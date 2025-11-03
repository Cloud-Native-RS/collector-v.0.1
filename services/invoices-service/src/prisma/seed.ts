import { InvoiceStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Invoices Service database for Cloud Native doo...');

  // Cloud Native doo tenant ID
  const tenantId = '217e632c-3c60-4bc4-935e-25297db24ae3';

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
  
  // Clean existing invoices for this tenant
  console.log('🧹 Cleaning existing invoices...');
  await prisma.invoiceLineItem.deleteMany({ where: { tenantId } });
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.dunning.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });
  console.log('   ✅ Cleaned existing invoices');

  const productIds = [
    'product-laptop-001-id',
    'product-mouse-001-id',
    'product-monitor-001-id',
    'product-book-001-id',
  ];

  // ==================== TAX CONFIGURATION ====================
  console.log('💰 Creating tax configuration...');
  await prisma.taxConfiguration.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      defaultTax: 20.0,
      taxRules: JSON.stringify({ 
        US: 8.0, 
        UK: 20.0, 
        EU: 20.0,
        DE: 19.0,
        FR: 20.0,
        CA: 13.0,
      }),
      roundingMode: 'HALF_UP',
    },
  });

  // ==================== INVOICES ====================
  console.log('📄 Creating invoices...');

  // Invoice 1: Paid invoice
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${Date.now().toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[0],
      status: InvoiceStatus.PAID,
      issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      subtotal: 1549.98,
      taxTotal: 310.00,
      discountTotal: 0,
      grandTotal: 1859.98,
      paidAmount: 1859.98,
      outstandingAmount: 0,
      currency: 'USD',
      paymentReference: `pay_${Date.now()}`,
      tenantId,
      lineItems: {
        create: [
          {
            productId: productIds[0],
            description: 'Dell XPS 13 Laptop',
            quantity: 1,
            unitPrice: 1299.99,
            discountPercent: 0,
            taxPercent: 20,
            totalPrice: 1559.99,
            tenantId,
          },
          {
            productId: productIds[1],
            description: 'Wireless Mouse Logitech MX Master 3',
            quantity: 1,
            unitPrice: 99.99,
            discountPercent: 0,
            taxPercent: 20,
            totalPrice: 119.99,
            tenantId,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: 'STRIPE',
            amount: 1859.98,
            currency: 'USD',
            status: 'SUCCEEDED',
            transactionId: `txn_${Date.now()}`,
            paymentMethod: 'card',
            processedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            notes: 'Payment received via credit card',
            tenantId,
          },
        ],
      },
    },
  });

  // Invoice 2: Issued (unpaid)
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${(Date.now() + 1).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[1],
      status: InvoiceStatus.ISSUED,
      issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      subtotal: 2499.99,
      taxTotal: 499.99,
      discountTotal: 100,
      grandTotal: 2899.98,
      paidAmount: 0,
      outstandingAmount: 2899.98,
      currency: 'USD',
      tenantId,
      notes: 'Premium customer invoice',
      lineItems: {
        create: [
          {
            productId: productIds[0],
            description: 'MacBook Pro 16"',
            quantity: 1,
            unitPrice: 2499.99,
            discountPercent: 4,
            taxPercent: 20,
            totalPrice: 2879.99,
            tenantId,
          },
        ],
      },
      payments: {
        create: [],
      },
    },
  });

  // Invoice 3: Partially paid
  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${(Date.now() + 2).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[2],
      status: InvoiceStatus.PARTIALLY_PAID,
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      subtotal: 1875.00,
      taxTotal: 375.00,
      discountTotal: 0,
      grandTotal: 2250.00,
      paidAmount: 1125.00,
      outstandingAmount: 1125.00,
      currency: 'USD',
      tenantId,
      lineItems: {
        create: [
          {
            productId: productIds[2],
            description: 'LG UltraWide 34" Monitor',
            quantity: 2,
            unitPrice: 599.99,
            discountPercent: 0,
            taxPercent: 20,
            totalPrice: 1439.98,
            tenantId,
          },
          {
            productId: productIds[1],
            description: 'Wireless Mouse Logitech MX Master 3',
            quantity: 2,
            unitPrice: 99.99,
            discountPercent: 5,
            taxPercent: 20,
            totalPrice: 227.98,
            tenantId,
          },
          {
            productId: productIds[3],
            description: 'Clean Code by Robert Martin',
            quantity: 5,
            unitPrice: 45.99,
            discountPercent: 0,
            taxPercent: 0,
            totalPrice: 229.95,
            tenantId,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: 'BANK_TRANSFER',
            amount: 1125.00,
            currency: 'USD',
            status: 'SUCCEEDED',
            transactionId: `bank_${Date.now()}`,
            paymentMethod: 'bank_transfer',
            processedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            notes: 'Partial payment received',
            tenantId,
          },
        ],
      },
      dunnings: {
        create: [
          {
            reminderLevel: 1,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            templateUsed: 'ron-payment-reminder-v1',
            tenantId,
          },
        ],
      },
    },
  });

  // Invoice 4: Overdue
  const invoice4 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${(Date.now() + 3).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[3],
      status: InvoiceStatus.OVERDUE,
      issueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (overdue)
      subtotal: 629.98,
      taxTotal: 126.00,
      discountTotal: 0,
      grandTotal: 755.98,
      paidAmount: 0,
      outstandingAmount: 755.98,
      currency: 'USD',
      tenantId,
      notes: 'Overdue invoice - payment reminder sent',
      lineItems: {
        create: [
          {
            productId: productIds[2],
            description: 'LG UltraWide 34" Monitor',
            quantity: 1,
            unitPrice: 599.99,
            discountPercent: 0,
            taxPercent: 20,
            totalPrice: 719.99,
            tenantId,
          },
          {
            productId: productIds[1],
            description: 'Wireless Mouse Logitech MX Master 3',
            quantity: 1,
            unitPrice: 99.99,
            discountPercent: 0,
            taxPercent: 20,
            totalPrice: 119.99,
            tenantId,
          },
        ],
      },
      payments: {
        create: [],
      },
      dunnings: {
        create: [
          {
            reminderLevel: 1,
            dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            status: 'SENT',
            sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            templateUsed: 'payment-reminder-v1',
            emailSent: 'contact@quickstart.com',
            notes: 'First reminder sent 10 days ago',
            tenantId,
          },
          {
            reminderLevel: 2,
            dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            status: 'SENT',
            sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            templateUsed: 'payment-reminder-v2',
            emailSent: 'contact@quickstart.com',
            notes: 'Second reminder sent 5 days ago',
            tenantId,
          },
          {
            reminderLevel: 3,
            dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            templateUsed: 'payment-reminder-final',
            notes: 'Final reminder scheduled',
            tenantId,
          },
        ],
      },
    },
  });

  // Invoice 5: Draft
  const invoice5 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${(Date.now() + 4).toString().slice(-8).toUpperCase()}`,
      customerId: customerIds[0],
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      subtotal: 2749.98,
      taxTotal: 549.99,
      discountTotal: 100,
      grandTotal: 3199.97,
      paidAmount: 0,
      outstandingAmount: 3199.97,
      currency: 'USD',
      tenantId,
      notes: 'Draft invoice - pending review',
      lineItems: {
        create: [
          {
            productId: productIds[0],
            description: 'MacBook Pro 16"',
            quantity: 1,
            unitPrice: 2499.99,
            discountPercent: 4,
            taxPercent: 20,
            totalPrice: 2879.99,
            tenantId,
          },
          {
            productId: productIds[2],
            description: 'LG UltraWide 34" Monitor',
            quantity: 1,
            unitPrice: 599.99,
            discountPercent: 0,
            taxPercent: 20,
            totalPrice: 719.99,
            tenantId,
          },
        ],
      },
      payments: {
        create: [],
      },
    },
  });

  console.log('✅ Invoices Service seed completed successfully');
  console.log(`   📄 Created 5 invoices with various statuses`);
  console.log(`   💳 Created payment records`);
  console.log(`   📧 Created dunning reminders`);

  // ==================== ADDITIONAL INVOICES (45 more to reach 50 total) ====================
  console.log('📄 Creating additional 45 invoices to reach 50 total for Cloud Native doo...');
  const invoicePromises: Promise<Awaited<ReturnType<typeof prisma.invoice.create>>>[] = [];
  const statuses: InvoiceStatus[] = [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE];
  for (let i = 0; i < 45; i++) {
    const custId = customerIds[i % customerIds.length];
    const pIdx = i % productIds.length;
    const qty = (i % 4) + 1;
    const unitPrice = [1299.99, 99.99, 599.99, 45.99][pIdx];
    const taxPercent = [20, 20, 20, 0][pIdx];
    const subtotal = Math.round(unitPrice * qty * 100) / 100;
    const taxTotal = Math.round((subtotal * taxPercent / 100) * 100) / 100;
    const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

    invoicePromises.push(
      prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${String(i + 6).padStart(3, '0')}`,
          customerId: custId,
          status: statuses[i % statuses.length],
          issueDate: new Date(Date.now() - (i % 40) * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + ((i % 30) - 10) * 24 * 60 * 60 * 1000),
          subtotal,
          taxTotal,
          discountTotal: 0,
          grandTotal,
          paidAmount: i % 3 === 0 ? grandTotal : (i % 3 === 1 ? grandTotal / 2 : 0),
          outstandingAmount: i % 3 === 0 ? 0 : (i % 3 === 1 ? grandTotal / 2 : grandTotal),
          currency: 'USD',
          tenantId,
          lineItems: {
            create: [
              {
                productId: productIds[pIdx],
                description: `Item for ${productIds[pIdx]}`,
                quantity: qty,
                unitPrice,
                discountPercent: 0,
                taxPercent,
                totalPrice: Math.round((unitPrice * qty * (1 + taxPercent / 100)) * 100) / 100,
                tenantId,
              },
            ],
          },
        },
      })
    );
  }
  await Promise.all(invoicePromises);
  console.log('✅ Created 50 total invoices for Cloud Native doo');
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
