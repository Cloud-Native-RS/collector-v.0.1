import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { WorkflowService } from '../services/workflow.service';
import { AppError } from '../middleware/error-handler';

const router = Router();

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
 * /api/approvals/{token}:
 *   post:
 *     summary: Approve or reject offer by token (external approval link)
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: token
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
 *             required:
 *               - approverEmail
 *               - approved
 *             properties:
 *               approverEmail:
 *                 type: string
 *                 format: email
 *               approved:
 *                 type: boolean
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer approval status updated
 */
router.post(
  '/:token',
  [
    param('token').isUUID(),
    body('approverEmail').isEmail(),
    body('approved').isBoolean(),
    body('comments').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await WorkflowService.approveOfferByToken(
        req.params.token,
        req.body.approverEmail,
        req.body.approved,
        req.body.comments
      );

      res.json({
        success: true,
        message: `Offer ${req.body.approved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

