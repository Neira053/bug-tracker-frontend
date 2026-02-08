"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoutes";
import BugCard from "@/components/BugCard";
import StatCard from "@/components/StatCard";
import { AlertCircle, Loader2, CheckCircle, BugIcon } from "lucide-react";

// TypeScript interfaces
interface Project {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Bug {
  _id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectResponse {
  data: Project;
}

interface BugsResponse {
  data: Bug[];
}

interface Stats {
  total: number;
  open: number;
  progress: number;
  closed: number;
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    open: 0,
    progress: 0,
    closed: 0,
  });

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        const [projectRes, bugsRes] = await Promise.all([
          API.get<ProjectResponse>(`/project/${projectId}`),
          API.get<BugsResponse>(`/bugs?projectId=${projectId}`),
        ]);

        const bugsData = bugsRes.data || [];
        setProject(projectRes.data);
        setBugs(bugsData);
        
        // Calculate stats
        setStats({
          total: bugsData.length,
          open: bugsData.filter((b) => b.status === "OPEN").length,
          progress: bugsData.filter((b) => b.status === "IN_PROGRESS").length,
          closed: bugsData.filter((b) => b.status === "CLOSED").length,
        });
      } catch (err: any) {
        console.error("[v0] Failed to load project:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Failed to load project</p>
            <p className="text-muted-foreground text-sm mt-2">
              The project may not exist or you don't have permission to view it.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground mt-2">
              {project.description || "Project Details and Bug Management"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Total Bugs" 
              value={stats.total} 
              icon={<BugIcon className="w-5 h-5" />} 
            />
            <StatCard 
              label="Open" 
              value={stats.open} 
              icon={<AlertCircle className="w-5 h-5 text-red-600" />} 
            />
            <StatCard 
              label="In Progress" 
              value={stats.progress} 
              icon={<Loader2 className="w-5 h-5 text-amber-600" />} 
            />
            <StatCard 
              label="Closed" 
              value={stats.closed} 
              icon={<CheckCircle className="w-5 h-5 text-green-600" />} 
            />
          </div>

          {/* Bugs Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Bugs in this Project
            </h2>

            {bugs.length === 0 && (
              <div className="text-center py-12 border border-border rounded-xl bg-card">
                <BugIcon className="w-10 h-10 mx-auto opacity-50 mb-3" />
                <p className="text-muted-foreground">No bugs in this project yet</p>
              </div>
            )}

            <div className="space-y-4">
              {bugs.map((bug) => (
                <BugCard key={bug._id} bug={bug} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}