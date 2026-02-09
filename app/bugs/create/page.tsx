'use client';

import React from "react"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoutes';
import useAuth from '@/hooks/useAuth';
import { AlertCircle, Loader2, BugIcon, ArrowLeft } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
}

export default function CreateBugPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [projectId, setProjectId] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects
  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        console.log('[CREATE BUG] Fetching projects...');
        const res = await API.get('/project');
        console.log('[CREATE BUG] Projects response:', res);
        
        // Handle different response formats
        let projectsData: Project[] = [];
        
        if (Array.isArray(res)) {
          projectsData = res;
        } else if (res.data && Array.isArray(res.data)) {
          projectsData = res.data;
        } else if (res.projects && Array.isArray(res.projects)) {
          projectsData = res.projects;
        } else if (typeof res === 'object') {
          const arrayProp = Object.values(res).find(val => Array.isArray(val));
          if (arrayProp) {
            projectsData = arrayProp as Project[];
          }
        }
        
        console.log('[CREATE BUG] ✅ Parsed projects:', projectsData.length);
        setProjects(projectsData);
      } catch (err) {
        console.error('[CREATE BUG] ❌ Failed to load projects:', err);
        setError('Failed to load projects. Please refresh the page.');
        setProjects([]); // Set empty array to prevent undefined error
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user]);

  // Submit bug
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      setError('Please select a project');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      console.log('[CREATE BUG] Submitting bug:', { title, priority, projectId });
      
      await API.post('/bugs', {
        title,
        description,
        priority,
        projectId,
      });
      
      console.log('[CREATE BUG] ✅ Bug created successfully');
      router.push('/bugs');
    } catch (err: any) {
      console.error('[CREATE BUG] ❌ Bug creation failed:', err);
      
      if (err.response?.status === 403) {
        setError('Only testers are allowed to create bugs.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Bug creation failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  // ✅ PERMISSION CHECK: Only TESTERS can create bugs
  if (user && user.role !== 'TESTER') {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <div className="max-w-xl mx-auto px-4 py-8">
            <button
              onClick={() => router.push('/bugs')}
              className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bugs
            </button>

            <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex gap-3">
                <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-destructive text-lg">Access Denied</h2>
                  <p className="text-muted-foreground mt-2">
                    Only <strong>Testers</strong> are allowed to create bugs.
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Your role: <strong className="text-foreground">{user.role}</strong>
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
        <div className="max-w-xl mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={() => router.push('/bugs')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bugs
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BugIcon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Report a Bug</h1>
            </div>
            <p className="text-muted-foreground">
              Provide details about the issue you've discovered
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 flex gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bug Title <span className="text-destructive">*</span>
              </label>
              <input
                required
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                placeholder="Detailed description of the bug, steps to reproduce, expected vs actual behavior..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                rows={6}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority <span className="text-destructive">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="LOW">🟢 Low Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="HIGH">🔴 High Priority</option>
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Project <span className="text-destructive">*</span>
              </label>
              
              {loadingProjects ? (
                <div className="w-full px-4 py-2.5 border border-border rounded-lg bg-muted/50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Loading projects...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="w-full px-4 py-2.5 border border-destructive/50 rounded-lg bg-destructive/10 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-destructive text-sm">No projects available</span>
                </div>
              ) : (
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              
              <p className="text-xs text-muted-foreground mt-1.5">
                {projects.length} project{projects.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || loadingProjects || projects.length === 0}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Bug...
                </>
              ) : (
                <>
                  <BugIcon className="w-4 h-4" />
                  Create Bug Report
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}