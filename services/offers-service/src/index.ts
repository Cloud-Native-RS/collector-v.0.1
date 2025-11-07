import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import offerRoutes from './routes/offer.routes';
import publicOfferRoutes from './routes/public-offer.routes';
import lineItemRoutes from './routes/line-item.routes';
import approvalRoutes from './routes/approval.routes';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { swaggerSpec, swaggerUi } from './config/swagger';
import { JobService } from './services/job.service';
import { prisma } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Re-export prisma for convenience
export { prisma };

// Initialize background jobs
const jobService = new JobService();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // JSON parser
app.use(express.urlencoded({ extended: true })); // URL-encoded parser

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      service: 'offers-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'offers-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public routes (no authentication required)
app.use('/api/approvals', approvalRoutes);
app.use('/api/offers', publicOfferRoutes);

// Protected routes (require authentication and tenant context)
app.use('/api/offers', authMiddleware, tenantMiddleware, offerRoutes);
app.use('/api/offers', authMiddleware, tenantMiddleware, lineItemRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize event bus
import { eventBus } from './utils/event-bus';
eventBus.connect().catch(console.error);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  jobService.stop();
  await eventBus.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Offers Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  
  // Start background jobs
  if (process.env.NODE_ENV !== 'test') {
    jobService.start();
  }
});

export default app;

