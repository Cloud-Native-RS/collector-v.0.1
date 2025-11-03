import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import deliveryNoteRoutes from './routes/delivery-notes.routes';
import carrierRoutes from './routes/carriers.routes';
import { errorHandler } from './middleware/error-handler';
import { swaggerSpec, swaggerUi } from './config/swagger';
import { DeliveryService } from './services/delivery.service';
import { EventConsumer } from './utils/event-consumer';
import { eventPublisher } from './utils/event-publisher';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3008;

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Initialize services
const deliveryService = new DeliveryService(prisma, eventPublisher);
const eventConsumer = new EventConsumer(deliveryService);

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
      service: 'delivery-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'delivery-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/carriers', carrierRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to messaging
(async () => {
  await eventPublisher.connect();
  await eventConsumer.connect();
})();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await eventConsumer.close();
  await eventPublisher.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Delivery Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;

