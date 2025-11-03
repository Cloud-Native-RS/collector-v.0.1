# Project Management Frontend

This module provides a complete frontend interface for the Project Management Service.

## Features

✅ **Project Management**
- List all projects with filtering and search
- Create new projects
- View project details with progress tracking
- Edit project information
- Delete projects

✅ **Real-time Updates**
- Automatic progress calculation
- Task and milestone tracking
- Status indicators

✅ **Statistics Dashboard**
- Total projects count
- In-progress projects
- Completed projects
- On-hold projects

## Pages

### `/pages/projects`
Main projects list page with:
- Statistics cards
- Filterable project table
- Quick actions (view, edit, delete)
- Search functionality

### `/pages/projects/create`
Create new project form with:
- Project name and description
- Status selection
- Start and end dates
- Client ID linking to CRM

### `/pages/projects/[id]`
Project detail page showing:
- Project information
- Progress visualization
- Task list
- Milestone overview
- Quick actions

## API Integration

All API calls are handled through `lib/api/projects.ts` which provides:
- Type-safe API methods
- Automatic authentication
- Multi-tenant support
- Error handling

## Usage

### Accessing Projects

1. Navigate to **Operations → Project → All Projects**
2. Use filters to find specific projects
3. Click on a project name to view details
4. Use the actions menu for edit/delete

### Creating a Project

1. Click **"New Project"** button
2. Fill in project details
3. Set start and end dates
4. Optionally link to a CRM client
5. Click **"Create Project"**

## Integration with Backend

The frontend connects to the Project Management Service at:
- Default: `http://localhost:3006`
- Configurable via `NEXT_PUBLIC_PROJECT_MANAGEMENT_SERVICE_URL`

## Authentication

Uses JWT authentication from localStorage:
- Token: `localStorage.getItem('token')`
- Tenant ID: `localStorage.getItem('tenantId')`

## Next Steps

Additional features to implement:
- [ ] Task management interface
- [ ] Milestone creation and editing
- [ ] Resource allocation UI
- [ ] Gantt chart visualization
- [ ] Team workload reports
- [ ] Kanban board view

