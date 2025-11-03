import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import dunningRoutes from './routes/dunning.routes';
import { errorHandler } from './middleware/error-handler';
import { swaggerSpec, swaggerUi } from './config/swagger';
import { initNATS } from './services/event.service';
import { prisma } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3004;

// Re-export prisma for convenience
export { prisma };

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      service: 'invoices-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'invoices-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dunnings', dunningRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize NATS connection
initNATS().catch(console.error);

// Graceful shutdown is handled in config/database.ts

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Invoices Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;
