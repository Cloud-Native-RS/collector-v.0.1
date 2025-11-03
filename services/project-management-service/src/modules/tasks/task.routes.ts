import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticate, requireProjectManager } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.post('/', requireProjectManager, (req, res) => taskController.createTask(req, res));
router.get('/', (req, res) => taskController.getAllTasks(req, res));
router.get('/:id', (req, res) => taskController.getTask(req, res));
router.put('/:id', (req, res) => taskController.updateTask(req, res));
router.delete('/:id', requireProjectManager, (req, res) => taskController.deleteTask(req, res));

export default router;

