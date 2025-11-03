# HR & People Management Service

Microservice for managing employees, attendance, payroll, and recruitment in a multi-tenant environment.

## Features

- **Employee Management**: Complete employee lifecycle management (create, update, delete, list)
- **Attendance Tracking**: Check-in/check-out, leave management, remote work tracking
- **Payroll Processing**: Salary calculation, bonuses, deductions, taxes, automated payroll processing
- **Recruitment**: Job postings and applicant tracking workflow
- **Event-Driven**: Emits events for employee.hired, employee.left, payroll.processed, attendance.missed
- **Multi-Tenant**: Full tenant isolation for all operations
- **Integration Ready**: Integration with Project Management and Accounting services

## Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # Optional: seed sample data
```

4. Start development server:
```bash
npm run dev
```

The service will run on `http://localhost:3006`

### Docker Setup

```bash
docker-compose up -d
```

## API Documentation

Once the service is running, visit:
- Swagger UI: `http://localhost:3006/api-docs`

## API Endpoints

### Employees
- `POST /api/employees` - Create employee
- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee (soft delete)

### Attendance
- `POST /api/attendance` - Create attendance record
- `POST /api/attendance/check-in` - Check in employee
- `POST /api/attendance/check-out` - Check out employee
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/:id` - Get attendance by ID

### Payroll
- `POST /api/payroll` - Create payroll record
- `POST /api/payroll/process` - Process payroll for period
- `GET /api/payroll` - List payroll records
- `GET /api/payroll/:id` - Get payroll by ID
- `GET /api/payroll/employee/:employeeId` - Get employee payroll

### Recruitment
- `POST /api/recruiting/job-postings` - Create job posting
- `GET /api/recruiting/job-postings` - List job postings
- `GET /api/recruiting/job-postings/:id` - Get job posting by ID
- `POST /api/recruiting/applicants` - Create applicant
- `GET /api/recruiting/applicants` - List applicants
- `GET /api/recruiting/applicants/:id` - Get applicant by ID
- `PUT /api/recruiting/applicants/:id` - Update applicant (hiring workflow)

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

The JWT token must contain:
- `userId`: User ID
- `tenantId`: Tenant ID for multi-tenant isolation
- `role`: User role (HR manager, employee, recruiter)

## Events

The service emits the following events:

- `employee.hired` - When an employee is created or hired from applicant
- `employee.left` - When an employee's end date is set
- `payroll.processed` - When payroll is processed or paid
- `attendance.missed` - When an employee is absent without leave

Events are sent to `EVENT_WEBHOOK_URL` if configured, or logged to console.

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

### Entities

- **Employee**: Employee master data
- **Attendance**: Daily attendance records
- **Payroll**: Payroll records for employees
- **JobPosting**: Job postings for recruitment
- **Applicant**: Applicants and their status in hiring workflow

## Environment Variables

- `PORT` - Server port (default: 3006)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token verification
- `CORS_ORIGIN` - CORS allowed origin
- `EVENT_WEBHOOK_URL` - Webhook URL for event notifications
- `PROJECT_MANAGEMENT_API_URL` - Project Management service URL
- `PROJECT_MANAGEMENT_API_KEY` - API key for Project Management service
- `ACCOUNTING_API_URL` - Accounting service URL
- `ACCOUNTING_API_KEY` - API key for Accounting service

## Testing

```bash
npm test
npm run test:coverage
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Run migrations:
```bash
npm run db:migrate:deploy
```

3. Start the service:
```bash
npm start
```

## License

Part of the Collector Platform.

