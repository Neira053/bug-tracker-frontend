"use client";

import React from "react"
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import API from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoutes';
import useAuth from '@/hooks/useAuth';
import StatCard from '@/components/StatCard';
import { useStats } from '@/hooks/useStats';
import { Plus, AlertCircle, BugIcon, CheckCircle, Loader2, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'RESOLVED'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];

interface Bug {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
}

function BugsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { stats } = useStats();

  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');

  // Quick edit state
  const [editingBugId, setEditingBugId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        setLoading(true);
        setError('');
        let url = '/bugs';
        const params = new URLSearchParams();

        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        console.log('[BUGS] Fetching bugs from:', url);
        const res = await API.get(url);
        console.log('[BUGS] API response:', res);
        
        // Handle different response formats
        let bugsData: Bug[] = [];
        
        if (Array.isArray(res)) {
          bugsData = res;
        } else if (res.data && Array.isArray(res.data)) {
          bugsData = res.data;
        } else if (res.bugs && Array.isArray(res.bugs)) {
          bugsData = res.bugs;
        } else if (typeof res === 'object') {
          const arrayProp = Object.values(res).find(val => Array.isArray(val));
          if (arrayProp) {
            bugsData = arrayProp as Bug[];
          }
        }
        
        console.log('[BUGS] ✅ Loaded:', bugsData.length);
        setBugs(bugsData);
      } catch (err) {
        console.error('[BUGS] ❌ Failed to load bugs', err);
        setError('Failed to load bugs');
        setBugs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBugs();
  }, [statusFilter, priorityFilter]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    const params = new URLSearchParams();
    if (value) params.set('status', value);
    if (priorityFilter) params.set('priority', priorityFilter);
    router.push(`/bugs?${params.toString()}`);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPriorityFilter(value);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (value) params.set("priority", value);
    router.push(`/bugs?${params.toString()}`);
  };

  // Delete bug function
  const deleteBug = async (bugId: string, bugTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm(`Delete bug: "${bugTitle}"?\n\nThis action cannot be undone.`)) return;
    
    try {
      console.log('[BUGS] Deleting bug:', bugId);
      await API.delete(`/bugs/${bugId}`);
      setBugs(prev => prev.filter(b => b._id !== bugId));
      console.log('[BUGS] ✅ Bug deleted successfully');
    } catch (err: any) {
      console.error('[BUGS] ❌ Failed to delete bug:', err);
      alert(err.response?.data?.message || 'Failed to delete bug');
    }
  };

  // Start editing bug status
  const startEditStatus = (bugId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setEditingBugId(bugId);
    setNewStatus(currentStatus);
  };

  // Cancel editing
  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBugId(null);
    setNewStatus('');
  };

  // Update bug status
  const updateBugStatus = async (bugId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      console.log('[BUGS] Updating bug status:', bugId, 'to', newStatus);
      console.log('[BUGS] Using endpoint: PATCH /bugs/' + bugId + '/status');
      
      // ✅ CORRECT: /bugs/:id/status endpoint
      const response = await API.patch(`/bugs/${bugId}/status`, { status: newStatus });
      console.log('[BUGS] Response:', response);
      
      // Update local state
      setBugs(prev => prev.map(bug => 
        bug._id === bugId ? { ...bug, status: newStatus } : bug
      ));
      
      setEditingBugId(null);
      setNewStatus('');
      console.log('[BUGS] ✅ Status updated successfully');
    } catch (err: any) {
      console.error('[BUGS] ❌ Failed to update status:', err);
      console.error('[BUGS] Error details:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update bug status';
      alert(`Failed to update status: ${errorMessage}`);
    }
  };

  // Helper to extract string from potentially nested object
  const extractString = (field: any): string => {
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field !== null) {
      return field.name || field._id || JSON.stringify(field);
    }
    return String(field || '');
  };

  // Check user permissions
  const canDelete = user?.role === 'ADMIN';
  const canUpdateStatus = user?.role === 'DEVELOPER' || user?.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground">Issues</h1>
          <p className="text-muted-foreground mt-2">Track and manage bugs across all projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Bugs" value={stats.total} icon={<BugIcon className="w-5 h-5" />} />
          <StatCard label="Open" value={stats.open} icon={<AlertCircle className="w-5 h-5 text-red-600" />} />
          <StatCard label="In Progress" value={stats.progress} icon={<Loader2 className="w-5 h-5 text-amber-600" />} />
          <StatCard label="Closed" value={stats.closed} icon={<CheckCircle className="w-5 h-5 text-green-600" />} />
        </div>

        {/* Filters Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold text-foreground">Filter Issues</h2>
          {user?.role === 'TESTER' && (
            <Link
              href="/bugs/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Report Bug
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-foreground">Status:</label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-2 border border-border rounded-lg bg-card text-foreground hover:border-primary/50 transition-colors"
              suppressHydrationWarning
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status: string) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-foreground">Priority:</label>
            <select
              value={priorityFilter}
              onChange={handlePriorityChange}
              className="px-3 py-2 border border-border rounded-lg bg-card text-foreground hover:border-primary/50 transition-colors"
              suppressHydrationWarning
            >
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map((priority: string) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive flex gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Loading issues...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && bugs.length === 0 && (
          <div className="text-center py-12 border border-border rounded-xl bg-card">
            <BugIcon className="w-10 h-10 mx-auto opacity-50 mb-3" />
            <p className="text-muted-foreground mb-2">No issues found</p>
            {(statusFilter || priorityFilter) && (
              <p className="text-xs text-muted-foreground">
                Try adjusting your filters
              </p>
            )}
          </div>
        )}

        {/* Bugs list */}
        {!loading && bugs.length > 0 && (
          <div className="space-y-3">
            {bugs.map((bug) => {
              const isEditing = editingBugId === bug._id;
              const bugStatus = extractString(bug.status);
              
              return (
                <div
                  key={bug._id}
                  onClick={() => !isEditing && router.push(`/bugs/${bug._id}`)}
                  className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Bug Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {extractString(bug.title) || 'Untitled'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {extractString(bug.description) || 'No description'}
                      </p>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status - Editable or Badge */}
                      {isEditing ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-border bg-background text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={(e) => updateBugStatus(bug._id, e)}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Status Badge */}
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                              {bugStatus || 'OPEN'}
                            </span>
                            {canUpdateStatus && (
                              <button
                                onClick={(e) => startEditStatus(bug._id, bugStatus, e)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Edit status"
                              >
                                <Edit2 className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>

                          {/* Priority Badge */}
                          <span className="px-2 py-1 text-xs rounded bg-accent/10 text-accent">
                            {extractString(bug.priority) || 'MEDIUM'}
                          </span>

                          {/* Delete Button - Admin Only */}
                          {canDelete && (
                            <button
                              onClick={(e) => deleteBug(bug._id, extractString(bug.title), e)}
                              className="p-2 hover:bg-destructive/10 rounded transition-colors group"
                              title="Delete bug"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Permission Info */}
        {!loading && bugs.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Your permissions:</strong>
              {canUpdateStatus && ' You can update bug status.'}
              {canDelete && ' You can delete bugs.'}
              {!canUpdateStatus && !canDelete && ' View only - contact admin for edit permissions.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function BugsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      }>
        <BugsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}