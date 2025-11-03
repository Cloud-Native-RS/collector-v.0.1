import axios, { AxiosInstance } from 'axios';

/**
 * Integration Service
 * Handles integration with other microservices (Project Management, Accounting, etc.)
 */
export class IntegrationService {
  private projectManagementClient: AxiosInstance | null = null;
  private accountingClient: AxiosInstance | null = null;

  constructor() {
    // Project Management Service client
    const pmUrl = process.env.PROJECT_MANAGEMENT_API_URL;
    const pmApiKey = process.env.PROJECT_MANAGEMENT_API_KEY;
    
    if (pmUrl && pmApiKey) {
      this.projectManagementClient = axios.create({
        baseURL: pmUrl,
        headers: {
          'Authorization': `Bearer ${pmApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    }

    // Accounting/Payroll Service client
    const accountingUrl = process.env.ACCOUNTING_API_URL;
    const accountingApiKey = process.env.ACCOUNTING_API_KEY;
    
    if (accountingUrl && accountingApiKey) {
      this.accountingClient = axios.create({
        baseURL: accountingUrl,
        headers: {
          'Authorization': `Bearer ${accountingApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    }
  }

  /**
   * Get employee project allocations from Project Management service
   */
  async getEmployeeProjects(employeeId: string, tenantId: string): Promise<any[]> {
    if (!this.projectManagementClient) {
      console.warn('Project Management integration not configured');
      return [];
    }

    try {
      const response = await this.projectManagementClient.get(`/employees/${employeeId}/projects`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch projects for employee ${employeeId}:`, error);
      return [];
    }
  }

  /**
   * Assign employee to project in Project Management service
   */
  async assignEmployeeToProject(employeeId: string, projectId: string, tenantId: string): Promise<void> {
    if (!this.projectManagementClient) {
      console.warn('Project Management integration not configured');
      return;
    }

    try {
      await this.projectManagementClient.post(`/employees/${employeeId}/projects`, {
        projectId,
      }, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
    } catch (error) {
      console.error(`Failed to assign employee ${employeeId} to project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Export payroll data to Accounting/Invoices service
   */
  async exportPayrollToAccounting(payrollData: any): Promise<void> {
    if (!this.accountingClient) {
      console.warn('Accounting integration not configured, skipping export');
      return;
    }

    try {
      await this.accountingClient.post('/payroll/import', {
        payrollId: payrollData.id,
        employeeId: payrollData.employeeId,
        netPay: payrollData.netPay.toString(),
        payPeriodStart: payrollData.payPeriodStart,
        payPeriodEnd: payrollData.payPeriodEnd,
        salaryBase: payrollData.salaryBase.toString(),
        bonuses: payrollData.bonuses.toString(),
        deductions: payrollData.deductions.toString(),
        taxes: payrollData.taxes.toString(),
      });
      console.log(`Exported payroll ${payrollData.id} to accounting service`);
    } catch (error) {
      console.error('Failed to export payroll to accounting:', error);
      // Don't throw - integration failures shouldn't break the main flow
    }
  }

  /**
   * Send notification via webhook
   */
  async sendNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }
}

