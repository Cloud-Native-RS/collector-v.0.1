import { Router } from 'express';
import { projectController } from './project.controller';
import { authenticate, requireProjectManager } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.post('/', requireProjectManager, (req, res) => projectController.createProject(req, res));
router.get('/', (req, res) => projectController.getAllProjects(req, res));
router.get('/:id', (req, res) => projectController.getProject(req, res));
router.get('/:id/progress', (req, res) => projectController.getProjectProgress(req, res));
router.put('/:id', requireProjectManager, (req, res) => projectController.updateProject(req, res));
router.delete('/:id', requireProjectManager, (req, res) => projectController.deleteProject(req, res));

export default router;

