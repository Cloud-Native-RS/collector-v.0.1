"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projectsApi, Project, ProjectStatus } from "@/lib/api/projects";
import { toast } from "sonner";
import Link from "next/link";
import ProjectsDataTable from "./components/projects-data-table";
import ProjectsStatsCards from "./components/projects-stats-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
  });

  const statusFilterMap: Record<string, ProjectStatus | undefined> = {
    overview: undefined,
    inProgress: 'IN_PROGRESS',
    completed: 'COMPLETED',
    onHold: 'ON_HOLD',
    planned: 'PLANNED',
  };

  useEffect(() => {
    loadProjects();
  }, [activeTab]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const status = statusFilterMap[activeTab];
      const response = await projectsApi.list(status);
      setProjects(response);
      
      // Calculate stats
      const allProjects = await projectsApi.list();
      setStats({
        total: allProjects.length,
        inProgress: allProjects.filter(p => p.status === 'IN_PROGRESS').length,
        completed: allProjects.filter(p => p.status === 'COMPLETED').length,
        onHold: allProjects.filter(p => p.status === 'ON_HOLD').length,
      });
    } catch (error: any) {
      toast.error(`Failed to load projects: ${error.message}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Project Management</h1>
          <p className="text-sm text-muted-foreground">Manage projects, tasks, and milestones</p>
        </div>
        <Button asChild>
          <Link href="/pages/projects/create">
            <PlusIcon className="mr-2 h-4 w-4" /> New Project
          </Link>
        </Button>
      </div>

      <ProjectsStatsCards stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Manage and track your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">All Projects</TabsTrigger>
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="onHold">On Hold</TabsTrigger>
              <TabsTrigger value="planned">Planned</TabsTrigger>
            </TabsList>
            <ProjectsDataTable 
              data={projects} 
              loading={loading} 
              onRefresh={loadProjects} 
            />
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

