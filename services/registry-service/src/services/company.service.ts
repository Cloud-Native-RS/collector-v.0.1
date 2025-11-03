import { PrismaClient, Company, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generateCompanyNumber } from '../utils/number-generator';
import { validateTaxId, validateIBAN, validateSWIFT } from '../utils/validation';

type CompanyWithContacts = Prisma.CompanyGetPayload<{
  include: {
    address: true;
    contact: true;
    bankAccount: true;
    contacts: true; // Include all contacts
  };
}>;

export class CompanyService {
  constructor(private prisma: PrismaClient) {}

  async create(data: any): Promise<CompanyWithContacts> {
    // Validate legal name uniqueness
    const existingName = await this.prisma.company.findUnique({
      where: { legalName: data.legalName },
    });

    if (existingName) {
      throw new AppError('Company with this legal name already exists', 400);
    }

    // Validate tax ID uniqueness
    const existingTaxId = await this.prisma.company.findUnique({
      where: { taxId: data.taxId },
    });

    if (existingTaxId) {
      throw new AppError('Company with this Tax ID already exists', 400);
    }

    // Validate registration number uniqueness
    const existingRegNum = await this.prisma.company.findFirst({
      where: { registrationNumber: data.registrationNumber },
    });

    if (existingRegNum) {
      throw new AppError('Company with this registration number already exists', 400);
    }

    // Validate tax ID format
    const country = data.address?.country || 'US';
    const taxValidation = validateTaxId(data.taxId, country);
    if (!taxValidation.valid) {
      throw new AppError(taxValidation.error || 'Invalid Tax ID', 400);
    }

    // Validate IBAN if provided
    if (data.bankAccount?.iban) {
      const ibanValidation = validateIBAN(data.bankAccount.iban);
      if (!ibanValidation.valid) {
        throw new AppError(ibanValidation.error || 'Invalid IBAN', 400);
      }
    }

    // Validate SWIFT if provided
    if (data.bankAccount?.swift) {
      const swiftValidation = validateSWIFT(data.bankAccount.swift);
      if (!swiftValidation.valid) {
        throw new AppError(swiftValidation.error || 'Invalid SWIFT code', 400);
      }
    }

    // Generate company number
    let companyNumber = generateCompanyNumber();
    while (await this.prisma.company.findUnique({ where: { companyNumber } })) {
      companyNumber = generateCompanyNumber();
    }

    // Create address
    const address = await this.prisma.address.create({
      data: {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode,
        country: data.address.country,
        tenantId: data.tenantId,
      },
    });

    // Create contact
    const contact = await this.prisma.contact.create({
      data: {
        email: data.contact.email,
        phone: data.contact.phone,
        website: data.contact.website,
        tenantId: data.tenantId,
      },
    });

    // Create bank account if provided
    let bankAccountId: string | undefined;
    if (data.bankAccount) {
      const bankAccount = await this.prisma.bankAccount.create({
        data: {
          bankName: data.bankAccount.bankName,
          accountNumber: data.bankAccount.accountNumber,
          routingNumber: data.bankAccount.routingNumber,
          iban: data.bankAccount.iban,
          swift: data.bankAccount.swift,
          tenantId: data.tenantId,
        },
      });
      bankAccountId = bankAccount.id;
    }

    // Create company
    const company = await this.prisma.company.create({
      data: {
        companyType: data.companyType,
        companyNumber,
        legalName: data.legalName,
        tradingName: data.tradingName,
        taxId: data.taxId,
        registrationNumber: data.registrationNumber,
        industry: data.industry,
        legalRepName: data.legalRepName,
        legalRepTitle: data.legalRepTitle,
        legalRepEmail: data.legalRepEmail,
        legalRepPhone: data.legalRepPhone,
        status: 'ACTIVE',
        addressId: address.id,
        contactId: contact.id,
        bankAccountId,
        tenantId: data.tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        contacts: {
          where: {
            type: 'INDIVIDUAL',
          },
        },
      },
    });

    return company;
  }

