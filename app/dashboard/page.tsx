'use client';

import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import ProtectedRoute from '@/components/ProtectedRoutes';
import { AlertCircle, Loader2, CheckCircle, BugIcon } from 'lucide-react';
import StatCard from '@/components/StatCard';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, loading: statsLoading } = useStats();

  const isLoading = authLoading || statsLoading;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground">Ready to resolve!</h1>
            <p className="text-muted-foreground mt-2">Track issues, monitor progress, and keep everything moving.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div onClick={() => router.push('/bugs')} className="cursor-pointer">
              <StatCard label="Total Issues" value={stats.total} icon={<BugIcon className="w-5 h-5" />} />
            </div>
            <div onClick={() => router.push('/bugs?status=OPEN')} className="cursor-pointer">
              <StatCard label="Open" value={stats.open} icon={<AlertCircle className="w-5 h-5 text-red-600" />} />
            </div>
            <div onClick={() => router.push('/bugs?status=IN_PROGRESS')} className="cursor-pointer">
              <StatCard label="In Progress" value={stats.progress} icon={<Loader2 className="w-5 h-5 text-amber-600" />} />
            </div>
            <div onClick={() => router.push('/bugs?status=CLOSED')} className="cursor-pointer">
              <StatCard label="Closed" value={stats.closed} icon={<CheckCircle className="w-5 h-5 text-green-600" />} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push("/projects")}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Projects</h3>
                  <p className="text-sm text-muted-foreground mt-1">Manage {stats.projects} project{stats.projects !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-3xl">📁</div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-2xl font-bold text-primary">{stats.projects}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push("/bugs")}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Issues</h3>
                  <p className="text-sm text-muted-foreground mt-1">Track {stats.total} bug{stats.total !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-3xl">🐛</div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Status Overview Button */}
          <div className="mt-8">
            <button
              onClick={() => router.push("/status")}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all font-medium"
            >
              View Status Overview →
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
