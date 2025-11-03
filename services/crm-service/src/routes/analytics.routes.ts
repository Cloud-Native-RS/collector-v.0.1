import express from 'express';
import { LeadService } from '../services/lead.service';
import { DealService } from '../services/deal.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = express.Router();
const leadService = new LeadService(prisma);
const dealService = new DealService(prisma);

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/analytics/pipeline:
 *   get:
 *     summary: Get sales pipeline statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pipeline statistics
 */
router.get('/pipeline', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;

    const pipelineStats = await dealService.getPipelineStats(tenantId);

    res.json({
      success: true,
      data: pipelineStats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/leads-by-source:
 *   get:
 *     summary: Get leads grouped by source
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leads by source statistics
 */
router.get('/leads-by-source', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;

    const stats = await leadService.getStats(tenantId);

    res.json({
      success: true,
      data: {
        bySource: stats.bySource,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/conversion-rate:
 *   get:
 *     summary: Get lead conversion metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversion rate statistics
 */
router.get('/conversion-rate', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;

    const stats = await leadService.getStats(tenantId);
    const totalLeads = stats.total;
    const convertedLeads = stats.byStatus.WON;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        byStatus: stats.byStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/deals-by-stage:
 *   get:
 *     summary: Get deals grouped by pipeline stage
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deals by stage statistics
 */
router.get('/deals-by-stage', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;

    const pipelineStats = await dealService.getPipelineStats(tenantId);

    res.json({
      success: true,
      data: {
        stages: pipelineStats.stages,
        totalValue: pipelineStats.totalValue,
        weightedValue: pipelineStats.weightedValue,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

