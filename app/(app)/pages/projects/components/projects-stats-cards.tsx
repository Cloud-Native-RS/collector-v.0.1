import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStats } from "../types";

interface ProjectsStatsCardsProps {
  stats: ProjectStats;
}

export default function ProjectsStatsCards({ stats }: ProjectsStatsCardsProps) {
  const statItems = [
    {
      title: "Total Projects",
      value: stats.total,
      description: "All projects in the system",
      icon: "📁",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      description: "Active projects",
      icon: "🚀",
    },
    {
      title: "Completed",
      value: stats.completed,
      description: "Finished projects",
      icon: "✅",
    },
    {
      title: "On Hold",
      value: stats.onHold,
      description: "Paused projects",
      icon: "⏸️",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <span className="text-2xl">{item.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

