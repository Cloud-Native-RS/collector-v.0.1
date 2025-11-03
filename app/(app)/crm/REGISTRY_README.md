# Customer & Company Registry Microservice

## Overview

The **Customer & Company Registry** is the first microservice in the Collector system. It serves as a central database of all legal entities and customers, providing a single source of truth for customer and company master data.

## Purpose

- **Centralized Data Management**: Single database for all customers and companies
- **Data Consistency**: Prevents customer data duplication across the system
- **Validation**: Tax ID and registration number validation
- **Tenant Isolation**: Multi-tenant support with proper data segregation
- **Lookup APIs**: Provides APIs for other services to reference customer/company data

## Key Features

### Customer Registry (`/crm/customer-registry`)

#### Core Features
- Customer master data management
- Tax ID validation
- Registration number validation
- Address and contact information management
- Bank account details storage
- Tenant isolation support
- Duplicate prevention (by email and tax ID)

#### Data Fields
```typescript
{
  id: number;
  customerNumber: string;      // Auto-generated unique identifier
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string | null;
  taxId: string;               // Validated based on country
  registrationNumber: string | null;
  status: "active" | "inactive" | "pending" | "archived";
  address: Address;
  bankAccount: BankAccount;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Company Registry (`/crm/company-registry`)

#### Core Features
- Company master data management
- Legal and trading name tracking
- Company type classification
- Industry categorization
- Tax ID and registration number validation
- Legal representative information
- Contact information management
- Bank account details storage
- Tenant isolation support
- Duplicate prevention (by legal name, tax ID, registration number)

#### Data Fields
```typescript
{
  id: number;
  companyNumber: string;       // Auto-generated unique identifier
  legalName: string;
  tradingName: string;
  companyType: CompanyType;    // Corporation, LLC, Ltd, etc.
  taxId: string;              // Validated based on country
  registrationNumber: string; // Required for companies
  status: "active" | "inactive" | "pending" | "liquidated";
  industry: string;
  address: Address;
  contactInfo: ContactInfo;
  bankAccount: BankAccount;
  legalRepresentative: LegalRepresentative;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
```

## Validation Rules

### Tax ID Validation

The system validates Tax IDs based on the country:

- **United States**: EIN format `XX-XXXXXXX` (9 digits with hyphen)
- **United Kingdom**: VAT format `GB999 9999 99` or `GB999999999`
- **Germany**: 11-digit Tax ID
- **France**: 9-digit Tax ID
- **Other**: Minimum 5 characters

### Registration Number Validation

- **United States**: Flexible format, minimum 3 characters
- **United Kingdom**: Minimum 8 characters
- **Germany**: HRB format `HRB-XXXXXX`
- **France**: RCS format `RCS-Paris-XXXXXX`
- **Other**: Minimum 5 characters

### IBAN Validation

Basic format validation: 2 letters (country code) + 2 digits (check digits) + 4-30 alphanumeric characters

### SWIFT Code Validation

Format: 4 letters (bank) + 2 letters (country) + 2 characters (location) + 3 optional characters (branch)

## Duplicate Prevention

### Customer Duplicates
Checks for duplicates by:
- Email address (case-insensitive)
- Tax ID

### Company Duplicates
Checks for duplicates by:
- Legal name (case-insensitive)
- Tax ID
- Registration number

## Tenant Isolation

Each record includes a `tenantId` field for multi-tenant support:
- All queries are filtered by tenant
- Prevents cross-tenant data access
- Enables multi-organization deployments

## Lookup APIs (Future)

The registry will provide REST APIs for other services:

### Customer Lookup APIs
- `GET /api/customers?taxId=XXX` - Lookup by tax ID
- `GET /api/customers?email=XXX` - Lookup by email
- `GET /api/customers/{id}` - Get customer details
- `POST /api/customers` - Create new customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Company Lookup APIs
- `GET /api/companies?taxId=XXX` - Lookup by tax ID
- `GET /api/companies?registrationNumber=XXX` - Lookup by registration
- `GET /api/companies/{id}` - Get company details
- `POST /api/companies` - Create new company
- `PUT /api/companies/{id}` - Update company
- `DELETE /api/companies/{id}` - Delete company

## File Structure

```
app/(app)/crm/
├── customer-registry/
│   ├── data.json                    # Sample customer data
│   ├── types.ts                     # TypeScript interfaces
│   ├── customer-data-table.tsx      # Data table component
│   └── page.tsx                     # Customer registry page
├── company-registry/
│   ├── data.json                    # Sample company data
│   ├── types.ts                     # TypeScript interfaces
│   ├── company-data-table.tsx       # Data table component
│   └── page.tsx                     # Company registry page
└── REGISTRY_README.md               # This file

lib/
└── registry-validation.ts           # Validation utilities
```

## Integration Points

The registry will be used by:

1. **Sales & Finance Module**: Reference customer/company in offers, invoices
2. **Accounts Receivable**: Link payments to customers
3. **Accounts Payable**: Link bills to vendors (companies)
4. **Inventory**: Track supplier companies
5. **CRM**: Maintain customer relationships
6. **Reporting**: Aggregate data by customer/company

## Future Enhancements

- REST API implementation
- Batch import/export functionality
- Document storage for company registrations
- Advanced search and filtering
- Customer/company merge functionality
- Audit trail for data changes
- GDPR compliance features (data export, deletion)
- API rate limiting and authentication
- Webhook support for data changes
- GraphQL API alternative

## Security Considerations

- Tenant isolation is mandatory
- Sensitive data (bank accounts) should be encrypted
- Access control based on user roles
- Audit logging for all data changes
- Rate limiting on lookup APIs
- Input validation and sanitization
- SQL injection prevention

