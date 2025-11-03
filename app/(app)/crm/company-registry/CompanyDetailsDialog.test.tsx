import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyDetailsDialog from './CompanyDetailsDialog';
import { type Company } from './types';

const mockCompany: Company = {
  id: 1,
  originalId: 'company-uuid-1',
  companyNumber: 'COMP-001',
  legalName: 'Acme Corporation',
  tradingName: 'Acme',
  companyType: 'Corporation',
  taxId: '12-3456789',
  registrationNumber: 'REG-123456',
  status: 'active',
  industry: 'Technology',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  },
  contactInfo: {
    email: 'contact@acme.com',
    phone: '+1234567890',
    website: 'acme.com',
  },
  bankAccount: {
    bankName: 'First National Bank',
    accountNumber: '1234567890',
    routingNumber: '987654321',
    iban: 'GB82WEST12345698765432',
    swift: 'BARCGB22',
  },
  legalRepresentative: {
    name: 'John Doe',
    title: 'CEO',
    email: 'john.doe@acme.com',
    phone: '+1234567891',
  },
  contactPersons: [],
  tenantId: 'tenant-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

const mockCompanyMinimal: Company = {
  id: 2,
  companyNumber: 'COMP-002',
  legalName: 'Minimal Corp',
  tradingName: '',
  companyType: 'Limited Liability Company',
  taxId: '98-7654321',
  registrationNumber: 'REG-654321',
  status: 'pending',
  industry: '',
  address: {
    street: '456 Street',
    city: 'Los Angeles',
    state: null,
    zipCode: '90001',
    country: 'CA',
  },
  contactInfo: {
    email: 'info@minimal.com',
    phone: '',
    website: null,
  },
  bankAccount: {
    bankName: '',
    accountNumber: '',
    routingNumber: null,
    iban: null,
    swift: null,
  },
  legalRepresentative: {
    name: '',
    title: '',
    email: '',
    phone: '',
  },
  contactPersons: undefined,
  tenantId: 'tenant-1',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
};

const mockCompanyWithContactPersons: Company = {
  ...mockCompany,
  id: 3,
  contactPersons: [
    {
      id: 'cp-1',
      firstName: 'Jane',
      lastName: 'Smith',
      title: 'Sales Manager',
      department: 'Sales',
      email: 'jane.smith@acme.com',
      phone: '+1234567892',
    },
    {
      id: 'cp-2',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@acme.com',
    },
  ],
};

