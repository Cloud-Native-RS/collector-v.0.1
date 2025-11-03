import { z } from 'zod';
import { Request } from 'express';

// User roles
export enum UserRole {
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  VIEWER = 'VIEWER',
}

// JWT payload
export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
}

// Request with user context
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Event types
export enum EventType {
  TASK_COMPLETED = 'task.completed',
  TASK_BLOCKED = 'task.blocked',
  MILESTONE_ACHIEVED = 'milestone.achieved',
  MILESTONE_DELAYED = 'milestone.delayed',
  PROJECT_COMPLETED = 'project.completed',
  PROJECT_STATUS_CHANGED = 'project.status.changed',
}

// Event payloads
export interface TaskCompletedEvent {
  taskId: string;
  projectId: string;
  assignedTo: string;
  completedAt: Date;
  tenantId: string;
}

export interface MilestoneAchievedEvent {
  milestoneId: string;
  projectId: string;
  achievedAt: Date;
  tenantId: string;
}

export interface ProjectStatusChangedEvent {
  projectId: string;
  oldStatus: string;
  newStatus: string;
  tenantId: string;
}

// Validation schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreateMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
});

export const UpdateMilestoneSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'ACHIEVED', 'DELAYED', 'CANCELLED']).optional(),
});

export const CreateTaskSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
});

export const UpdateTaskSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
});

export const CreateResourceSchema = z.object({
  type: z.enum(['EMPLOYEE', 'EQUIPMENT']),
  name: z.string().min(1).max(255),
  userId: z.string().optional(),
  availabilitySchedule: z.string().optional(),
});

export const AllocateResourceSchema = z.object({
  taskId: z.string().uuid(),
  resourceId: z.string().uuid(),
  allocatedHours: z.number().positive(),
});

