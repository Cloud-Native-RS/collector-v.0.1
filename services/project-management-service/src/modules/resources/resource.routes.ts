import { Router } from 'express';
import { resourceController } from './resource.controller';
import { authenticate, requireProjectManager } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(tenantMiddleware);

router.post('/', requireProjectManager, (req, res) => resourceController.createResource(req, res));
router.get('/', (req, res) => resourceController.getAllResources(req, res));
router.get('/:id', (req, res) => resourceController.getResource(req, res));
router.get('/:id/availability', (req, res) => resourceController.getResourceAvailability(req, res));
router.put('/:id', requireProjectManager, (req, res) => resourceController.updateResource(req, res));
router.delete('/:id', requireProjectManager, (req, res) => resourceController.deleteResource(req, res));
router.post('/allocate', requireProjectManager, (req, res) => resourceController.allocateResource(req, res));
router.post('/deallocate', requireProjectManager, (req, res) => resourceController.deallocateResource(req, res));

export default router;

