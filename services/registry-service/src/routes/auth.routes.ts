import express from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error-handler';
import { z } from 'zod';

const router = express.Router();
const userService = new UserService(prisma);

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().optional(),
});

/**
 * Generate JWT token
 */
function generateToken(userId: string, email: string, tenantId: string): string {
  const secret = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      userId,
      email,
      tenantId,
    },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await userService.findByEmail(validatedData.email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await userService.verifyPassword(user, validatedData.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Get user with tenants
    const userWithTenants = await userService.findByIdWithTenants(user.id);
    
    if (!userWithTenants) {
      throw new AppError('Failed to load user tenants', 500);
    }

    // Get primary tenant ID (fallback to first tenant if not set)
    const primaryTenantId = userWithTenants.primaryTenantId || 
      (userWithTenants.tenants.length > 0 ? userWithTenants.tenants[0].tenant.id : null);

    if (!primaryTenantId) {
      throw new AppError('User has no active tenants', 403);
    }

    // Generate token with primary tenant
    const token = generateToken(user.id, user.email, primaryTenantId);

    // Format tenants for response
    const tenants = userWithTenants.tenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      displayName: ut.tenant.displayName,
      role: ut.role,
      isPrimary: ut.tenant.id === primaryTenantId,
    }));

    // Return user and token (password is already excluded from UserWithTenants type)
    const { tenants: _, ...userWithoutPassword } = userWithTenants;

    res.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          primaryTenantId,
        },
        tenants,
        accessToken: token,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Sign up new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or duplicate email
 */
router.post('/signup', async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    // Create user
    const user = await userService.create({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name,
      avatar: validatedData.avatar,
    });

    // Get user with tenants
    const userWithTenants = await userService.findByIdWithTenants(user.id);
    
    if (!userWithTenants) {
      throw new AppError('Failed to load user tenants', 500);
    }

    // Get primary tenant ID
    const primaryTenantId = userWithTenants.primaryTenantId || 
      (userWithTenants.tenants.length > 0 ? userWithTenants.tenants[0].tenant.id : null);

    if (!primaryTenantId) {
      throw new AppError('Failed to set primary tenant', 500);
    }

    // Generate token with primary tenant
    const token = generateToken(user.id, user.email, primaryTenantId);

    // Format tenants for response
    const tenants = userWithTenants.tenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      displayName: ut.tenant.displayName,
      role: ut.role,
      isPrimary: ut.tenant.id === primaryTenantId,
    }));

    // Return user without password and internal tenants structure (password is already excluded from UserWithTenants type)
    const { tenants: __, ...userWithoutPassword } = userWithTenants;

    res.status(201).json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          primaryTenantId,
        },
        tenants,
        accessToken: token,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/auth/tenants:
 *   get:
 *     summary: Get all tenants for current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tenants
 *       401:
 *         description: Unauthorized
 */
router.get('/tenants', async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';

    // Verify token
    const decoded = jwt.verify(token, secret) as { userId: string };
    const tenants = await userService.getUserTenants(decoded.userId);

    const formattedTenants = tenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      displayName: ut.tenant.displayName,
      role: ut.role,
    }));

    res.json({
      success: true,
      data: formattedTenants,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
});

/**
 * @swagger
 * /api/auth/switch-tenant:
 *   post:
 *     summary: Switch to a different tenant
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *             properties:
 *               tenantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token generated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User doesn't have access to tenant
 */
router.post('/switch-tenant', async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';

    // Verify token
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    const { tenantId } = req.body;

    if (!tenantId) {
      throw new AppError('tenantId is required', 400);
    }

    // Verify user has access to tenant
    const userTenants = await userService.getUserTenants(decoded.userId);
    const hasAccess = userTenants.some(ut => ut.tenant.id === tenantId && ut.isActive);

    if (!hasAccess) {
      throw new AppError('User does not have access to this tenant', 403);
    }

    // Update primary tenant
    await userService.setPrimaryTenant(decoded.userId, tenantId);

    // Generate new token with new tenant
    const newToken = generateToken(decoded.userId, decoded.email, tenantId);

    res.json({
      success: true,
      data: {
        accessToken: newToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
});

router.get('/me', async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';

    // Verify token
    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = await userService.findByIdWithTenants(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Format tenants for response
    const primaryTenantId = user.primaryTenantId || 
      (user.tenants.length > 0 ? user.tenants[0].tenant.id : null);

    const tenants = user.tenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      displayName: ut.tenant.displayName,
      role: ut.role,
      isPrimary: ut.tenant.id === primaryTenantId,
    }));

    // Password is already excluded from UserWithTenants type
    const { tenants: __, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        ...userWithoutPassword,
        primaryTenantId,
        tenants,
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 *               language:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';

    // Verify token
    const decoded = jwt.verify(token, secret) as { userId: string };

    // Validate input
    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email('Invalid email format').optional(),
      avatar: z.string().optional(),
      bio: z.string().max(500).optional().or(z.literal('')),
      urls: z.array(z.string().url('Invalid URL format')).optional(),
      dateOfBirth: z.union([
        z.string().datetime(),
        z.string().transform((val) => {
          const date = new Date(val);
          return isNaN(date.getTime()) ? undefined : date;
        }),
      ]).optional(),
      language: z.string().length(2).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Update user
    const updatedUser = await userService.update(decoded.userId, validatedData);

    // Get updated user with tenants for response
    const userWithTenants = await userService.findByIdWithTenants(updatedUser.id);

    if (!userWithTenants) {
      throw new AppError('Failed to load updated user', 500);
    }

    const primaryTenantId = userWithTenants.primaryTenantId || 
      (userWithTenants.tenants.length > 0 ? userWithTenants.tenants[0].tenant.id : null);

    const tenants = userWithTenants.tenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      displayName: ut.tenant.displayName,
      role: ut.role,
      isPrimary: ut.tenant.id === primaryTenantId,
    }));

    const { tenants: __, ...userWithoutPassword } = userWithTenants;

    res.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          primaryTenantId,
        },
        tenants,
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof z.ZodError) {
      next(new AppError('Validation error: ' + error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
});

/**
 * @swagger
 * /api/auth/create-tenant:
 *   post:
 *     summary: Create a new tenant and add current user to it
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *             properties:
 *               displayName:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/create-tenant', async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';

    // Verify token
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };

    // Validate input
    const createTenantSchema = z.object({
      displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
      name: z.string().optional(),
    });

    const validatedData = createTenantSchema.parse(req.body);

    // Create tenant and add user to it
    const tenant = await userService.createTenantForUser(decoded.userId, {
      displayName: validatedData.displayName,
      name: validatedData.name,
    });

    // Format response
    res.status(201).json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        displayName: tenant.displayName,
        isActive: tenant.isActive,
      },
    });
  } catch (error) {
    console.error('Create tenant route error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof z.ZodError) {
      next(new AppError('Validation error: ' + error.errors.map(e => e.message).join(', '), 400));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to create tenant', 500));
    }
  }
});

export default router;

