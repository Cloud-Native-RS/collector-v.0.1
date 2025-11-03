# Inventory & Product Management Service

A production-ready microservice for managing products, stock, warehouses, suppliers, and purchase orders within the Collector platform. This service acts as the central inventory system with multi-tenant support, real-time stock tracking, and integration with delivery notes, orders, and invoices.

## 🎯 Core Features

### Product Management
- Complete CRUD operations for products and services
- SKU-based product identification
- Categorization (Electronics, Clothing, Food, Books, etc.)
- Multiple unit of measure support (Piece, KG, Liter, Box, Pallet, Carton)
- Price and tax management
- Product search and filtering

### Warehouse Management
- Multi-warehouse support
- Warehouse capacity tracking
- Location management
- Warehouse status (Active, Inactive, Maintenance)

### Stock Management
- Real-time stock tracking across warehouses
- Reserved quantity management for orders
- Stock adjustment capabilities (IN, OUT, ADJUSTMENT, TRANSFER)
- Minimum threshold and reorder level configuration
- Low stock alerts
- Complete audit trail via stock transactions

### Purchase Order Management
- Create and manage purchase orders with suppliers
- Purchase order status tracking (Draft, Sent, Received, Canceled, Partially Received)
- Line item management
- Automatic stock updates upon receipt
- Expected delivery date tracking

### Supplier Management
- Complete supplier contact information
- Supplier status management
- Purchase order history per supplier

### Delivery Note Integration
- Sync delivery notes with inventory
- Automatic stock deductions for outgoing shipments
- Stock additions for incoming deliveries
- Transaction history per product and warehouse

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Installation

1. **Clone and navigate to the service:**
```bash
cd services/inventory-service
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database:**
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed
```

5. **Start the development server:**
```bash
npm run dev
```

The service will be available at `http://localhost:3002`

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f inventory-service

# Stop services
docker-compose down
```

## 📚 API Endpoints

### Products
- `POST /api/products` - Create a new product
- `GET /api/products` - List all products (with filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/sku/:sku` - Get product by SKU
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Warehouses
- `POST /api/warehouses` - Create a new warehouse
- `GET /api/warehouses` - List all warehouses
- `GET /api/warehouses/:id` - Get warehouse by ID
- `PUT /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Delete warehouse

### Stock
- `POST /api/stock/adjust` - Adjust stock levels
- `POST /api/stock/reserve` - Reserve stock for orders
- `POST /api/stock/unreserve` - Release reserved stock
- `GET /api/stock/check` - Check stock availability
- `GET /api/stock/product/:productId` - Get stock by product
- `GET /api/stock/warehouse/:warehouseId` - Get stock by warehouse
- `GET /api/stock/low-stock` - Get low stock items

### Suppliers
- `POST /api/suppliers` - Create a new supplier
- `GET /api/suppliers` - List all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchase Orders
- `POST /api/purchase-orders` - Create a new purchase order
- `GET /api/purchase-orders` - List all purchase orders (with filters)
- `GET /api/purchase-orders/:id` - Get purchase order by ID
- `PUT /api/purchase-orders/:id` - Update purchase order
- `POST /api/purchase-orders/:id/receive` - Receive items from PO
- `POST /api/purchase-orders/:id/cancel` - Cancel purchase order

### Delivery Sync
- `POST /api/delivery-sync` - Sync delivery note with inventory
- `GET /api/delivery-sync/note/:deliveryNoteId` - Get syncs by delivery note
- `GET /api/delivery-sync/product/:productId` - Get syncs by product
- `GET /api/delivery-sync/warehouse/:warehouseId` - Get syncs by warehouse

## 🔐 Security

- JWT-based authentication
- Multi-tenant data isolation
- Input validation via Zod schemas
- SQL injection prevention (Prisma ORM)
- Security headers via Helmet
- CORS protection

## 📊 Database Schema

The service uses PostgreSQL with the following main entities:

1. **Product** - Product master data
2. **Warehouse** - Warehouse locations
3. **Stock** - Stock levels per product and warehouse
4. **Supplier** - Supplier contact information
5. **PurchaseOrder** - Purchase orders with line items
6. **DeliveryNoteSync** - Delivery note synchronization records
7. **StockTransaction** - Complete audit trail of all stock movements

## 🔄 Integration Points

### Orders Service
- Check stock availability before order creation
- Reserve stock for pending orders
- Unreserve stock when orders are canceled

### Delivery Service
- Sync delivery notes for stock deductions
- Track incoming shipments and update inventory

### Invoices Service
- Provide product information and pricing
- Support tax calculations per product

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 📖 Documentation

- [API Integration Guide](./API_INTEGRATION.md) - Complete API reference with examples
- [Architecture Documentation](./ARCHITECTURE.md) - System architecture and design patterns
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Interactive API Docs](http://localhost:3002/api-docs) - Swagger UI (when running)

## 🛠️ Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database management
npm run db:generate   # Generate Prisma Client
npm run db:migrate    # Run migrations
npm run db:seed       # Seed sample data
npm run db:studio     # Open Prisma Studio
```

## 🌍 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3002

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db

# Security
JWT_SECRET=your-secret-key

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📈 Monitoring & Logging

- Health check endpoint: `GET /health`
- Request logging via Morgan
- Error tracking and reporting
- Stock transaction audit trail

## 🤝 Contributing

This service follows the Collector platform architecture:
- Domain-driven design
- Clean architecture principles
- TypeScript for type safety
- Prisma for database management
- Express.js for HTTP server

## 📝 License

Part of the Collector Platform

## 🆘 Support

For issues and questions:
1. Check the API documentation
2. Review the architecture guide
3. Contact the platform team

