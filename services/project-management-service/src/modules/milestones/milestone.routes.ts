import { Router } from 'express';
import { milestoneController } from './milestone.controller';
import { authenticate, requireProjectManager } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.post('/', requireProjectManager, (req, res) => milestoneController.createMilestone(req, res));
router.get('/', (req, res) => milestoneController.getAllMilestones(req, res));
router.get('/:id', (req, res) => milestoneController.getMilestone(req, res));
router.put('/:id', requireProjectManager, (req, res) => milestoneController.updateMilestone(req, res));
router.delete('/:id', requireProjectManager, (req, res) => milestoneController.deleteMilestone(req, res));

export default router;

