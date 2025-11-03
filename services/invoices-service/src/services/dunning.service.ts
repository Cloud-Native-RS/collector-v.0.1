import { PrismaClient, Dunning, DunningStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { getDaysOverdue } from '../utils/calculations';

export class DunningService {
  constructor(private prisma: PrismaClient) {}

  async createDunning(invoiceId: string, tenantId: string): Promise<Dunning> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { dunnings: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status !== 'OVERDUE') {
      throw new AppError('Invoice is not overdue', 400);
    }

    // Find the next reminder level
    const existingDunnings = invoice.dunnings.filter(d => d.status !== 'CANCELLED');
    const nextLevel = existingDunnings.length + 1;

    // Calculate due date
    const dueDate = invoice.dueDate;

    // Create dunning record
    const dunning = await this.prisma.dunning.create({
      data: {
        invoiceId,
        reminderLevel: nextLevel,
        dueDate,
        status: 'PENDING',
        tenantId,
      },
    });

    // Emit dunning.created event
    // TODO: Emit event via NATS

    return dunning;
  }

  async sendDunning(dunningId: string, tenantId: string): Promise<Dunning> {
    const dunning = await this.prisma.dunning.findFirst({
      where: { id: dunningId, tenantId },
      include: { invoice: true },
    });

    if (!dunning) {
      throw new AppError('Dunning not found', 404);
    }

    if (dunning.status !== 'PENDING') {
      throw new AppError('Dunning has already been sent', 400);
    }

    // TODO: Send email notification
    // For now, just update status
    
    const updated = await this.prisma.dunning.update({
      where: { id: dunningId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        templateUsed: 'overdue-reminder',
        // emailSent: ... (get from customer data)
      },
    });

    // Emit dunning.sent event
    // TODO: Emit event via NATS

    return updated;
  }

  async processOverdueInvoices(tenantId: string): Promise<Dunning[]> {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'OVERDUE',
      },
      include: { dunnings: true },
    });

    const dunningsCreated: Dunning[] = [];

    for (const invoice of overdueInvoices) {
      const daysOverdue = getDaysOverdue(invoice.dueDate);

      // Create dunning based on overdue days
      const reminderDays = process.env.DUNNING_REMINDER_DAYS?.split(',').map(d => parseInt(d)) || [30, 45, 60];
      
      const existingLevels = invoice.dunnings.filter(d => d.status !== 'CANCELLED').length;
      
      if (reminderDays.includes(daysOverdue) && existingLevels < reminderDays.length) {
        const dunning = await this.createDunning(invoice.id, tenantId);
        dunningsCreated.push(dunning);

        // Auto-send if enabled
        if (process.env.AUTO_SEND_DUNNING === 'true') {
          await this.sendDunning(dunning.id, tenantId);
        }
      }
    }

    return dunningsCreated;
  }

  async getAll(tenantId: string): Promise<Dunning[]> {
    return this.prisma.dunning.findMany({
      where: { tenantId },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async completeDunning(dunningId: string, tenantId: string): Promise<Dunning> {
    const dunning = await this.prisma.dunning.findFirst({
      where: { id: dunningId, tenantId },
    });

    if (!dunning) {
      throw new AppError('Dunning not found', 404);
    }

    return this.prisma.dunning.update({
      where: { id: dunningId },
      data: { status: 'COMPLETED' },
    });
  }
}
