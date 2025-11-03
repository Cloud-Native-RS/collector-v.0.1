import axios from 'axios';

/**
 * Event Service
 * Handles event-driven communication with other microservices
 */
export class EventService {
  private eventWebhookUrl: string | null = null;

  constructor() {
    this.eventWebhookUrl = process.env.EVENT_WEBHOOK_URL || null;
  }

  /**
   * Emit employee.hired event
   */
  async emitEmployeeHired(employeeId: string, employeeData: any): Promise<void> {
    await this.publishEvent('employee.hired', {
      employeeId,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      jobTitle: employeeData.jobTitle,
      department: employeeData.department,
      startDate: employeeData.startDate,
      tenantId: employeeData.tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit employee.left event
   */
  async emitEmployeeLeft(employeeId: string, employeeData: any): Promise<void> {
    await this.publishEvent('employee.left', {
      employeeId,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      endDate: employeeData.endDate,
      tenantId: employeeData.tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit payroll.processed event
   */
  async emitPayrollProcessed(payrollId: string, payrollData: any): Promise<void> {
    await this.publishEvent('payroll.processed', {
      payrollId,
      employeeId: payrollData.employeeId,
      netPay: payrollData.netPay,
      payPeriodStart: payrollData.payPeriodStart,
      payPeriodEnd: payrollData.payPeriodEnd,
      status: payrollData.status,
      tenantId: payrollData.tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit attendance.missed event
   */
  async emitAttendanceMissed(employeeId: string, attendanceData: any): Promise<void> {
    await this.publishEvent('attendance.missed', {
      employeeId,
      date: attendanceData.date,
      status: attendanceData.status,
      tenantId: attendanceData.tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generic event publisher
   */
  private async publishEvent(eventType: string, payload: any): Promise<void> {
    // If webhook URL is configured, send HTTP event
    if (this.eventWebhookUrl) {
      try {
        await axios.post(this.eventWebhookUrl, {
          eventType,
          payload,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });
        console.log(`[Event] Published: ${eventType}`);
      } catch (error) {
        console.error(`[Event] Failed to publish ${eventType}:`, error);
        // Don't throw - event failures shouldn't break main flow
      }
    } else {
      // Stub for message queue integration (Kafka/RabbitMQ/NATS)
      console.log(`[Event] ${eventType}:`, JSON.stringify(payload));
      
      // Example implementation would be:
      // await messageQueue.publish('hr-events', {
      //   eventType,
      //   ...payload,
      // });
    }
  }
}

