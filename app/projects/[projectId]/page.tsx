"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoutes";
import BugCard from "@/components/BugCard";
import StatCard from "@/components/StatCard";
import { AlertCircle, Loader2, CheckCircle, BugIcon, ArrowLeft } from "lucide-react";

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

interface Stats {
  total: number;
  open: number;
  progress: number;
  closed: number;
  resolved: number;
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    open: 0,
    progress: 0,
    closed: 0,
    resolved: 0,
  });

  // Normalize status for case-insensitive comparison
  const normalizeStatus = (status: string): string => {
    return status?.toUpperCase().replace(/-/g, '_') || 'OPEN';
  };

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('[PROJECT DETAIL] Fetching project:', projectId);

        // Fetch project and bugs
        const [projectRes, bugsRes] = await Promise.all([
          API.get(`/project/${projectId}`).catch(err => {
            console.error('[PROJECT DETAIL] Project fetch error:', err);
            return null;
          }),
          API.get(`/bugs?projectId=${projectId}`).catch(err => {
            console.error('[PROJECT DETAIL] Bugs fetch error:', err);
            return { data: [] };
          }),
        ]);

        console.log('[PROJECT DETAIL] Project response:', projectRes);
        console.log('[PROJECT DETAIL] Bugs response:', bugsRes);

        // Parse project response - handle multiple formats
        let projectData: Project | null = null;
        
        if (projectRes) {
          if (projectRes.data && typeof projectRes.data === 'object') {
            // Response is { data: {...} }
            projectData = projectRes.data;
          } else if (projectRes._id) {
            // Response is the project object directly
            projectData = projectRes;
          } else if (typeof projectRes === 'object') {
            // Try to find project object in response
            const possibleProject = Object.values(projectRes).find(
              (val: any) => val && typeof val === 'object' && val._id
            ) as Project | undefined;
            if (possibleProject) {
              projectData = possibleProject;
            }
          }
        }

        console.log('[PROJECT DETAIL] Parsed project:', projectData);

        if (!projectData) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        // Parse bugs response - handle multiple formats
        let bugsData: Bug[] = [];
        
        if (Array.isArray(bugsRes)) {
          bugsData = bugsRes;
        } else if (bugsRes?.data && Array.isArray(bugsRes.data)) {
          bugsData = bugsRes.data;
        } else if (bugsRes?.bugs && Array.isArray(bugsRes.bugs)) {
          bugsData = bugsRes.bugs;
        } else if (typeof bugsRes === 'object') {
          const arrayProp = Object.values(bugsRes).find(val => Array.isArray(val));
          if (arrayProp) {
            bugsData = arrayProp as Bug[];
          }
        }

        console.log('[PROJECT DETAIL] Parsed bugs:', bugsData.length);

        setProject(projectData);
        setBugs(bugsData);
        
        // Calculate stats with case-insensitive status matching
        const statsData = {
          total: bugsData.length,
          open: bugsData.filter((b) => normalizeStatus(b.status) === 'OPEN').length,
          progress: bugsData.filter((b) => normalizeStatus(b.status) === 'IN_PROGRESS').length,
          closed: bugsData.filter((b) => normalizeStatus(b.status) === 'CLOSED').length,
          resolved: bugsData.filter((b) => normalizeStatus(b.status) === 'RESOLVED').length,
        };

        console.log('[PROJECT DETAIL] Stats calculated:', statsData);
        setStats(statsData);

      } catch (err: any) {
        console.error('[PROJECT DETAIL] ❌ Failed to load project:', err);
        setError(err.message || 'Failed to load project');
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

  if (error || !project) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </button>

            <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-destructive">Error Loading Project</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {error || "Project not found or you don't have permission to view it"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button */}
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          {/* Title */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground mt-2">
              {project.description || "Project Details and Bug Management"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
              label="Resolved" 
              value={stats.resolved} 
              icon={<CheckCircle className="w-5 h-5 text-blue-600" />} 
            />
            <StatCard 
              label="Closed" 
              value={stats.closed} 
              icon={<CheckCircle className="w-5 h-5 text-green-600" />} 
            />
          </div>

          {/* Bugs Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Bugs in this Project
              </h2>
              <span className="text-sm text-muted-foreground">
                {bugs.length} {bugs.length === 1 ? 'bug' : 'bugs'}
              </span>
            </div>

            {bugs.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-xl bg-card">
                <BugIcon className="w-10 h-10 mx-auto opacity-50 mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No bugs in this project yet</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Bugs will appear here when they are reported for this project
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bugs.map((bug) => (
                  <BugCard key={bug._id} bug={bug} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}