  async getById(id: string, tenantId: string): Promise<CompanyWithContacts | null> {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        contacts: {
          where: {
            type: 'INDIVIDUAL',
          },
        },
      },
    });
    
    if (company) {
      console.log(`[CompanyService.getById] Company ${company.legalName} has ${company.contacts?.length || 0} contacts`);
    }
    
    return company;
  }

  async getAll(tenantId: string, skip = 0, take = 50): Promise<CompanyWithContacts[]> {
    const companies = await this.prisma.company.findMany({
      where: { tenantId },
      skip,
      take,
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        contacts: {
          where: {
            type: 'INDIVIDUAL'
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Log BEFORE any filtering
    if (companies.length > 0) {
      const first = companies[0];
      console.log(`[CompanyService.getAll] BEFORE filter - Company: ${first.legalName}`);
      console.log(`[CompanyService.getAll] BEFORE filter - Contacts from Prisma:`, JSON.stringify(first.contacts, null, 2));
      console.log(`[CompanyService.getAll] BEFORE filter - Contacts is array:`, Array.isArray(first.contacts));
      console.log(`[CompanyService.getAll] BEFORE filter - Contacts length:`, first.contacts?.length || 0);
    }
    
    // Contacts are already filtered by Prisma, just return them
    const companiesWithFilteredContacts = companies.map(company => ({
      ...company,
      contacts: Array.isArray(company.contacts) ? company.contacts : [],
    })) as CompanyWithContacts[];
    
    // Log for debugging - detailed
    if (companiesWithFilteredContacts.length > 0) {
      console.log(`[CompanyService.getAll] Found ${companiesWithFilteredContacts.length} companies`);
      const firstCompany = companiesWithFilteredContacts[0];
      console.log(`[CompanyService.getAll] First company: ${firstCompany.legalName}, ID: ${firstCompany.id}`);
      console.log(`[CompanyService.getAll] Contacts property exists:`, 'contacts' in firstCompany);
      console.log(`[CompanyService.getAll] Contacts value:`, firstCompany.contacts);
      console.log(`[CompanyService.getAll] Contacts type:`, typeof firstCompany.contacts);
      console.log(`[CompanyService.getAll] Contacts is array:`, Array.isArray(firstCompany.contacts));
      if (Array.isArray(firstCompany.contacts)) {
        console.log(`[CompanyService.getAll] Contacts length: ${firstCompany.contacts.length}`);
        if (firstCompany.contacts.length > 0) {
          console.log(`[CompanyService.getAll] First contact data:`, JSON.stringify(firstCompany.contacts[0], null, 2));
        }
      }
      
      // Check if contacts are actually in the returned object
      console.log(`[CompanyService.getAll] Company keys:`, Object.keys(firstCompany));
    }
    
    return companiesWithFilteredContacts;
  }

  async update(id: string, tenantId: string, data: Partial<any>): Promise<CompanyWithContacts> {
    // Verify company exists and belongs to tenant
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Company not found', 404);
    }

    // Update company
    const company = await this.prisma.company.update({
      where: { id },
      data: {
        tradingName: data.tradingName,
        industry: data.industry,
        legalRepName: data.legalRepName,
        legalRepTitle: data.legalRepTitle,
        legalRepEmail: data.legalRepEmail,
        legalRepPhone: data.legalRepPhone,
        status: data.status,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        contacts: {
          where: {
            type: 'INDIVIDUAL',
          },
        },
      },
    });

    return company;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Company not found', 404);
    }

    await this.prisma.company.delete({
      where: { id },
    });
  }

  async lookupByTaxId(taxId: string, tenantId: string): Promise<CompanyWithContacts | null> {
    return this.prisma.company.findFirst({
      where: {
        taxId,
        tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        contacts: {
          where: {
            type: 'INDIVIDUAL',
          },
        },
      },
    });
  }

  async lookupByRegistrationNumber(registrationNumber: string, tenantId: string): Promise<CompanyWithContacts | null> {
    return this.prisma.company.findFirst({
      where: {
        registrationNumber,
        tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        contacts: {
          where: {
            type: 'INDIVIDUAL',
          },
        },
      },
    });
  }
}

