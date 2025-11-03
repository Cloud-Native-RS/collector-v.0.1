import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { EmployeeService } from '../services/employee.service';
import { EventService } from '../services/event.service';
import { AppError } from '../middleware/error-handler';

const router = Router();
const eventService = new EventService();

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - jobTitle
 *               - employmentType
 *               - startDate
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               department:
 *                 type: string
 *               employmentType:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, CONTRACTOR, INTERN, TEMPORARY]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               managerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  [
    body('firstName').isString().notEmpty(),
    body('lastName').isString().notEmpty(),
    body('email').isEmail(),
    body('phone').optional().isString(),
    body('jobTitle').isString().notEmpty(),
    body('department').optional().isString(),
    body('employmentType').isIn(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY']),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('managerId').optional().isUUID(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const employee = await EmployeeService.createEmployee(req.body, tenantId);
      
      // Emit employee.hired event
      eventService.emitEmployeeHired(employee.id, {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        jobTitle: employee.jobTitle,
        department: employee.department,
        startDate: employee.startDate,
        tenantId,
      }).catch(console.error);

      res.status(201).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *       404:
 *         description: Employee not found
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const employee = await EmployeeService.getEmployeeById(req.params.id, tenantId);

      if (!employee) {
        return next(new AppError('Employee not found', 404));
      }

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: List employees with filters
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACTOR, INTERN, TEMPORARY]
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get(
  '/',
  [
    query('department').optional().isString(),
    query('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY']),
    query('managerId').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const filters = {
        department: req.query.department as string | undefined,
        employmentType: req.query.employmentType as any,
        managerId: req.query.managerId as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await EmployeeService.listEmployees(tenantId, filters);

      res.json({
        success: true,
        data: result.employees,
        meta: {
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               department:
 *                 type: string
 *               employmentType:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, CONTRACTOR, INTERN, TEMPORARY]
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 */
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('firstName').optional().isString().notEmpty(),
    body('lastName').optional().isString().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().isString(),
    body('jobTitle').optional().isString().notEmpty(),
    body('department').optional().isString(),
    body('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('managerId').optional().isUUID(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const employee = await EmployeeService.updateEmployee(req.params.id, req.body, tenantId);

      // Emit employee.left event if endDate is set
      if (req.body.endDate && employee.endDate) {
        eventService.emitEmployeeLeft(employee.id, {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          endDate: employee.endDate,
          tenantId,
        }).catch(console.error);
      }

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete employee (soft delete)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 */
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const employee = await EmployeeService.deleteEmployee(req.params.id, tenantId);

      // Emit employee.left event
      eventService.emitEmployeeLeft(employee.id, {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        endDate: employee.endDate,
        tenantId,
      }).catch(console.error);

      res.json({
        success: true,
        message: 'Employee deleted successfully',
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

