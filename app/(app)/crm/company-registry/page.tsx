"use client";

import { useEffect, useState } from "react";
import CompanyRegistryClient from "./company-registry-client";
import { type Company } from "./types";
import { companiesApi, Company as ApiCompany } from "@/lib/api/registry";

// Transform API Company to Frontend Company format
function transformCompany(apiCompany: ApiCompany): Company {
  return {
    id: parseInt(apiCompany.id.replace(/\D/g, '')) || Math.random() * 1000000, // Convert UUID to number for compatibility
    originalId: apiCompany.id, // Keep original UUID for API calls
    companyNumber: apiCompany.companyNumber,
    legalName: apiCompany.legalName,
    tradingName: apiCompany.tradingName || '',
    companyType: mapCompanyType(apiCompany.companyType),
    taxId: apiCompany.taxId,
    registrationNumber: apiCompany.registrationNumber,
    status: mapCompanyStatus(apiCompany.status),
    industry: apiCompany.industry || '',
    address: {
      street: apiCompany.address.street,
      city: apiCompany.address.city,
      state: apiCompany.address.state || null,
      zipCode: apiCompany.address.zipCode,
      country: apiCompany.address.country,
    },
    contactInfo: {
      email: apiCompany.contact.email,
      phone: apiCompany.contact.phone || '',
      website: apiCompany.contact.website || null,
    },
    bankAccount: apiCompany.bankAccount ? {
      bankName: apiCompany.bankAccount.bankName,
      accountNumber: apiCompany.bankAccount.accountNumber,
      routingNumber: apiCompany.bankAccount.routingNumber || null,
      iban: apiCompany.bankAccount.iban || null,
      swift: apiCompany.bankAccount.swift || null,
    } : {
      bankName: '',
      accountNumber: '',
      routingNumber: null,
      iban: null,
      swift: null,
    },
    legalRepresentative: {
      name: apiCompany.legalRepName || '',
      title: apiCompany.legalRepTitle || '',
      email: apiCompany.legalRepEmail || '',
      phone: apiCompany.legalRepPhone || '',
    },
    contactPersons: (() => {
      // Debug: Log contacts from API
      if (apiCompany.contacts) {
        console.log(`Company ${apiCompany.legalName} has ${apiCompany.contacts.length} contacts:`, apiCompany.contacts);
      }
      
      if (!apiCompany.contacts || apiCompany.contacts.length === 0) {
        return undefined;
      }
      
      return apiCompany.contacts.map((contact: any) => ({
        id: contact.id,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        title: contact.title || undefined,
        department: contact.department || undefined,
        email: contact.email || contact.contact?.email || '',
        phone: contact.phone || contact.contact?.phone || undefined,
      }));
    })(),
    tenantId: apiCompany.tenantId,
    createdAt: apiCompany.createdAt,
    updatedAt: apiCompany.updatedAt,
  };
}

function mapCompanyType(type: string): Company["companyType"] {
  const mapping: Record<string, Company["companyType"]> = {
    'CORPORATION': 'Corporation',
    'LLC': 'Limited Liability Company',
    'LTD': 'Private Limited Company',
    'GMBH': 'Gesellschaft mit beschränkter Haftung',
    'SARL': 'Société à Responsabilité Limitée',
    'OTHER': 'Other',
  };
  return mapping[type] || 'Other';
}

function mapCompanyStatus(status: string): Company["status"] {
  const mapping: Record<string, Company["status"]> = {
    'ACTIVE': 'active',
    'INACTIVE': 'inactive',
    'PENDING': 'pending',
    'LIQUIDATED': 'liquidated',
  };
  return mapping[status] || 'pending';
}

export default function CompanyRegistryPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesApi.list({ take: 100 });
      
      // Debug: Check if contacts are present in API response
      if (response.data && response.data.length > 0) {
        const sampleCompany = response.data[0];
        console.log('🔍 Sample company from API:', {
          legalName: sampleCompany.legalName,
          hasContacts: 'contacts' in sampleCompany,
          contacts: sampleCompany.contacts,
          contactsType: typeof sampleCompany.contacts,
          contactsLength: Array.isArray(sampleCompany.contacts) ? sampleCompany.contacts.length : 'not array',
          companyKeys: Object.keys(sampleCompany)
        });
        
        // Check multiple companies
        response.data.slice(0, 3).forEach((company: any, idx: number) => {
          console.log(`🔍 Company ${idx + 1} (${company.legalName}):`, {
            hasContacts: 'contacts' in company,
            contacts: company.contacts,
            contactsLength: Array.isArray(company.contacts) ? company.contacts.length : 'not array'
          });
        });
      }
      
      const transformed = (response.data || []).map(transformCompany);
      
      // Debug: Check transformed companies
      if (transformed.length > 0) {
        console.log('Sample transformed company:', {
          legalName: transformed[0].legalName,
          contactPersons: transformed[0].contactPersons,
          contactPersonsLength: transformed[0].contactPersons?.length || 0
        });
      }
      
      setCompanies(transformed);
    } catch (error: any) {
      console.error('Failed to load companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading companies...</div>
      </div>
    );
  }

  return <CompanyRegistryClient initialCompanies={companies} />;
}

