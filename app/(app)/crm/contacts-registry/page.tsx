"use client";

import { useEffect, useState, useCallback } from "react";
import type { Contact } from "./types";
import ContactsPageClient from "./contacts-page-client";
import { customersApi, companiesApi, type Customer, type Company } from "@/lib/api/registry";

// Transform Customer (INDIVIDUAL type) to Contact format
function transformCustomerToContact(customer: Customer): Contact {
  // Skip COMPANY type customers - only INDIVIDUAL should be contacts
  if (customer.type === 'COMPANY') {
    console.warn('Skipping COMPANY type customer:', customer.id, customer.email);
    // Return null or throw - caller should filter these out
    throw new Error('COMPANY type customer cannot be transformed to Contact');
  }
  
  // Validate that INDIVIDUAL has firstName and lastName
  if (!customer.firstName || !customer.lastName) {
    console.warn('INDIVIDUAL customer missing firstName/lastName:', {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName
    });
  }
  
  // Use contact object if direct fields are missing
  const email = customer.email || customer.contact?.email || '';
  const phone = customer.phone || customer.contact?.phone || '';
  
  // Get company information from company relationship if available, otherwise fallback to companyName field
  // Handle both null and undefined values
  // Always use legalName, never tradingName
  let companyLegalName = customer.company?.legalName ?? null;
  let companyName = companyLegalName ?? customer.companyName ?? null;
  
  // Clean up any "Trading as:" text if it exists in companyName (prefix or anywhere)
  if (companyName) {
    companyName = String(companyName)
      .replace(/^Trading as:\s*/i, '')
      .replace(/Trading as:\s*/i, '')
      .trim();
  }
  if (companyLegalName) {
    companyLegalName = String(companyLegalName)
      .replace(/^Trading as:\s*/i, '')
      .replace(/Trading as:\s*/i, '')
      .trim();
  }
  
  const companyId = customer.companyId ? parseInt(customer.companyId.replace(/\D/g, '')) : null;
  
  return {
    id: parseInt(customer.id.replace(/\D/g, '')) || Math.random() * 1000000, // Convert UUID to number
    originalId: customer.id, // Keep original UUID for API calls
    contactNumber: customer.customerNumber,
    firstName: customer.firstName ? String(customer.firstName).trim() : '',
    lastName: customer.lastName ? String(customer.lastName).trim() : '',
    email: email,
    phone: phone,
    title: customer.title ?? null,
    department: customer.department ?? null,
    companyId: companyId,
    companyName: companyName,
    companyLegalName: companyLegalName,
    status: mapCustomerStatus(customer.status),
    address: {
      street: customer.address.street,
      city: customer.address.city,
      state: customer.address.state || null,
      zipCode: customer.address.zipCode,
      country: customer.address.country,
    },
    tenantId: customer.tenantId,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function mapCustomerStatus(status: string): Contact["status"] {
  const mapping: Record<string, Contact["status"]> = {
    'ACTIVE': 'active',
    'INACTIVE': 'inactive',
    'PENDING': 'pending',
    'ARCHIVED': 'archived',
  };
  return mapping[status] || 'pending';
}

export default function ContactsRegistryPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch only INDIVIDUAL type customers as contacts
      const response = await customersApi.list({ type: 'INDIVIDUAL', take: 100 });
      
      // Fetch all companies to build a lookup map
      let companiesMap = new Map<string, Company>();
      try {
        const companiesResponse = await companiesApi.list({ take: 100 });
        companiesMap = new Map(
          (companiesResponse.data || []).map(c => [c.id, c])
        );
      } catch (companiesError) {
        console.error('Failed to load companies for lookup:', companiesError);
        // Continue without companies map - will show companyId if available
      }
      
      // Filter out any COMPANY types that might slip through and transform only INDIVIDUAL
      // This is expected behavior - Contacts Registry only shows INDIVIDUAL type customers
      const allCustomers = response.data || [];
      const individualCustomers = allCustomers.filter(c => c.type === 'INDIVIDUAL');
      
      if (individualCustomers.length === 0) {
        console.warn(`No INDIVIDUAL customers found. Total customers: ${allCustomers.length}. Make sure you have contacts (not companies) in the database. You may need to run the seed script.`);
      } else {
        console.log(`Found ${individualCustomers.length} INDIVIDUAL contacts out of ${allCustomers.length} total customers.`);
      }
      
      const transformed: Contact[] = [];
      let contactsWithCompany = 0;
      let contactsWithDepartment = 0;
      
      // Debug: Log first customer to see what data structure we're getting
      if (individualCustomers.length > 0) {
        const firstCustomer = individualCustomers[0];
        console.log('Sample customer data from API:', {
          id: firstCustomer.id,
          firstName: firstCustomer.firstName,
          lastName: firstCustomer.lastName,
          department: firstCustomer.department,
          companyId: firstCustomer.companyId,
          companyName: firstCustomer.companyName,
          hasCompanyRelation: !!firstCustomer.company,
          companyRelation: firstCustomer.company ? {
            id: firstCustomer.company.id,
            legalName: firstCustomer.company.legalName
          } : null,
          fullCustomerObject: firstCustomer
        });
      }
      
      for (const customer of individualCustomers) {
        try {
          // If company relation is missing but companyId exists, fetch company from map
          const customerWithCompany = { ...customer };
          if (!customerWithCompany.company && customerWithCompany.companyId) {
            const company = companiesMap.get(customerWithCompany.companyId);
            if (company) {
              console.log(`Found company in map for customer ${customer.id}:`, company.legalName);
              customerWithCompany.company = company;
            } else {
              console.warn(`Company not found in map for companyId: ${customerWithCompany.companyId} (customer: ${customer.id})`);
            }
          }
          
          const contact = transformCustomerToContact(customerWithCompany);
          
          // Track statistics
          if (contact.companyName) contactsWithCompany++;
          if (contact.department) contactsWithDepartment++;
          
          transformed.push(contact);
        } catch (error) {
          console.error('Failed to transform customer:', customer.id, error);
          // Skip this customer
        }
      }
      
      console.log(`Transformed ${transformed.length} contacts. ${contactsWithCompany} have company, ${contactsWithDepartment} have department.`);
      
      setContacts(transformed);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading contacts...</div>
      </div>
    );
  }

  return <ContactsPageClient initialContacts={contacts} />;
}

