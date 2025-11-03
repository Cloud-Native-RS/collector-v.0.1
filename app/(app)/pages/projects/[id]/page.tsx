"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projectsApi, Project, ProjectProgress, Task, Milestone } from "@/lib/api/projects";
import { toast } from "sonner";
import { ArrowLeft, PlusIcon, EditIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, progressData, tasksData, milestonesData] = await Promise.all([
        projectsApi.getById(projectId),
        projectsApi.getProgress(projectId),
        projectsApi.listTasks({ projectId }),
        projectsApi.listMilestones(projectId),
      ]);

      setProject(projectData);
      setProgress(progressData);
      setTasks(tasksData);
      setMilestones(milestonesData);
    } catch (error: any) {
      toast.error(`Failed to load project: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    ON_HOLD: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight lg:text-2xl">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/pages/projects/${projectId}/edit`}>
              <EditIcon className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/pages/projects/${projectId}/tasks/create`}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Task
            </Link>
          </Button>
        </div>
      </div>

      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Overall project completion status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{progress.progressPercentage}%</span>
              </div>
              <Progress value={progress.progressPercentage} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{progress.totalTasks}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {progress.completedTasks}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {progress.inProgressTasks}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{progress.blockedTasks}</div>
                <div className="text-sm text-muted-foreground">Blocked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium">Status</div>
              <Badge className={statusColors[project.status]}>
                {project.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Start Date</div>
              <div className="text-sm text-muted-foreground">
                {new Date(project.startDate).toLocaleDateString()}
              </div>
            </div>
            {project.endDate && (
              <div>
                <div className="text-sm font-medium">End Date</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(project.endDate).toLocaleDateString()}
                </div>
              </div>
            )}
            {project.clientId && (
              <div>
                <div className="text-sm font-medium">Client ID</div>
                <div className="text-sm text-muted-foreground">{project.clientId}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>{milestones.length} milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {milestones.slice(0, 5).map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-2 rounded">
                  <div>
                    <div className="font-medium">{milestone.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    className={
                      milestone.status === "ACHIEVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {milestone.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>{tasks.length} total tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                  </div>
                  <Badge>{task.status}</Badge>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

