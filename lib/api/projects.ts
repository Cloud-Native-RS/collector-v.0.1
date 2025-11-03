// Project Management Service API Types and Client

export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'ACHIEVED' | 'DELAYED' | 'CANCELLED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ResourceType = 'EMPLOYEE' | 'EQUIPMENT';

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId?: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  milestones?: Milestone[];
  tasks?: Task[];
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate: string;
  status: MilestoneStatus;
  achievedAt?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  assignedTo?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  milestone?: Milestone;
  dependsOn?: TaskDependency[];
  dependencies?: TaskDependency[];
  resources?: TaskResource[];
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  dependencyTaskId: string;
  dependentTask?: Task;
  dependencyTask?: Task;
}

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  userId?: string;
  availabilitySchedule?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  taskResources?: TaskResource[];
}

export interface TaskResource {
  id: string;
  taskId: string;
  resourceId: string;
  allocatedHours: number;
  task?: Task;
  resource?: Resource;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  progressPercentage: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  milestones: Array<{
    id: string;
    name: string;
    status: MilestoneStatus;
    dueDate: string;
  }>;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  clientId?: string;
  status?: ProjectStatus;
  startDate: string;
  endDate?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreateMilestoneInput {
  projectId: string;
  name: string;
  description?: string;
  dueDate: string;
}

export interface CreateTaskInput {
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  assignedTo?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  dependencies?: string[];
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  assignedTo?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
}

export interface CreateResourceInput {
  type: ResourceType;
  name: string;
  userId?: string;
  availabilitySchedule?: string;
}

export interface AllocateResourceInput {
  taskId: string;
  resourceId: string;
  allocatedHours: number;
}

// Use Next.js API route proxy instead of direct microservice URL
const API_BASE_URL = '';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant';

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    'x-tenant-id': tenantId,
    ...options.headers,
  };

  // Use relative URL to go through Next.js API route proxy
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const projectsApi = {
  // Projects
  async list(status?: ProjectStatus, clientId?: string): Promise<Project[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (clientId) params.append('clientId', clientId);
    const queryString = params.toString();
    return fetchWithAuth(`/api/projects${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id: string): Promise<Project> {
    return fetchWithAuth(`/api/projects/${id}`);
  },

  async getProgress(id: string): Promise<ProjectProgress> {
    return fetchWithAuth(`/api/projects/${id}/progress`);
  },

  async create(input: CreateProjectInput): Promise<Project> {
    return fetchWithAuth('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    return fetchWithAuth(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchWithAuth(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Milestones
  async listMilestones(projectId?: string): Promise<Milestone[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    const queryString = params.toString();
    return fetchWithAuth(`/api/milestones${queryString ? `?${queryString}` : ''}`);
  },

  async getMilestoneById(id: string): Promise<Milestone> {
    return fetchWithAuth(`/api/milestones/${id}`);
  },

  async createMilestone(input: CreateMilestoneInput): Promise<Milestone> {
    return fetchWithAuth('/api/milestones', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateMilestone(id: string, input: Partial<CreateMilestoneInput>): Promise<Milestone> {
    return fetchWithAuth(`/api/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteMilestone(id: string): Promise<void> {
    return fetchWithAuth(`/api/milestones/${id}`, {
      method: 'DELETE',
    });
  },

  // Tasks
  async listTasks(filters?: {
    projectId?: string;
    milestoneId?: string;
    assignedTo?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/tasks${queryString ? `?${queryString}` : ''}`);
  },

  async getTaskById(id: string): Promise<Task> {
    return fetchWithAuth(`/api/tasks/${id}`);
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    return fetchWithAuth('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    return fetchWithAuth(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteTask(id: string): Promise<void> {
    return fetchWithAuth(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // Resources
  async listResources(type?: ResourceType, userId?: string): Promise<Resource[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (userId) params.append('userId', userId);
    const queryString = params.toString();
    return fetchWithAuth(`/api/resources${queryString ? `?${queryString}` : ''}`);
  },

  async getResourceById(id: string): Promise<Resource> {
    return fetchWithAuth(`/api/resources/${id}`);
  },

  async createResource(input: CreateResourceInput): Promise<Resource> {
    return fetchWithAuth('/api/resources', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateResource(id: string, input: Partial<CreateResourceInput>): Promise<Resource> {
    return fetchWithAuth(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteResource(id: string): Promise<void> {
    return fetchWithAuth(`/api/resources/${id}`, {
      method: 'DELETE',
    });
  },

  async allocateResource(input: AllocateResourceInput): Promise<TaskResource> {
    return fetchWithAuth('/api/resources/allocate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async checkResourceAvailability(
    resourceId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    return fetchWithAuth(
      `/api/resources/${resourceId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
  },

  // Reports
  async getProjectSummary(projectId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    const queryString = params.toString();
    return fetchWithAuth(`/api/reports/projects${queryString ? `?${queryString}` : ''}`);
  },

  async getTasksReport(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return fetchWithAuth(`/api/reports/tasks${queryString ? `?${queryString}` : ''}`);
  },

  async getOverdueTasks(): Promise<Task[]> {
    return fetchWithAuth('/api/reports/overdue-tasks');
  },

  async getDelayedMilestones(): Promise<Milestone[]> {
    return fetchWithAuth('/api/reports/delayed-milestones');
  },

  async getTeamWorkload(): Promise<any[]> {
    return fetchWithAuth('/api/reports/team-workload');
  },
};

