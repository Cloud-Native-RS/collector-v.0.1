import { Router, Request, Response, NextFunction } from 'express';
import { OfferService } from '../services/offer.service';
import { AppError } from '../middleware/error-handler';

const router = Router();

/**
 * @swagger
 * /api/offers/public/{token}:
 *   get:
 *     summary: Get offer by public token (no auth required)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer retrieved successfully
 *       404:
 *         description: Offer not found or invalid token
 */
router.get(
  '/public/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const offer = await OfferService.getOfferByToken(req.params.token);

      if (!offer) {
        return next(new AppError('Offer not found or invalid token', 404));
      }

      // Mark as viewed
      await OfferService.markAsViewed(offer.id).catch(console.error);

      res.json({
        success: true,
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

