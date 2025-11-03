# API Examples

## Authentication

All requests require JWT authentication in the header:

```
Authorization: Bearer <your-jwt-token>
```

JWT payload structure:
```json
{
  "userId": "user-123",
  "tenantId": "tenant-abc",
  "role": "PROJECT_MANAGER"
}
```

## Project Examples

### Create Project

```http
POST /api/projects
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "IN_PROGRESS",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-03-31T23:59:59Z"
}
```

### Get Project Progress

```http
GET /api/projects/{projectId}/progress
```

Response:
```json
{
  "projectId": "uuid",
  "projectName": "Website Redesign",
  "totalTasks": 10,
  "completedTasks": 5,
  "inProgressTasks": 3,
  "blockedTasks": 1,
  "progressPercentage": 50,
  "totalEstimatedHours": 320,
  "totalActualHours": 180,
  "milestones": [...]
}
```

## Milestone Examples

### Create Milestone

```http
POST /api/milestones
Content-Type: application/json

{
  "projectId": "uuid",
  "name": "Design Phase Complete",
  "description": "UI/UX design and mockups completed",
  "dueDate": "2024-01-31T23:59:59Z"
}
```

## Task Examples

### Create Task with Dependencies

```http
POST /api/tasks
Content-Type: application/json

{
  "projectId": "uuid",
  "milestoneId": "uuid",
  "name": "Implement user authentication",
  "description": "Build login and registration flows",
  "assignedTo": "user-123",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2024-02-15T23:59:59Z",
  "estimatedHours": 40,
  "dependencies": ["task-uuid-1", "task-uuid-2"]
}
```

### Update Task Status

```http
PUT /api/tasks/{taskId}
Content-Type: application/json

{
  "status": "COMPLETED",
  "actualHours": 38
}
```

### Try to Complete Task with Unfinished Dependencies

This will fail with error:
```json
{
  "error": "Cannot complete task. Dependencies must be completed first: Setup database, Configure API"
}
```

## Resource Examples

### Create Resource

```http
POST /api/resources
Content-Type: application/json

{
  "type": "EMPLOYEE",
  "name": "John Doe",
  "userId": "user-123",
  "availabilitySchedule": "{\"monday\":{\"start\":\"09:00\",\"end\":\"17:00\"}}"
}
```

### Allocate Resource to Task

```http
POST /api/resources/allocate
Content-Type: application/json

{
  "taskId": "uuid",
  "resourceId": "uuid",
  "allocatedHours": 20
}
```

### Check Resource Availability

```http
GET /api/resources/{resourceId}/availability?startDate=2024-01-01&endDate=2024-01-31
```

## Report Examples

### Get Overdue Tasks

```http
GET /api/reports/overdue-tasks
```

Response:
```json
[
  {
    "id": "uuid",
    "name": "Task name",
    "dueDate": "2024-01-15T00:00:00Z",
    "status": "IN_PROGRESS",
    "project": {
      "id": "uuid",
      "name": "Project name"
    }
  }
]
```

### Get Team Workload

```http
GET /api/reports/team-workload
```

Response:
```json
[
  {
    "userId": "user-123",
    "totalTasks": 5,
    "totalEstimatedHours": 120,
    "totalActualHours": 80,
    "highPriorityTasks": 2
  }
]
```

## Event Listeners

### Task Completed Event

```javascript
eventEmitter.on('task.completed', (event) => {
  const { taskId, projectId, assignedTo, completedAt, tenantId } = event;
  // Send notification to assigned user
  // Update project progress
  // Trigger billing if billable
});
```

### Milestone Achieved Event

```javascript
eventEmitter.on('milestone.achieved', (event) => {
  const { milestoneId, projectId, achievedAt, tenantId } = event;
  // Notify project manager
  // Trigger billing for milestone payment
  // Update project status if all milestones achieved
});
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed: name is required"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

## Query Parameters

### Filtering

```http
GET /api/projects?status=IN_PROGRESS&clientId=client-123

GET /api/tasks?projectId=uuid&status=PENDING&priority=HIGH

GET /api/resources?type=EMPLOYEE&userId=user-123
```

### Date Ranges

```http
GET /api/reports/tasks?startDate=2024-01-01&endDate=2024-01-31
```

## Integration with Other Services

### Link Project to CRM Client

```json
{
  "name": "Website Redesign",
  "clientId": "customer-uuid-from-crm"
}
```

### Track Billable Hours

Task completion events can be consumed by billing service to track billable hours.

### Sync with HR Service

Resource assignments can be synced with HR service for availability management.

