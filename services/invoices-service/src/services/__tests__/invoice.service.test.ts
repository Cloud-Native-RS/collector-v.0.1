import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from '../invoice.service';
import { AppError } from '../../middleware/error-handler';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma Client
const mockPrisma = {
  invoice: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  lineItem: {
    create: vi.fn(),
  },
  payment: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

const mockAxios = {
  get: vi.fn(),
};

vi.mock('axios', () => ({
  default: mockAxios,
}));

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InvoiceService(mockPrisma);
  });

  describe('createFromDeliveryNote', () => {
    const validData = {
      deliveryNoteId: 'delivery-123',
      customerId: 'customer-123',
      tenantId: 'test-tenant',
      currency: 'USD',
      dueDays: 30,
      notes: 'Test invoice',
      lineItems: [
        {
          productId: 'product-123',
          description: 'Test Product',
          quantity: 2,
          unitPrice: 100.00,
          discountPercent: 10,
          taxPercent: 20,
        },
      ],
    };

    it('should create invoice from delivery note with valid data', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-0001',
        deliveryNoteId: validData.deliveryNoteId,
        customerId: validData.customerId,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal: new Decimal(180),
        taxTotal: new Decimal(36),
        discountTotal: new Decimal(0),
        grandTotal: new Decimal(216),
        outstandingAmount: new Decimal(216),
        currency: 'USD',
        paidAmount: new Decimal(0),
        notes: validData.notes,
        tenantId: validData.tenantId,
        lineItems: [{ id: 'line-1', ...validData.lineItems[0], totalPrice: new Decimal(216) }],
      };

      mockAxios.get.mockResolvedValue({ data: { success: true } });
      (mockPrisma.invoice.count as any).mockResolvedValue(0);
      (mockPrisma.invoice.create as any).mockResolvedValue(mockInvoice);

      const result = await service.createFromDeliveryNote(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('inv-1');
      expect(result.status).toBe('DRAFT');
      expect(mockPrisma.invoice.create).toHaveBeenCalled();
    });

    it('should calculate totals correctly', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-0001',
        deliveryNoteId: validData.deliveryNoteId,
        customerId: validData.customerId,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal: new Decimal(180),
        taxTotal: new Decimal(36),
        discountTotal: new Decimal(0),
        grandTotal: new Decimal(216),
        outstandingAmount: new Decimal(216),
        currency: 'USD',
        paidAmount: new Decimal(0),
        notes: validData.notes,
        tenantId: validData.tenantId,
        lineItems: [{ id: 'line-1', ...validData.lineItems[0], totalPrice: new Decimal(216) }],
      };

      mockAxios.get.mockResolvedValue({ data: { success: true } });
      (mockPrisma.invoice.count as any).mockResolvedValue(0);
      (mockPrisma.invoice.create as any).mockResolvedValue(mockInvoice);

      const result = await service.createFromDeliveryNote(validData);

      expect(result.grandTotal.toNumber()).toBeCloseTo(216, 2);
      expect(result.subtotal.toNumber()).toBeCloseTo(180, 2);
      expect(result.taxTotal.toNumber()).toBeCloseTo(36, 2);
    });

    it('should set due date based on dueDays', async () => {
      const dataWithDueDays = { ...validData, dueDays: 60 };
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-0001',
        deliveryNoteId: dataWithDueDays.deliveryNoteId,
        customerId: dataWithDueDays.customerId,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        subtotal: new Decimal(180),
        taxTotal: new Decimal(36),
        discountTotal: new Decimal(0),
        grandTotal: new Decimal(216),
        outstandingAmount: new Decimal(216),
        currency: 'USD',
        paidAmount: new Decimal(0),
        notes: dataWithDueDays.notes,
        tenantId: dataWithDueDays.tenantId,
        lineItems: [{ id: 'line-1', ...dataWithDueDays.lineItems[0], totalPrice: new Decimal(216) }],
      };

      mockAxios.get.mockResolvedValue({ data: { success: true } });
      (mockPrisma.invoice.count as any).mockResolvedValue(0);
      (mockPrisma.invoice.create as any).mockResolvedValue(mockInvoice);

      const result = await service.createFromDeliveryNote(dataWithDueDays);

      expect(result.dueDate.getTime()).toBeGreaterThan(result.issueDate.getTime());
    });

    it('should continue even if registry service unavailable', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-0001',
        customerId: validData.customerId,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal: new Decimal(180),
        taxTotal: new Decimal(36),
        discountTotal: new Decimal(0),
        grandTotal: new Decimal(216),
        outstandingAmount: new Decimal(216),
        currency: 'USD',
        paidAmount: new Decimal(0),
        tenantId: validData.tenantId,
        lineItems: [],
      };

      mockAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));
      (mockPrisma.invoice.count as any).mockResolvedValue(0);
      (mockPrisma.invoice.create as any).mockResolvedValue(mockInvoice);

      const result = await service.createFromDeliveryNote(validData);

      expect(result).toBeDefined();
    });
  });

  describe('issue', () => {
    it('should issue draft invoice successfully', async () => {
      const existingInvoice = {
        id: 'inv-1',
        status: 'DRAFT',
        tenantId: 'test-tenant',
        lineItems: [],
      };

      const issuedInvoice = {
        ...existingInvoice,
        status: 'ISSUED',
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(existingInvoice);
      (mockPrisma.invoice.update as any).mockResolvedValue(issuedInvoice);

      const result = await service.issue('inv-1', 'test-tenant');

      expect(result.status).toBe('ISSUED');
      expect(mockPrisma.invoice.update).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      (mockPrisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(service.issue('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.issue('non-existent', 'test-tenant')).rejects.toThrow('Invoice not found');
    });

    it('should throw error if invoice is not in DRAFT status', async () => {
      const existingInvoice = {
        id: 'inv-1',
        status: 'ISSUED',
        tenantId: 'test-tenant',
        lineItems: [],
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(existingInvoice);

      await expect(service.issue('inv-1', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.issue('inv-1', 'test-tenant')).rejects.toThrow('Only draft invoices can be issued');
    });
  });

  describe('getById', () => {
    it('should return invoice by id and tenant', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-0001',
        tenantId: 'test-tenant',
        lineItems: [],
        payments: [],
        dunnings: [],
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(mockInvoice);

      const result = await service.getById('inv-1', 'test-tenant');

      expect(result).toEqual(mockInvoice);
      expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith({
        where: { id: 'inv-1', tenantId: 'test-tenant' },
        include: { lineItems: true, payments: true, dunnings: true },
      });
    });

    it('should return null for non-existent invoice', async () => {
      (mockPrisma.invoice.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all invoices for tenant', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-0001',
          tenantId: 'test-tenant',
          lineItems: [],
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-2024-0002',
          tenantId: 'test-tenant',
          lineItems: [],
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);

      const result = await service.getAll('test-tenant');

      expect(result).toEqual(mockInvoices);
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        include: { lineItems: true },
        orderBy: { issueDate: 'desc' },
      });
    });

    it('should filter by status when provided', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-0001',
          status: 'DRAFT',
          tenantId: 'test-tenant',
          lineItems: [],
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);

      await service.getAll('test-tenant', { status: 'DRAFT' });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant', status: 'DRAFT' },
        include: { lineItems: true },
        orderBy: { issueDate: 'desc' },
      });
    });

    it('should filter by customer when provided', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-0001',
          customerId: 'customer-123',
          tenantId: 'test-tenant',
          lineItems: [],
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);

      await service.getAll('test-tenant', { customerId: 'customer-123' });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant', customerId: 'customer-123' },
        include: { lineItems: true },
        orderBy: { issueDate: 'desc' },
      });
    });

    it('should filter by date range when provided', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-0001',
          tenantId: 'test-tenant',
          lineItems: [],
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);

      await service.getAll('test-tenant', { fromDate, toDate });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { 
          tenantId: 'test-tenant', 
          issueDate: { gte: fromDate, lte: toDate } 
        },
        include: { lineItems: true },
        orderBy: { issueDate: 'desc' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update invoice status successfully', async () => {
      const existingInvoice = {
        id: 'inv-1',
        status: 'ISSUED',
        tenantId: 'test-tenant',
        lineItems: [],
        payments: [],
      };

      const updatedInvoice = {
        ...existingInvoice,
        status: 'PAID',
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(existingInvoice);
      (mockPrisma.invoice.update as any).mockResolvedValue(updatedInvoice);

      const result = await service.updateStatus('inv-1', 'test-tenant', 'PAID' as any);

      expect(result.status).toBe('PAID');
      expect(mockPrisma.invoice.update).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      (mockPrisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(service.updateStatus('non-existent', 'test-tenant', 'PAID' as any)).rejects.toThrow(AppError);
      await expect(service.updateStatus('non-existent', 'test-tenant', 'PAID' as any)).rejects.toThrow('Invoice not found');
    });
  });

  describe('recordPayment', () => {
    it('should record payment successfully and update status to PAID', async () => {
      const existingInvoice = {
        id: 'inv-1',
        tenantId: 'test-tenant',
        grandTotal: new Decimal(100),
        paidAmount: new Decimal(0),
        outstandingAmount: new Decimal(100),
        status: 'ISSUED',
        currency: 'USD',
        lineItems: [],
        payments: [],
      };

      const mockPayment = {
        id: 'payment-1',
        invoiceId: 'inv-1',
        provider: 'STRIPE' as const,
        amount: new Decimal(100),
        currency: 'USD',
        status: 'SUCCEEDED' as const,
        processedAt: new Date(),
        tenantId: 'test-tenant',
      };

      const updatedInvoice = {
        ...existingInvoice,
        paidAmount: new Decimal(100),
        outstandingAmount: new Decimal(0),
        status: 'PAID',
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(existingInvoice);
      (mockPrisma.payment.create as any).mockResolvedValue(mockPayment);
      (mockPrisma.invoice.update as any).mockResolvedValue(updatedInvoice);

      const result = await service.recordPayment('inv-1', 'test-tenant', {
        provider: 'STRIPE',
        amount: 100,
        currency: 'USD',
        status: 'SUCCEEDED',
      });

      expect(result.payment).toBeDefined();
      expect(mockPrisma.payment.create).toHaveBeenCalled();
      expect(mockPrisma.invoice.update).toHaveBeenCalled();
    });

    it('should update status to PARTIALLY_PAID when partial payment', async () => {
      const existingInvoice = {
        id: 'inv-1',
        tenantId: 'test-tenant',
        grandTotal: new Decimal(100),
        paidAmount: new Decimal(0),
        outstandingAmount: new Decimal(100),
        status: 'ISSUED',
        currency: 'USD',
        lineItems: [],
        payments: [],
      };

      const mockPayment = {
        id: 'payment-1',
        invoiceId: 'inv-1',
        provider: 'STRIPE' as const,
        amount: new Decimal(50),
        currency: 'USD',
        status: 'SUCCEEDED' as const,
        processedAt: new Date(),
        tenantId: 'test-tenant',
      };

      const updatedInvoice = {
        ...existingInvoice,
        paidAmount: new Decimal(50),
        outstandingAmount: new Decimal(50),
        status: 'PARTIALLY_PAID',
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(existingInvoice);
      (mockPrisma.payment.create as any).mockResolvedValue(mockPayment);
      (mockPrisma.invoice.update as any).mockResolvedValue(updatedInvoice);

      const result = await service.recordPayment('inv-1', 'test-tenant', {
        provider: 'STRIPE',
        amount: 50,
        currency: 'USD',
        status: 'SUCCEEDED',
      });

      expect(result.invoice.status).toBe('PARTIALLY_PAID');
    });

    it('should throw error if invoice not found', async () => {
      (mockPrisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(
        service.recordPayment('non-existent', 'test-tenant', {
          provider: 'STRIPE',
          amount: 100,
          currency: 'USD',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('checkAndUpdateOverdue', () => {
    it('should mark overdue invoices as OVERDUE', async () => {
      const overdueInvoices = [
        {
          id: 'inv-1',
          tenantId: 'test-tenant',
          status: 'ISSUED',
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
        {
          id: 'inv-2',
          tenantId: 'test-tenant',
          status: 'PARTIALLY_PAID',
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(overdueInvoices);
      (mockPrisma.invoice.update as any).mockResolvedValue(true);

      await service.checkAndUpdateOverdue('test-tenant');

      expect(mockPrisma.invoice.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.invoice.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'inv-1' },
        data: { status: 'OVERDUE' },
      });
      expect(mockPrisma.invoice.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'inv-2' },
        data: { status: 'OVERDUE' },
      });
    });

    it('should not mark already PAID invoices as OVERDUE', async () => {
      (mockPrisma.invoice.findMany as any).mockResolvedValue([]);

      await service.checkAndUpdateOverdue('test-tenant');

      expect(mockPrisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel invoice successfully', async () => {
      const existingInvoice = {
        id: 'inv-1',
        status: 'DRAFT',
        tenantId: 'test-tenant',
        lineItems: [],
      };

      const canceledInvoice = {
        ...existingInvoice,
        status: 'CANCELED',
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(existingInvoice);
      (mockPrisma.invoice.update as any).mockResolvedValue(canceledInvoice);

      const result = await service.cancel('inv-1', 'test-tenant');

      expect(result.status).toBe('CANCELED');
      expect(mockPrisma.invoice.update).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      (mockPrisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(service.cancel('non-existent', 'test-tenant')).rejects.toThrow(AppError);
    });

    it('should throw error if invoice is PAID', async () => {
      const existingInvoice = {
        id: 'inv-1',
        status: 'PAID',
        tenantId: 'test-tenant',
        lineItems: [],
      };

      (mockPrisma.invoice.findFirst as any).mockResolvedValue(existingInvoice);

      await expect(service.cancel('inv-1', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.cancel('inv-1', 'test-tenant')).rejects.toThrow('Cannot cancel a paid invoice');
    });
  });

  describe('calculatePaymentStatus', () => {
    it('should return PAID when total payments equal grand total', async () => {
      const mockInvoice = {
        id: 'inv-1',
        grandTotal: new Decimal(100),
        payments: [
          { amount: new Decimal(100), status: 'SUCCEEDED' },
        ],
      };

      (mockPrisma.invoice.findUnique as any).mockResolvedValue(mockInvoice);

      const status = await service.calculatePaymentStatus('inv-1');

      expect(status).toBe('PAID');
    });

    it('should return PARTIALLY_PAID when partial payments made', async () => {
      const mockInvoice = {
        id: 'inv-1',
        grandTotal: new Decimal(100),
        payments: [
          { amount: new Decimal(50), status: 'SUCCEEDED' },
        ],
      };

      (mockPrisma.invoice.findUnique as any).mockResolvedValue(mockInvoice);

      const status = await service.calculatePaymentStatus('inv-1');

      expect(status).toBe('PARTIALLY_PAID');
    });

    it('should return ISSUED when no payments made', async () => {
      const mockInvoice = {
        id: 'inv-1',
        grandTotal: new Decimal(100),
        payments: [],
      };

      (mockPrisma.invoice.findUnique as any).mockResolvedValue(mockInvoice);

      const status = await service.calculatePaymentStatus('inv-1');

      expect(status).toBe('ISSUED');
    });

    it('should ignore failed payments', async () => {
      const mockInvoice = {
        id: 'inv-1',
        grandTotal: new Decimal(100),
        payments: [
          { amount: new Decimal(50), status: 'FAILED' },
        ],
      };

      (mockPrisma.invoice.findUnique as any).mockResolvedValue(mockInvoice);

      const status = await service.calculatePaymentStatus('inv-1');

      expect(status).toBe('ISSUED');
    });

    it('should throw error if invoice not found', async () => {
      (mockPrisma.invoice.findUnique as any).mockResolvedValue(null);

      await expect(service.calculatePaymentStatus('non-existent')).rejects.toThrow(AppError);
    });
  });
});


