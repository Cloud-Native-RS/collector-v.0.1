import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewLeadDialog from './view-lead-dialog';
import { type Lead } from './types';
import * as crmApi from '@/lib/api/crm';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api/crm');
vi.mock('sonner');

const mockLead: Lead = {
  id: 'lead-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  companyType: 'LLC',
  companyWebsite: 'acme.com',
  companyIndustry: 'Technology',
  companySize: '50-100',
  companyAddress: '123 Main St, New York, NY 10001',
  companyTaxId: '12-3456789',
  companyRegistrationNumber: 'REG-123456',
  legalRepName: 'Jane Doe',
  legalRepTitle: 'CEO',
  legalRepEmail: 'jane.doe@acme.com',
  legalRepPhone: '+1234567891',
  source: 'website',
  status: 'qualified',
  value: 50000,
  assignedTo: 'user-1',
  notes: 'Initial contact made',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

const mockLeadMinimal: Lead = {
  id: 'lead-2',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  source: 'email',
  status: 'new',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
};

describe('ViewLeadDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    lead: mockLead,
    onEdit: undefined,
    onConvert: undefined,
    onRefresh: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when lead is null', () => {
      const { container } = render(
        <ViewLeadDialog {...defaultProps} lead={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render dialog with lead name as title', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Lead Details & Information')).toBeInTheDocument();
    });

    it('should render all lead information sections', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Company Information')).toBeInTheDocument();
      expect(screen.getByText('Legal Representative')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should display lead status badge', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('Qualified')).toBeInTheDocument();
    });

    it('should display lead source badge', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('Website')).toBeInTheDocument();
    });

    it('should display estimated value when present', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    it('should not display estimated value when absent', () => {
      const leadWithoutValue = { ...mockLeadMinimal };
      render(<ViewLeadDialog {...defaultProps} lead={leadWithoutValue} />);
      expect(screen.queryByText('Estimated Value')).not.toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('should display full name', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display email as clickable link', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      const emailLink = screen.getByText('john.doe@example.com');
      expect(emailLink).toBeInTheDocument();
      expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:john.doe@example.com');
    });

    it('should display phone as clickable link when present', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      const phoneLink = screen.getByText('+1234567890');
      expect(phoneLink).toBeInTheDocument();
      expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+1234567890');
    });

    it('should not display phone when absent', () => {
      render(<ViewLeadDialog {...defaultProps} lead={mockLeadMinimal} />);
      expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    });

    it('should display assigned to when present', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('user-1')).toBeInTheDocument();
    });
  });

  describe('Company Information', () => {
    it('should display company information when present', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('LLC')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, New York, NY 10001')).toBeInTheDocument();
      expect(screen.getByText('50-100 employees')).toBeInTheDocument();
    });

    it('should display company website as clickable link', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      const websiteLink = screen.getByText('acme.com');
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://acme.com');
      expect(websiteLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it('should display tax ID and registration number', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('12-3456789')).toBeInTheDocument();
      expect(screen.getByText('REG-123456')).toBeInTheDocument();
    });

    it('should not display company section when company is absent', () => {
      render(<ViewLeadDialog {...defaultProps} lead={mockLeadMinimal} />);
      expect(screen.queryByText('Company Information')).not.toBeInTheDocument();
    });
  });

  describe('Legal Representative', () => {
    it('should display legal representative information when present', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('CEO')).toBeInTheDocument();
      expect(screen.getByText('jane.doe@acme.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567891')).toBeInTheDocument();
    });

    it('should display legal rep email as clickable link', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      const emailLink = screen.getByText('jane.doe@acme.com');
      expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:jane.doe@acme.com');
    });

    it('should display legal rep phone as clickable link', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      const phoneLink = screen.getByText('+1234567891');
      expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+1234567891');
    });

    it('should not display legal representative section when absent', () => {
      render(<ViewLeadDialog {...defaultProps} lead={mockLeadMinimal} />);
      expect(screen.queryByText('Legal Representative')).not.toBeInTheDocument();
    });
  });

  describe('Timeline', () => {
    it('should display created at date', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('01.01.2024')).toBeInTheDocument();
    });

    it('should display last updated date', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('15.01.2024')).toBeInTheDocument();
    });
  });

  describe('Notes', () => {
    it('should display notes when present', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.getByText('Initial contact made')).toBeInTheDocument();
    });

    it('should display placeholder when notes are empty', () => {
      const leadWithoutNotes = { ...mockLeadMinimal, notes: undefined };
      render(<ViewLeadDialog {...defaultProps} lead={leadWithoutNotes} />);
      expect(screen.getByText('No notes. Double click to add notes.')).toBeInTheDocument();
    });

    it('should enter edit mode on double click', async () => {
      const user = userEvent.setup();
      render(<ViewLeadDialog {...defaultProps} />);
      
      const notesContainer = screen.getByText('Initial contact made').closest('div');
      if (notesContainer) {
        await user.dblClick(notesContainer);
        expect(screen.getByPlaceholderText('Enter notes...')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      }
    });

    it('should enter edit mode on Enter key press', async () => {
      render(<ViewLeadDialog {...defaultProps} />);
      
      const notesContainer = screen.getByText('Initial contact made').closest('div');
      if (notesContainer) {
        fireEvent.keyDown(notesContainer, { key: 'Enter', code: 'Enter' });
        await waitFor(() => {
          expect(screen.getByPlaceholderText('Enter notes...')).toBeInTheDocument();
        });
      }
    });

    it('should save notes successfully', async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn();
      const mockUpdateLead = vi.spyOn(crmApi, 'updateLead').mockResolvedValue({
        ...mockLead,
        notes: 'Updated notes',
      });

      render(<ViewLeadDialog {...defaultProps} onRefresh={onRefresh} />);
      
      const notesContainer = screen.getByText('Initial contact made').closest('div');
      if (notesContainer) {
        await user.dblClick(notesContainer);
        
        const textarea = screen.getByPlaceholderText('Enter notes...');
        await user.clear(textarea);
        await user.type(textarea, 'Updated notes');
        
        const saveButton = screen.getByText('Save');
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockUpdateLead).toHaveBeenCalledWith('lead-1', {
            notes: 'Updated notes',
          });
          expect(toast.success).toHaveBeenCalledWith('Notes updated successfully');
          expect(onRefresh).toHaveBeenCalled();
        });
      }
    });

    it('should handle save notes error', async () => {
      const user = userEvent.setup();
      const mockUpdateLead = vi.spyOn(crmApi, 'updateLead').mockRejectedValue(
        new Error('Network error')
      );

      render(<ViewLeadDialog {...defaultProps} />);
      
      const notesContainer = screen.getByText('Initial contact made').closest('div');
      if (notesContainer) {
        await user.dblClick(notesContainer);
        
        const textarea = screen.getByPlaceholderText('Enter notes...');
        await user.type(textarea, 'New notes');
        
        const saveButton = screen.getByText('Save');
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockUpdateLead).toHaveBeenCalled();
          expect(toast.error).toHaveBeenCalledWith(
            'Failed to update notes: Network error'
          );
        });
      }
    });

    it('should cancel notes editing', async () => {
      const user = userEvent.setup();
      render(<ViewLeadDialog {...defaultProps} />);
      
      const notesContainer = screen.getByText('Initial contact made').closest('div');
      if (notesContainer) {
        await user.dblClick(notesContainer);
        
        const textarea = screen.getByPlaceholderText('Enter notes...');
        await user.clear(textarea);
        await user.type(textarea, 'Changed notes');
        
        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByPlaceholderText('Enter notes...')).not.toBeInTheDocument();
          expect(screen.getByText('Initial contact made')).toBeInTheDocument();
        });
      }
    });

    it('should disable save button while saving', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      const mockUpdateLead = vi.spyOn(crmApi, 'updateLead').mockReturnValue(
        promise as any
      );

      render(<ViewLeadDialog {...defaultProps} />);
      
      const notesContainer = screen.getByText('Initial contact made').closest('div');
      if (notesContainer) {
        await user.dblClick(notesContainer);
        
        const saveButton = screen.getByText('Save');
        await user.click(saveButton);

        await waitFor(() => {
          expect(saveButton).toBeDisabled();
          expect(screen.getByText('Saving...')).toBeInTheDocument();
        });

        resolvePromise!({ ...mockLead, notes: 'Updated' });
        await promise;
      }
    });
  });

  describe('Action Buttons', () => {
    it('should call onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<ViewLeadDialog {...defaultProps} onOpenChange={onOpenChange} />);
      
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') !== 'Edit Lead' && btn.getAttribute('title') !== 'Convert to Customer'
      );
      
      if (closeButton) {
        await user.click(closeButton);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });

    it('should display edit button when onEdit is provided', () => {
      const onEdit = vi.fn();
      render(<ViewLeadDialog {...defaultProps} onEdit={onEdit} />);
      
      const editButton = screen.getByTitle('Edit Lead');
      expect(editButton).toBeInTheDocument();
    });

    it('should not display edit button when onEdit is not provided', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.queryByTitle('Edit Lead')).not.toBeInTheDocument();
    });

    it('should call onEdit and close dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <ViewLeadDialog
          {...defaultProps}
          onEdit={onEdit}
          onOpenChange={onOpenChange}
        />
      );
      
      const editButton = screen.getByTitle('Edit Lead');
      await user.click(editButton);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onEdit).toHaveBeenCalled();
    });

    it('should display convert button when onConvert is provided', () => {
      const onConvert = vi.fn();
      render(<ViewLeadDialog {...defaultProps} onConvert={onConvert} />);
      
      const convertButton = screen.getByTitle('Convert to Customer');
      expect(convertButton).toBeInTheDocument();
    });

    it('should not display convert button when onConvert is not provided', () => {
      render(<ViewLeadDialog {...defaultProps} />);
      expect(screen.queryByTitle('Convert to Customer')).not.toBeInTheDocument();
    });

    it('should call onConvert and close dialog when convert button is clicked', async () => {
      const user = userEvent.setup();
      const onConvert = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <ViewLeadDialog
          {...defaultProps}
          onConvert={onConvert}
          onOpenChange={onOpenChange}
        />
      );
      
      const convertButton = screen.getByTitle('Convert to Customer');
      await user.click(convertButton);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onConvert).toHaveBeenCalled();
    });
  });

  describe('Status and Source Mapping', () => {
    it('should handle all status types correctly', () => {
      const statuses: Lead['status'][] = [
        'new',
        'contacted',
        'qualified',
        'proposal_sent',
        'negotiation',
        'won',
        'lost',
      ];

      statuses.forEach((status) => {
        const { unmount } = render(
          <ViewLeadDialog {...defaultProps} lead={{ ...mockLeadMinimal, status }} />
        );
        expect(screen.getByText(status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '))).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle all source types correctly', () => {
      const sources: Lead['source'][] = [
        'website',
        'social',
        'email',
        'call',
        'referral',
        'other',
      ];

      sources.forEach((source) => {
        const { unmount } = render(
          <ViewLeadDialog {...defaultProps} lead={{ ...mockLeadMinimal, source }} />
        );
        expect(screen.getByText(source === 'social' ? 'Social Media' : source === 'call' ? 'Phone Call' : source.charAt(0).toUpperCase() + source.slice(1))).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle unknown status gracefully', () => {
      const leadWithUnknownStatus = {
        ...mockLeadMinimal,
        status: 'unknown' as any,
      };
      render(<ViewLeadDialog {...defaultProps} lead={leadWithUnknownStatus} />);
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });

    it('should handle unknown source gracefully', () => {
      const leadWithUnknownSource = {
        ...mockLeadMinimal,
        source: 'unknown' as any,
      };
      render(<ViewLeadDialog {...defaultProps} lead={leadWithUnknownSource} />);
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('Notes State Management', () => {
    it('should update notes value when lead changes', () => {
      const { rerender } = render(<ViewLeadDialog {...defaultProps} />);
      
      expect(screen.getByText('Initial contact made')).toBeInTheDocument();
      
      const newLead = { ...mockLead, notes: 'New notes' };
      rerender(<ViewLeadDialog {...defaultProps} lead={newLead} />);
      
      expect(screen.getByText('New notes')).toBeInTheDocument();
    });

    it('should reset editing state when lead changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ViewLeadDialog {...defaultProps} />);
      
      const notesContainer = screen.getByText('Initial contact made').closest('div');
      if (notesContainer) {
        await user.dblClick(notesContainer);
        expect(screen.getByPlaceholderText('Enter notes...')).toBeInTheDocument();
        
        const newLead = { ...mockLead, notes: 'Different notes' };
        rerender(<ViewLeadDialog {...defaultProps} lead={newLead} />);
        
        expect(screen.queryByPlaceholderText('Enter notes...')).not.toBeInTheDocument();
        expect(screen.getByText('Different notes')).toBeInTheDocument();
      }
    });
  });
});

