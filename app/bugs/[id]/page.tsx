"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoutes";
import { useAuthContext } from "@/context/AuthContext";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

// TypeScript interfaces
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TESTER' | 'DEVELOPER';
}

interface Bug {
  _id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  createdBy: string;
  assignedTo?: User;
  reportedBy?: User;
  createdAt: string;
  updatedAt: string;
}

interface BugResponse {
  data: Bug;
}

type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';

export default function BugDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const id = params.id;

  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<BugStatus>("OPEN");

  useEffect(() => {
    if (!id) return;

    const fetchBug = async () => {
      try {
        setLoading(true);
        const res = await API.get<BugResponse>(`/bugs/${id}`);
        setBug(res.data);
        setNewStatus(res.data.status);
      } catch (err: any) {
        console.error("[BUG DETAIL] Failed to load bug:", err.message);
        setError("Failed to load bug details");
      } finally {
        setLoading(false);
      }
    };

    fetchBug();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!bug || newStatus === bug.status) return;

    setUpdating(true);
    setError("");

    try {
      console.log("[BUG DETAIL] Updating status to:", newStatus);
      
      // ✅ CORRECT: Use /bugs/:id/status endpoint
      const res = await API.patch<BugResponse>(`/bugs/${id}/status`, { status: newStatus });
      
      setBug(res.data);
      console.log("[BUG DETAIL] ✅ Bug status updated successfully");
    } catch (err: any) {
      console.error("[BUG DETAIL] ❌ Failed to update bug:", err.message);
      setError("Failed to update bug status");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(e.target.value as BugStatus);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
            <p className="text-muted-foreground">Loading bug details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !bug) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-destructive">Error</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {error || "Bug not found"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  // Check if user can update status
  const canUpdateStatus = user?.role === 'DEVELOPER' || user?.role === 'ADMIN';

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Issues
          </button>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive flex gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Bug details card */}
          <div className="bg-card border border-border rounded-xl p-8">
            {/* Header */}
            <div className="mb-6 pb-6 border-b border-border">
              <h1 className="text-3xl font-bold text-foreground mb-2">{bug.title}</h1>
              <p className="text-muted-foreground">{bug.description}</p>
            </div>

            {/* Meta information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Status
                </p>
                {canUpdateStatus ? (
                  <div className="flex gap-2 items-center">
                    <select
                      value={newStatus}
                      onChange={handleStatusChange}
                      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    {newStatus !== bug.status && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {updating ? "..." : "Save"}
                      </button>
                    )}
                  </div>
                ) : (
                  <span
                    className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${
                      bug.status === "OPEN"
                        ? "bg-red-500/10 text-red-600"
                        : bug.status === "IN_PROGRESS"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {bug.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Priority
                </p>
                <span
                  className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${
                    bug.priority === "HIGH"
                      ? "bg-red-500/10 text-red-600"
                      : bug.priority === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-green-500/10 text-green-600"
                  }`}
                >
                  {bug.priority}
                </span>
              </div>

              {/* Reporter */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Reporter
                </p>
                <p className="text-foreground">{bug.reportedBy?.name || "Unknown"}</p>
              </div>

              {/* Assigned To */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Assigned To
                </p>
                <p className="text-foreground">
                  {bug.assignedTo?.name || "Unassigned"}
                </p>
              </div>

              {/* Created At */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Created
                </p>
                <p className="text-foreground text-sm">
                  {new Date(bug.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Updated At */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Updated
                </p>
                <p className="text-foreground text-sm">
                  {new Date(bug.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Permission note */}
            {!canUpdateStatus && (
              <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  ℹ️ You don't have permission to update bug status. Only Developers and Admins can update status.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}