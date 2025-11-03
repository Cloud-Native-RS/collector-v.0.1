import { z } from 'zod';

// Lead validation schemas
export const leadCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  companyType: z.string().optional(),
  tradingName: z.string().optional(),
  companyWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
  companyIndustry: z.string().optional(),
  companySize: z.string().optional(),
  companyAddress: z.string().optional(),
  companyTaxId: z.string().optional(),
  companyRegistrationNumber: z.string().optional(),
  legalRepName: z.string().optional(),
  legalRepTitle: z.string().optional(),
  legalRepEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  legalRepPhone: z.string().optional(),
  source: z.enum(['WEBSITE', 'SOCIAL', 'EMAIL', 'CALL', 'REFERRAL', 'OTHER']).default('WEBSITE'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST']).default('NEW'),
  value: z.number().min(0).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  tenantId: z.string().min(1),
});

export const leadUpdateSchema = leadCreateSchema.partial().omit({ tenantId: true });

// Task validation schemas
const taskCreateSchemaBase = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'FOLLOW_UP']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  assignedTo: z.string().optional(),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  tenantId: z.string().min(1),
});

export const taskCreateSchema = taskCreateSchemaBase.refine(
  (data) => data.leadId || data.dealId,
  {
    message: 'Task must be associated with either a lead or a deal',
    path: ['leadId'],
  }
);

export const taskUpdateSchema = taskCreateSchemaBase.partial().omit({ tenantId: true });

// Deal validation schemas
export const dealCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  value: z.number().min(0).default(0),
  probability: z.number().min(0).max(100).default(0),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('LEAD'),
  expectedCloseDate: z.string().datetime().optional().or(z.date().optional()),
  customerId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  assignedTo: z.string().optional(),
  tenantId: z.string().min(1),
});

export const dealUpdateSchema = dealCreateSchema.partial().omit({ tenantId: true });

export const dealStageUpdateSchema = z.object({
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  lostReason: z.string().optional(),
});

// Activity validation schemas
const activityCreateSchemaBase = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  notes: z.string().optional(),
  duration: z.number().min(0).optional(), // Duration in minutes
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  userId: z.string().optional(),
  tenantId: z.string().min(1),
});

export const activityCreateSchema = activityCreateSchemaBase.refine(
  (data) => data.leadId || data.dealId || data.taskId,
  {
    message: 'Activity must be associated with a lead, deal, or task',
    path: ['leadId'],
  }
);

export const activityUpdateSchema = activityCreateSchemaBase.partial().omit({ tenantId: true });

// Query/Filter schemas
export const leadQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  source: z.enum(['WEBSITE', 'SOCIAL', 'EMAIL', 'CALL', 'REFERRAL', 'OTHER']).optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
});

export const taskQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  assignedTo: z.string().optional(),
});

export const dealQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
});

export const activityQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE']).optional(),
});

