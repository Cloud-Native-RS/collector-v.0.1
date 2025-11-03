import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewCompanyDialog from './view-company-dialog';
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
  status: 'active',
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

describe('ViewCompanyDialog', () => {
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
        <ViewCompanyDialog {...defaultProps} company={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render dialog with company legal name', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    it('should render all company information sections', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Legal Representative')).toBeInTheDocument();
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });
  });

  describe('Basic Information', () => {
    it('should display legal name', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    it('should display industry when present', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    it('should not display industry when absent', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyMinimal} />);
      expect(screen.queryByText('Industry')).not.toBeInTheDocument();
    });

    it('should display tax ID', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.getByText('12-3456789')).toBeInTheDocument();
    });

    it('should display registration number', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.getByText('REG-123456')).toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('should display contact information when no contact persons exist', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      
      expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('should display website in contact section when no contact persons', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      
      const websiteLink = screen.getByText('acme.com');
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://acme.com');
      expect(websiteLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it('should not display contact information section when contact persons exist', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyWithContactPersons} />);
      expect(screen.queryByText('Contact Information')).not.toBeInTheDocument();
    });

    it('should display website separately when contact persons exist', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyWithContactPersons} />);
      
      expect(screen.getByText('Website')).toBeInTheDocument();
      const websiteLink = screen.getByText('acme.com');
      expect(websiteLink).toBeInTheDocument();
    });

    it('should handle website with http prefix', () => {
      const companyWithHttp = {
        ...mockCompany,
        contactInfo: {
          ...mockCompany.contactInfo,
          website: 'https://acme.com',
        },
      };
      
      render(<ViewCompanyDialog {...defaultProps} company={companyWithHttp} />);
      
      const websiteLink = screen.getByText('https://acme.com');
      expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://acme.com');
    });

    it('should not display phone when absent', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyMinimal} />);
      expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    });

    it('should not display website when absent', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyMinimal} />);
      expect(screen.queryByText('Website')).not.toBeInTheDocument();
    });
  });

  describe('Address', () => {
    it('should display all address fields', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('10001')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
    });

    it('should handle state when null', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyMinimal} />);
      expect(screen.getByText('456 Street')).toBeInTheDocument();
    });
  });

  describe('Legal Representative', () => {
    it('should display legal representative information when present', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('CEO')).toBeInTheDocument();
      expect(screen.getByText('john.doe@acme.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567891')).toBeInTheDocument();
    });

    it('should not display legal representative section when fields are empty', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyMinimal} />);
      expect(screen.queryByText('Legal Representative')).not.toBeInTheDocument();
    });

    it('should display legal rep with only name and email', () => {
      const companyWithPartialLegalRep = {
        ...mockCompany,
        legalRepresentative: {
          name: 'Jane Doe',
          title: '',
          email: 'jane@acme.com',
          phone: '',
        },
      };
      
      render(<ViewCompanyDialog {...defaultProps} company={companyWithPartialLegalRep} />);
      
      expect(screen.getByText('Legal Representative')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@acme.com')).toBeInTheDocument();
      expect(screen.queryByText('CEO')).not.toBeInTheDocument();
      expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    });
  });

  describe('Bank Account', () => {
    it('should display bank account information when present', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
      expect(screen.getByText('First National Bank')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('987654321')).toBeInTheDocument();
      expect(screen.getByText('GB82WEST12345698765432')).toBeInTheDocument();
      expect(screen.getByText('BARCGB22')).toBeInTheDocument();
    });

    it('should not display bank account section when fields are empty', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyMinimal} />);
      expect(screen.queryByText('Bank Account')).not.toBeInTheDocument();
    });

    it('should display bank account with only bank name', () => {
      const companyWithPartialBank = {
        ...mockCompany,
        bankAccount: {
          bankName: 'Test Bank',
          accountNumber: '',
          routingNumber: null,
          iban: null,
          swift: null,
        },
      };
      
      render(<ViewCompanyDialog {...defaultProps} company={companyWithPartialBank} />);
      
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });
  });

  describe('Metadata', () => {
    it('should display created at date', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.getByText(/January 1, 2024/i)).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      
      const dates = screen.getAllByText(/\w+ \d{1,2}, \d{4}/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Contact Persons', () => {
    it('should display contact persons accordion when present', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyWithContactPersons} />);
      
      expect(screen.getByText(/Contact Persons \(2\)/)).toBeInTheDocument();
    });

    it('should not display contact persons section when absent', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.queryByText(/Contact Persons/)).not.toBeInTheDocument();
    });

    it('should display contact person information', async () => {
      const user = userEvent.setup();
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyWithContactPersons} />);
      
      const accordionTrigger = screen.getByText(/Contact Persons \(2\)/).closest('button');
      if (accordionTrigger) {
        await user.click(accordionTrigger);
        
        await waitFor(() => {
          expect(screen.getByText('Jane Smith')).toBeInTheDocument();
          expect(screen.getByText('Sales Manager')).toBeInTheDocument();
          expect(screen.getByText('Sales')).toBeInTheDocument();
          expect(screen.getByText('jane.smith@acme.com')).toBeInTheDocument();
          expect(screen.getByText('+1234567892')).toBeInTheDocument();
        });
      }
    });

    it('should display contact person with minimal information', async () => {
      const user = userEvent.setup();
      const companyWithMinimalContactPerson = {
        ...mockCompany,
        contactPersons: [
          {
            id: 'cp-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@acme.com',
          },
        ],
      };
      
      render(<ViewCompanyDialog {...defaultProps} company={companyWithMinimalContactPerson} />);
      
      const accordionTrigger = screen.getByText(/Contact Persons \(1\)/).closest('button');
      if (accordionTrigger) {
        await user.click(accordionTrigger);
        
        await waitFor(() => {
          expect(screen.getByText('John Doe')).toBeInTheDocument();
          expect(screen.getByText('john@acme.com')).toBeInTheDocument();
        });
      }
    });

    it('should handle contact person without title or department', async () => {
      const user = userEvent.setup();
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyWithContactPersons} />);
      
      const accordionTrigger = screen.getByText(/Contact Persons \(2\)/).closest('button');
      if (accordionTrigger) {
        await user.click(accordionTrigger);
        
        await waitFor(() => {
          expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        });
      }
    });

    it('should handle contact person without phone', async () => {
      const user = userEvent.setup();
      const companyWithoutPhone = {
        ...mockCompany,
        contactPersons: [
          {
            id: 'cp-1',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@acme.com',
            phone: undefined,
          },
        ],
      };
      
      render(<ViewCompanyDialog {...defaultProps} company={companyWithoutPhone} />);
      
      const accordionTrigger = screen.getByText(/Contact Persons \(1\)/).closest('button');
      if (accordionTrigger) {
        await user.click(accordionTrigger);
        
        await waitFor(() => {
          expect(screen.getByText('Jane Smith')).toBeInTheDocument();
          expect(screen.queryByText('Phone')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Action Buttons', () => {
    it('should call onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<ViewCompanyDialog {...defaultProps} onOpenChange={onOpenChange} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should display edit button when onEdit is provided', () => {
      const onEdit = vi.fn();
      render(<ViewCompanyDialog {...defaultProps} onEdit={onEdit} />);
      
      const editButton = screen.getByRole('button', { name: /edit company/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should not display edit button when onEdit is not provided', () => {
      render(<ViewCompanyDialog {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /edit company/i })).not.toBeInTheDocument();
    });

    it('should call onEdit with company when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<ViewCompanyDialog {...defaultProps} onEdit={onEdit} />);
      
      const editButton = screen.getByRole('button', { name: /edit company/i });
      await user.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith(mockCompany);
    });
  });

  describe('Edge Cases', () => {
    it('should handle company with all optional fields empty', () => {
      render(<ViewCompanyDialog {...defaultProps} company={mockCompanyMinimal} />);
      
      expect(screen.getByText('Minimal Corp')).toBeInTheDocument();
      expect(screen.queryByText('Contact Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Legal Representative')).not.toBeInTheDocument();
      expect(screen.queryByText('Bank Account')).not.toBeInTheDocument();
    });

    it('should handle company with empty contact persons array', () => {
      const companyWithEmptyContacts = {
        ...mockCompany,
        contactPersons: [],
      };
      
      render(<ViewCompanyDialog {...defaultProps} company={companyWithEmptyContacts} />);
      expect(screen.queryByText(/Contact Persons/)).not.toBeInTheDocument();
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
          <ViewCompanyDialog {...defaultProps} company={company} />
        );

        const websiteLink = screen.getByText(input).closest('a');
        expect(websiteLink).toHaveAttribute('href', expected);
        unmount();
      });
    });

    it('should render with different company types', () => {
      const companyTypes = [
        'Corporation',
        'Limited Liability Company',
        'Private Limited Company',
        'Public Limited Company',
        'Gesellschaft mit beschränkter Haftung',
        'Société à Responsabilité Limitée',
        'Other',
      ];

      companyTypes.forEach((type) => {
        const company = {
          ...mockCompany,
          companyType: type as Company['companyType'],
        };

        const { unmount } = render(
          <ViewCompanyDialog {...defaultProps} company={company} />
        );

        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
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
          <ViewCompanyDialog {...defaultProps} company={company} />
        );

        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        unmount();
      });
    });
  });
});


