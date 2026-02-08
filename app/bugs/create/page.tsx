'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoutes';
import useAuth from '@/hooks/useAuth';

export default function CreateBugPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [projectId, setProjectId] = useState("");

  const [projects, setProjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects
  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      try {
        const res = await API.get('/project');
        setProjects(res.data);
      } catch (err) {
        setError('Failed to load projects');
      }
    };

    fetchProjects();
  }, [user]);

  // Submit bug
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await API.post('/bugs', {
        title,
        description,
        priority,
        projectId,
      });
      router.push('/bugs');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Only testers are allowed to create bugs.');
      } else {
        setError('Bug creation failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </ProtectedRoute>
    );
  }

  if (user && user.role !== 'TESTER') {
    return (
      <ProtectedRoute>
        <main className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-destructive text-lg">
            Only testers are allowed to create bugs.
          </p>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Report a Bug</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              placeholder="Bug title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              suppressHydrationWarning
            />

            <textarea
              placeholder="Detailed description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={4}
              suppressHydrationWarning
            />

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              suppressHydrationWarning
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>

            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              suppressHydrationWarning
            >
              <option value="">Select a project</option>
              {projects.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              suppressHydrationWarning
            >
              {submitting ? 'Creating...' : 'Create Bug'}
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
