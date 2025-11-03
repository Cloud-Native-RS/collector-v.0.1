import { PrismaClient, Lead } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { LeadService } from './lead.service';
import { RegistryClient, CreateCustomerRequest } from '../integrations/registry.client';

export class ConversionService {
  private registryClient: RegistryClient;
  private leadService: LeadService;

  constructor(
    private prisma: PrismaClient,
    registryServiceUrl?: string
  ) {
    this.registryClient = new RegistryClient(registryServiceUrl);
    this.leadService = new LeadService(prisma);
  }

  /**
   * Convert a lead to a customer in the Registry Service
   */
  async convertLeadToCustomer(
    leadId: string,
    tenantId: string,
    authToken?: string,
    options?: {
      address?: {
        street: string;
        city: string;
        state?: string;
        zipCode: string;
        country: string;
      };
      taxId?: string;
      registrationNumber?: string;
    }
  ): Promise<{ lead: Lead; customerId: string; customerNumber: string }> {
    // Get the lead
    const lead = await this.leadService.getById(leadId, tenantId);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (lead.convertedToCustomerId) {
      throw new AppError('Lead already converted to customer', 400);
    }

    // Determine customer type
    const isCompany = !!lead.company;
    const customerType: 'INDIVIDUAL' | 'COMPANY' = isCompany ? 'COMPANY' : 'INDIVIDUAL';

    // Prepare customer data
    const customerData: CreateCustomerRequest = {
      type: customerType,
      email: lead.email,
      phone: lead.phone || undefined,
      taxId: options?.taxId || lead.companyTaxId || `TAX-${Date.now()}`, // Generate temporary tax ID if not provided
      registrationNumber: options?.registrationNumber || lead.companyRegistrationNumber || undefined,
      address: options?.address || {
        street: lead.companyAddress || 'Unknown',
        city: 'Unknown',
        zipCode: '00000',
        country: 'US',
      },
      contact: {
        email: lead.email,
        phone: lead.phone || undefined,
        website: lead.companyWebsite || undefined,
      },
    };

    // Add company or individual specific fields
    if (customerType === 'COMPANY') {
      customerData.companyName = lead.company || lead.tradingName || lead.name;
      customerData.bankAccount = lead.companyTaxId ? undefined : undefined; // Optional bank account
    } else {
      // Split name into first and last name
      const nameParts = lead.name.split(' ');
      customerData.firstName = nameParts[0] || lead.name;
      customerData.lastName = nameParts.slice(1).join(' ') || '';
    }

    // Set authentication and tenant headers
    if (authToken) {
      this.registryClient.setAuthToken(authToken);
    }
    this.registryClient.setTenantId(tenantId);

    try {
      // Create customer in Registry Service
      const response = await this.registryClient.createCustomer(customerData, authToken, tenantId);

      if (!response.success || !response.data) {
        throw new AppError('Failed to create customer in registry service', 500);
      }

      const customerId = response.data.id;
      const customerNumber = response.data.customerNumber;

      // Mark lead as converted
      const updatedLead = await this.leadService.markAsConverted(leadId, tenantId, customerId);

      return {
        lead: updatedLead,
        customerId,
        customerNumber,
      };
    } catch (error: any) {
      // If registry service call fails, throw a meaningful error
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        error.message || 'Failed to convert lead to customer',
        500
      );
    }
  }
}

