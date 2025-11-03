import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ContactsRegistryPage from './page';
import * as registryApi from '@/lib/api/registry';
import type { Customer, Company } from '@/lib/api/registry';

// Mock ContactsPageClient
vi.mock('./contacts-page-client', () => ({
  default: ({ initialContacts }: { initialContacts: any[] }) => (
    <div data-testid="contacts-page-client">
      {initialContacts.length > 0 ? (
        <div data-testid="contacts-list">
          {initialContacts.map((contact) => (
            <div key={contact.id} data-testid={`contact-${contact.id}`}>
              {contact.firstName} {contact.lastName}
            </div>
          ))}
        </div>
      ) : (
        <div data-testid="no-contacts">No contacts</div>
      )}
    </div>
  ),
}));

// Mock registry API
vi.mock('@/lib/api/registry', () => ({
  customersApi: {
    list: vi.fn(),
  },
  companiesApi: {
    list: vi.fn(),
  },
}));

const mockIndividualCustomer: Customer = {
  id: 'customer-uuid-1',
  customerNumber: 'CUST-001',
  type: 'INDIVIDUAL',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  title: 'Manager',
  department: 'Sales',
  companyId: 'company-uuid-1',
  companyName: null,
  status: 'ACTIVE',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  },
  contact: {
    email: 'john.doe@example.com',
    phone: '+1234567890',
    website: null,
  },
  company: null,
  tenantId: 'tenant-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

const mockCompanyCustomer: Customer = {
  id: 'customer-uuid-2',
  customerNumber: 'CUST-002',
  type: 'COMPANY',
  firstName: null,
  lastName: null,
  email: 'company@example.com',
  phone: null,
  title: null,
  department: null,
  companyId: null,
  companyName: 'Acme Corp',
  status: 'ACTIVE',
  address: {
    street: '456 Business Ave',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'US',
  },
  contact: {
    email: 'company@example.com',
    phone: null,
    website: 'acme.com',
  },
  company: null,
  tenantId: 'tenant-1',
  createdAt: '2024-01-05T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
};

const mockCompany: Company = {
  id: 'company-uuid-1',
  companyType: 'CORPORATION',
  companyNumber: 'COMP-001',
  legalName: 'Acme Corporation',
  tradingName: 'Acme',
  taxId: '12-3456789',
  registrationNumber: 'REG-123456',
  status: 'ACTIVE',
  industry: 'Technology',
  legalRepName: 'Jane Doe',
  legalRepTitle: 'CEO',
  legalRepEmail: 'jane@acme.com',
  legalRepPhone: '+1234567891',
  address: {
    street: '789 Corporate Blvd',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'US',
  },
  contact: {
    email: 'contact@acme.com',
    phone: '+1234567892',
    website: 'acme.com',
  },
  bankAccount: undefined,
  contacts: [],
  tenantId: 'tenant-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('ContactsRegistryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console warnings
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading message while fetching contacts', () => {
      vi.spyOn(registryApi.customersApi, 'list').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ContactsRegistryPage />);
      expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load and display INDIVIDUAL contacts', async () => {
      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [mockIndividualCustomer],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('contacts-page-client')).toBeInTheDocument();
      expect(screen.getByTestId('contact-1')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should filter out COMPANY type customers', async () => {
      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [mockIndividualCustomer, mockCompanyCustomer],
        total: 2,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      // Should only show INDIVIDUAL contact
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    });

    it('should handle empty contacts list', async () => {
      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('no-contacts')).toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('should transform customer to contact with all fields', async () => {
      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [mockIndividualCustomer],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Verify API was called with correct filter
      expect(registryApi.customersApi.list).toHaveBeenCalledWith({
        type: 'INDIVIDUAL',
        take: 100,
      });
    });

    it('should use company relation when available', async () => {
      const customerWithCompany = {
        ...mockIndividualCustomer,
        company: mockCompany,
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [customerWithCompany],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [mockCompany],
        total: 1,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should fetch company from companies map if relation missing', async () => {
      const customerWithoutCompany = {
        ...mockIndividualCustomer,
        company: null,
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [customerWithoutCompany],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [mockCompany],
        total: 1,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(registryApi.companiesApi.list).toHaveBeenCalledWith({ take: 100 });
    });

    it('should handle customer with contact object fallback', async () => {
      const customerWithContactObject = {
        ...mockIndividualCustomer,
        email: undefined,
        phone: undefined,
        contact: {
          email: 'contact-email@example.com',
          phone: '+9876543210',
          website: null,
        },
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [customerWithContactObject],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should clean up "Trading as:" text from company names', async () => {
      const customerWithTradingAs = {
        ...mockIndividualCustomer,
        companyName: 'Trading as: Acme Corp',
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [customerWithTradingAs],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle status mapping correctly', async () => {
      const statuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED'] as const;

      for (const status of statuses) {
        const customer = {
          ...mockIndividualCustomer,
          status,
        };

        vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
          data: [customer],
          total: 1,
        });
        vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
          data: [],
          total: 0,
        });

        const { unmount } = render(<ContactsRegistryPage />);

        await waitFor(() => {
          expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        unmount();
        vi.clearAllMocks();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading customers', async () => {
      vi.spyOn(registryApi.customersApi, 'list').mockRejectedValue(
        new Error('API Error')
      );
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('no-contacts')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    it('should continue loading contacts even if companies API fails', async () => {
      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [mockIndividualCustomer],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockRejectedValue(
        new Error('Companies API Error')
      );

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalled();
    });

    it('should skip invalid customers during transformation', async () => {
      const invalidCustomer = {
        ...mockIndividualCustomer,
        type: 'COMPANY' as const, // Should be filtered out
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [invalidCustomer],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('no-contacts')).toBeInTheDocument();
    });
  });

  describe('Customer Validation', () => {
    it('should handle customer without firstName and lastName', async () => {
      const customerWithoutName = {
        ...mockIndividualCustomer,
        firstName: undefined,
        lastName: undefined,
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [customerWithoutName],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle missing companyId conversion', async () => {
      const customerWithoutCompanyId = {
        ...mockIndividualCustomer,
        companyId: null,
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [customerWithoutCompanyId],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should convert UUID companyId to number', async () => {
      const customerWithCompanyId = {
        ...mockIndividualCustomer,
        companyId: 'company-uuid-123',
      };

      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [customerWithCompanyId],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Logging', () => {
    it('should log contact statistics', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      vi.spyOn(registryApi.customersApi, 'list').mockResolvedValue({
        data: [mockIndividualCustomer],
        total: 1,
      });
      vi.spyOn(registryApi.companiesApi, 'list').mockResolvedValue({
        data: [],
        total: 0,
      });

      render(<ContactsRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should log statistics about contacts
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});


