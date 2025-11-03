import type {
	Customer,
	CustomerStatus,
	CustomerType,
	Prisma,
	PrismaClient,
} from "@prisma/client";
import type { z } from "zod";
import { AppError } from "../middleware/error-handler";
import { generateCustomerNumber } from "../utils/number-generator";
import type { customerCreateSchema } from "../utils/validation";
import { validateIBAN, validateSWIFT, validateTaxId } from "../utils/validation";

type CustomerCreateData = z.infer<typeof customerCreateSchema>;

interface CustomerUpdateData {
  firstName?: string;
  lastName?: string;
  title?: string | null;
  department?: string | null;
  companyName?: string | null;
  companyId?: string | null;
  phone?: string | null;
  status?: CustomerStatus;
}

export class CustomerService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CustomerCreateData): Promise<Customer> {
    // Validate email uniqueness
    const existingEmail = await this.prisma.customer.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('Customer with this email already exists', 400);
    }

    // Validate tax ID uniqueness
    const existingTaxId = await this.prisma.customer.findUnique({
      where: { taxId: data.taxId },
    });

    if (existingTaxId) {
      throw new AppError('Customer with this Tax ID already exists', 400);
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

    // Generate customer number
    let customerNumber = generateCustomerNumber();
    while (await this.prisma.customer.findUnique({ where: { customerNumber } })) {
      customerNumber = generateCustomerNumber();
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

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        type: data.type,
        customerNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        department: data.department,
        companyName: data.companyName,
        companyId: data.companyId,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId,
        registrationNumber: data.registrationNumber,
        addressId: address.id,
        contactId: contact.id,
        bankAccountId,
        status: 'ACTIVE',
        tenantId: data.tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        company: true,
      },
    });

    return customer;
  }

  async getById(id: string, tenantId: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        company: true,
      },
    });
  }

  async getAll(tenantId: string, skip = 0, take = 50, type?: string, status?: string): Promise<Customer[]> {
    const where: Prisma.CustomerWhereInput = { tenantId };
    
    if (type) {
      where.type = type as CustomerType;
    }
    
    if (status) {
      where.status = status as CustomerStatus;
    }
    
    const customers = await this.prisma.customer.findMany({
      where,
      skip,
      take,
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Ensure all fields are included, especially companyId, department, title
    // Explicitly set these fields to ensure they're always present (even if null)
    return customers.map((c) => ({
      ...c,
      companyId: c.companyId ?? null,
      department: c.department ?? null,
      title: c.title ?? null,
      companyName: c.companyName ?? null,
    }));
  }

  async update(id: string, tenantId: string, data: CustomerUpdateData): Promise<Customer> {
    // Verify customer exists and belongs to tenant
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Customer not found', 404);
    }

    // Update customer
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        department: data.department,
        companyName: data.companyName,
        companyId: data.companyId,
        phone: data.phone,
        status: data.status,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        company: true,
      },
    });

    return customer;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Customer not found', 404);
    }

    await this.prisma.customer.delete({
      where: { id },
    });
  }

  async lookupByTaxId(taxId: string, tenantId: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: {
        taxId,
        tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        company: true,
      },
    });
  }

  async lookupByEmail(email: string, tenantId: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: {
        email,
        tenantId,
      },
      include: {
        address: true,
        contact: true,
        bankAccount: true,
        company: true,
      },
    });
  }
}

