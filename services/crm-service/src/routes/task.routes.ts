import express from 'express';
import { TaskService } from '../services/task.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { taskCreateSchema, taskUpdateSchema, taskQuerySchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const taskService = new TaskService(prisma);

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CALL, EMAIL, MEETING, NOTE, FOLLOW_UP]
 *               leadId:
 *                 type: string
 *               dealId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = taskCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    // Convert dueDate from string to Date if provided
    const taskData: Parameters<typeof taskService.create>[0] = {
      ...validatedData,
      dueDate: validatedData.dueDate 
        ? (typeof validatedData.dueDate === 'string' 
            ? new Date(validatedData.dueDate) 
            : validatedData.dueDate) as Date
        : undefined,
    };

    const task = await taskService.create(taskData);
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dealId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const queryParams = taskQuerySchema.parse(req.query);

    const { tasks, total } = await taskService.getAll(tenantId, queryParams);
    res.json({
      success: true,
      data: tasks,
      meta: {
        total,
        skip: queryParams.skip,
        take: queryParams.take,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const task = await taskService.getById(id, tenantId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = taskUpdateSchema.parse(req.body);

    // Convert dueDate from string to Date if provided
    const { dueDate, ...rest } = validatedData;
    const updateData: Parameters<typeof taskService.update>[2] = {
      ...rest,
      ...(dueDate !== undefined && {
        dueDate: (typeof dueDate === 'string'
          ? new Date(dueDate)
          : dueDate) as Date,
      }),
    };

    const task = await taskService.update(id, tenantId, updateData);
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await taskService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   put:
 *     summary: Mark task as complete
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/complete', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const task = await taskService.complete(id, tenantId);
    res.json({
      success: true,
      data: task,
      message: 'Task marked as complete',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

