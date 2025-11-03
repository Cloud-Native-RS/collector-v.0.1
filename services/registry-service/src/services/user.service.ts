import { PrismaClient, type User, type Tenant } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/error-handler';

export interface UserWithTenants extends Omit<User, 'password'> {
  tenants: Array<{
    id: string;
    tenant: Tenant;
    role: string;
    isActive: boolean;
  }>;
}

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    email: string;
    password: string;
    name: string;
    avatar?: string;
    tenantIds?: string[]; // List of tenant IDs to assign
    primaryTenantId?: string;
  }): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Get or create default tenant if none provided
    let tenantIds = data.tenantIds || [];
    let primaryTenantId = data.primaryTenantId;

    if (tenantIds.length === 0) {
      // Find or create default tenant
      let defaultTenant = await this.prisma.tenant.findUnique({
        where: { name: 'default-tenant' },
      });

      if (!defaultTenant) {
        defaultTenant = await this.prisma.tenant.create({
          data: {
            name: 'default-tenant',
            displayName: 'Default Tenant',
          },
        });
      }

      tenantIds = [defaultTenant.id];
      primaryTenantId = defaultTenant.id;
    }

    // If primaryTenantId not set, use first tenant
    if (!primaryTenantId && tenantIds.length > 0) {
      primaryTenantId = tenantIds[0];
    }

    // Create user with tenants
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        avatar: data.avatar,
        primaryTenantId,
        tenants: {
          create: tenantIds.map(tenantId => ({
            tenantId,
            role: 'user',
            isActive: true,
          })),
        },
      },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    // Return user without password
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        primaryTenant: true,
      },
    });

    if (!user) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByIdWithTenants(id: string): Promise<UserWithTenants | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenants: {
          where: { isActive: true },
          include: {
            tenant: true,
          },
        },
        primaryTenant: true,
      },
    });

    if (!user) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithTenants;
  }

  async getUserTenants(userId: string): Promise<Array<{
    id: string;
    tenant: Tenant;
    role: string;
    isActive: boolean;
  }>> {
    const userTenants = await this.prisma.userTenant.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    });

    return userTenants.map((ut: {
      id: string;
      tenant: Tenant;
      role: string;
      isActive: boolean;
    }) => ({
      id: ut.id,
      tenant: ut.tenant,
      role: ut.role,
      isActive: ut.isActive,
    }));
  }

  async addUserToTenant(userId: string, tenantId: string, role: string = 'user'): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    // Check if relation already exists
    const existing = await this.prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (existing) {
      // Update if exists but inactive
      if (!existing.isActive) {
        await this.prisma.userTenant.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            role,
          },
        });
      }
      return;
    }

    // Create relation
    await this.prisma.userTenant.create({
      data: {
        userId,
        tenantId,
        role,
        isActive: true,
      },
    });
  }

  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    const userTenant = await this.prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!userTenant) {
      throw new AppError('User is not associated with this tenant', 404);
    }

    // Soft delete by setting isActive to false
    await this.prisma.userTenant.update({
      where: { id: userTenant.id },
      data: { isActive: false },
    });
  }

  async setPrimaryTenant(userId: string, tenantId: string): Promise<void> {
    // Verify user has access to tenant
    const userTenant = await this.prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!userTenant || !userTenant.isActive) {
      throw new AppError('User does not have access to this tenant', 403);
    }

    // Update primary tenant
    await this.prisma.user.update({
      where: { id: userId },
      data: { primaryTenantId: tenantId },
    });
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async update(id: string, data: Partial<{
    name: string;
    email: string;
    avatar: string;
    bio: string;
    urls: string[];
    dateOfBirth: Date;
    language: string;
    isActive: boolean;
  }>): Promise<Omit<User, 'password'>> {
    // If email is being updated, check if it's already taken by another user
    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (existingUser && existingUser.id !== id) {
        throw new AppError('Email is already taken by another user', 400);
      }
    }

    // Build update data, excluding undefined values
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.urls !== undefined) updateData.urls = data.urls;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isOldPasswordValid = await this.verifyPassword(user, oldPassword);
    if (!isOldPasswordValid) {
      throw new AppError('Invalid old password', 400);
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async createTenantForUser(userId: string, tenantData: {
    name?: string;
    displayName: string;
  }): Promise<Tenant> {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate slug from displayName if name is not provided
      let tenantName = tenantData.name || tenantData.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Ensure tenant name is not empty
      if (!tenantName || tenantName.trim().length === 0) {
        tenantName = `tenant-${Date.now()}`;
      }

      // Check if tenant name already exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { name: tenantName },
      });

      if (existingTenant) {
        // Append number if name exists
        let counter = 1;
        let uniqueName = `${tenantName}-${counter}`;
        while (await this.prisma.tenant.findUnique({ where: { name: uniqueName } })) {
          counter++;
          uniqueName = `${tenantName}-${counter}`;
        }
        tenantName = uniqueName;
      }

      // Create tenant
      const tenant = await this.prisma.tenant.create({
        data: {
          name: tenantName,
          displayName: tenantData.displayName,
          isActive: true,
        },
      });

      // Add user to tenant with owner role
      await this.addUserToTenant(userId, tenant.id, 'owner');

      return tenant;
    } catch (error) {
      // Re-throw AppError as-is
      if (error instanceof AppError) {
        throw error;
      }
      // Wrap other errors (Prisma errors, etc.)
      console.error('Error creating tenant:', error);
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to create tenant',
        500
      );
    }
  }
}

