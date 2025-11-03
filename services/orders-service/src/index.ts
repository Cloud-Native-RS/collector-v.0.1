import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import orderRoutes from './routes/order.routes';
import { errorHandler } from './middleware/error-handler';
import { swaggerSpec, swaggerUi } from './config/swagger';
import { eventBus, EventType, OfferApprovedEvent } from './utils/event-bus';
import { OrderService } from './services/order.service';
import { prisma } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Re-export prisma for convenience
export { prisma };

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
      service: 'orders-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'orders-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/orders', orderRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize event bus and subscribe to offer.approved
const initializeEventBus = async () => {
  try {
    await eventBus.connect();

    // Subscribe to offer.approved events to auto-create orders
    await eventBus.subscribe(EventType.OFFER_APPROVED, async (event: OfferApprovedEvent) => {
      try {
        const orderService = new OrderService(prisma);
        const { data } = event;

        console.log(`📥 Processing offer.approved event for offer ${data.offerNumber}`);
        
        // Note: Auto-creating orders from offers requires shipping address.
        // This is typically provided when the customer approves the offer.
        // For now, we log the event. Full implementation would:
        // 1. Fetch customer's default shipping address from registry service, OR
        // 2. Require shipping address to be included in the offer approval event
        console.log(`⚠️ Cannot auto-create order from offer ${data.offerNumber}: shipping address required`);
        
      } catch (error) {
        console.error('Error processing offer.approved event:', error);
        throw error; // Re-throw to trigger requeue
      }
    });

    console.log('✅ Event bus initialized and subscribed to offer.approved');
  } catch (error) {
    console.error('Failed to initialize event bus:', error);
    // Service can continue without event bus
  }
};

// Initialize event bus
initializeEventBus().catch(console.error);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await eventBus.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Additional shutdown handled in config/database.ts

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Orders Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;

