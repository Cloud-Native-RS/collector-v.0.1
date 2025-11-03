import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.get('/projects', (req, res) => reportController.getProjectSummary(req, res));
router.get('/tasks', (req, res) => reportController.getTasksByStatus(req, res));
router.get('/resources', (req, res) => reportController.getResourceUtilization(req, res));
router.get('/overdue-tasks', (req, res) => reportController.getOverdueTasks(req, res));
router.get('/delayed-milestones', (req, res) => reportController.getDelayedMilestones(req, res));
router.get('/team-workload', (req, res) => reportController.getTeamWorkload(req, res));

export default router;

