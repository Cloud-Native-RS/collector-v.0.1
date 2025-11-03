import EventEmitter from 'events';
import { logger } from '../utils/logger';
import { 
  EventType, 
  TaskCompletedEvent, 
  MilestoneAchievedEvent, 
  ProjectStatusChangedEvent 
} from '../types';

export class EventEmitterService extends EventEmitter {
  emitTaskCompleted(event: TaskCompletedEvent) {
    logger.info('Event emitted: task.completed', event);
    this.emit(EventType.TASK_COMPLETED, event);
  }

  emitTaskBlocked(taskId: string, tenantId: string) {
    logger.info('Event emitted: task.blocked', { taskId, tenantId });
    this.emit(EventType.TASK_BLOCKED, { taskId, tenantId });
  }

  emitMilestoneAchieved(event: MilestoneAchievedEvent) {
    logger.info('Event emitted: milestone.achieved', event);
    this.emit(EventType.MILESTONE_ACHIEVED, event);
  }

  emitMilestoneDelayed(milestoneId: string, projectId: string, tenantId: string) {
    logger.info('Event emitted: milestone.delayed', { milestoneId, projectId, tenantId });
    this.emit(EventType.MILESTONE_DELAYED, { milestoneId, projectId, tenantId });
  }

  emitProjectCompleted(projectId: string, tenantId: string) {
    logger.info('Event emitted: project.completed', { projectId, tenantId });
    this.emit(EventType.PROJECT_COMPLETED, { projectId, tenantId });
  }

  emitProjectStatusChanged(event: ProjectStatusChangedEvent) {
    logger.info('Event emitted: project.status.changed', event);
    this.emit(EventType.PROJECT_STATUS_CHANGED, event);
  }
}

export const eventEmitter = new EventEmitterService();

// Setup event listeners for notifications (example)
eventEmitter.on(EventType.TASK_COMPLETED, (event: TaskCompletedEvent) => {
  // TODO: Send notification to assigned user
  // TODO: Update project progress
});

eventEmitter.on(EventType.MILESTONE_ACHIEVED, (event: MilestoneAchievedEvent) => {
  // TODO: Notify project manager
  // TODO: Trigger billing if milestone is billable
});

eventEmitter.on(EventType.PROJECT_COMPLETED, ({ projectId, tenantId }) => {
  // TODO: Notify all stakeholders
  // TODO: Archive project
});