describe('CompanyDetailsDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    company: mockCompany,
    onEdit: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when company is null', () => {
      const { container } = render(
        <CompanyDetailsDialog {...defaultProps} company={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render dialog with company legal name', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      const companyNames = screen.getAllByText('Acme Corporation');
      expect(companyNames.length).toBeGreaterThan(0);
    });

    it('should render all tabs', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Bank Info')).toBeInTheDocument();
      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('should display active badge for active status', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display pending badge for pending status', () => {
      render(<CompanyDetailsDialog {...defaultProps} company={mockCompanyMinimal} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display inactive badge for inactive status', () => {
      const inactiveCompany = { ...mockCompany, status: 'inactive' as const };
      render(<CompanyDetailsDialog {...defaultProps} company={inactiveCompany} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should display liquidated badge for liquidated status', () => {
      const liquidatedCompany = { ...mockCompany, status: 'liquidated' as const };
      render(<CompanyDetailsDialog {...defaultProps} company={liquidatedCompany} />);
      expect(screen.getByText('Liquidated')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display legal information section', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      expect(screen.getByText('Legal Information')).toBeInTheDocument();
      const companyNames = screen.getAllByText('Acme Corporation');
      expect(companyNames.length).toBeGreaterThan(0);
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('12-3456789')).toBeInTheDocument();
    });

    it('should display address section', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('10001')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
    });

    it('should display legal representative section', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      expect(screen.getByText('Legal Representative')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('CEO')).toBeInTheDocument();
      expect(screen.getByText('john.doe@acme.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567891')).toBeInTheDocument();
    });

    it('should display contact information section', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('should not display optional fields when absent', () => {
      render(<CompanyDetailsDialog {...defaultProps} company={mockCompanyMinimal} />);
      
      expect(screen.queryByText('Trading Name')).not.toBeInTheDocument();
      expect(screen.queryByText('Industry')).not.toBeInTheDocument();
    });
  });

  describe('Contacts Tab', () => {
    it('should show contact persons count badge', () => {
      render(<CompanyDetailsDialog {...defaultProps} company={mockCompanyWithContactPersons} />);
      
      const contactsTab = screen.getByText(/Contacts/).closest('button');
      expect(contactsTab).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display contact persons when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<CompanyDetailsDialog {...defaultProps} company={mockCompanyWithContactPersons} />);
      
      const contactsTab = screen.getByText(/Contacts/).closest('button');
      if (contactsTab) {
        await user.click(contactsTab);
        
        await waitFor(() => {
          expect(screen.getByText('Jane Smith')).toBeInTheDocument();
          expect(screen.getByText('Sales Manager')).toBeInTheDocument();
          expect(screen.getByText('Sales')).toBeInTheDocument();
          expect(screen.getByText('jane.smith@acme.com')).toBeInTheDocument();
        });
      }
    });

    it('should show empty state when no contact persons', async () => {
      const user = userEvent.setup();
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      const contactsTab = screen.getByText(/Contacts/).closest('button');
      if (contactsTab) {
        await user.click(contactsTab);
        
        await waitFor(() => {
          expect(screen.getByText(/No contact persons added yet/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Bank Info Tab', () => {
    it('should display bank account information when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      const bankTab = screen.getByText('Bank Info').closest('button');
      if (bankTab) {
        await user.click(bankTab);
        
        await waitFor(() => {
          expect(screen.getByText('Bank Account Details')).toBeInTheDocument();
          expect(screen.getByText('First National Bank')).toBeInTheDocument();
          expect(screen.getByText('1234567890')).toBeInTheDocument();
          expect(screen.getByText('GB82WEST12345698765432')).toBeInTheDocument();
        });
      }
    });

    it('should show empty state when no bank info', async () => {
      const user = userEvent.setup();
      render(<CompanyDetailsDialog {...defaultProps} company={mockCompanyMinimal} />);
      
      const bankTab = screen.getByText('Bank Info').closest('button');
      if (bankTab) {
        await user.click(bankTab);
        
        await waitFor(() => {
          expect(screen.getByText(/No bank account information available/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Metadata Tab', () => {
    it('should display audit information when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      const metadataTab = screen.getByText('Metadata').closest('button');
      if (metadataTab) {
        await user.click(metadataTab);
        
        await waitFor(() => {
          expect(screen.getByText('Audit Information')).toBeInTheDocument();
          expect(screen.getByText(/Jan 1, 2024/i)).toBeInTheDocument();
          expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
        });
      }
    });

    it('should display company number and tenant ID', async () => {
      const user = userEvent.setup();
      render(<CompanyDetailsDialog {...defaultProps} />);
      
      const metadataTab = screen.getByText('Metadata').closest('button');
      if (metadataTab) {
        await user.click(metadataTab);
        
        await waitFor(() => {
          expect(screen.getByText('COMP-001')).toBeInTheDocument();
          expect(screen.getByText('tenant-1')).toBeInTheDocument();
        });
      }
    });
  });


  describe('Action Buttons', () => {
    it('should call onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<CompanyDetailsDialog {...defaultProps} onOpenChange={onOpenChange} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should display edit button when onEdit is provided', () => {
      const onEdit = vi.fn();
      render(<CompanyDetailsDialog {...defaultProps} onEdit={onEdit} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should not display edit button when onEdit is not provided', () => {
      render(<CompanyDetailsDialog {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('should call onEdit with company when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<CompanyDetailsDialog {...defaultProps} onEdit={onEdit} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith(mockCompany);
    });
  });

  describe('Edge Cases', () => {
    it('should handle company with all optional fields empty', async () => {
      const user = userEvent.setup();
      render(<CompanyDetailsDialog {...defaultProps} company={mockCompanyMinimal} />);
      
      const companyNames = screen.getAllByText('Minimal Corp');
      expect(companyNames.length).toBeGreaterThan(0);
      
      const overviewTab = screen.getByText('Overview').closest('button');
      if (overviewTab) {
        await user.click(overviewTab);
        
        await waitFor(() => {
          expect(screen.queryByText('Legal Representative')).not.toBeInTheDocument();
        });
      }
    });

    it('should handle website URL formatting correctly', () => {
      const testCases = [
        { input: 'example.com', expected: 'https://example.com' },
        { input: 'https://example.com', expected: 'https://example.com' },
        { input: 'http://example.com', expected: 'http://example.com' },
      ];

      testCases.forEach(({ input, expected }) => {
        const company = {
          ...mockCompany,
          contactInfo: {
            ...mockCompany.contactInfo,
            website: input,
          },
        };

        const { unmount } = render(
          <CompanyDetailsDialog {...defaultProps} company={company} />
        );

        const websiteLink = screen.getByText(input).closest('a');
        expect(websiteLink).toHaveAttribute('href', expected);
        unmount();
      });
    });

    it('should render with different company statuses', () => {
      const statuses = ['active', 'inactive', 'pending', 'liquidated'] as const;

      statuses.forEach((status) => {
        const company = {
          ...mockCompany,
          status,
        };

        const { unmount } = render(
          <CompanyDetailsDialog {...defaultProps} company={company} />
        );

        const companyNames = screen.getAllByText('Acme Corporation');
        expect(companyNames.length).toBeGreaterThan(0);
        expect(screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))).toBeInTheDocument();
        unmount();
      });
    });
  });
});

