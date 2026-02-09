'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import API from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoutes';
import useAuth from '@/hooks/useAuth';
import { Loader2, AlertCircle, ArrowLeft, Calendar, User, FolderOpen, Edit2, Check, X } from 'lucide-react';

interface Bug {
  _id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectId: any;
  reporter: any;
  assignee?: any;
  createdAt: string;
  updatedAt?: string;
}

export default function BugDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bugId = params.id as string;
  
  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status update states
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<Bug['status']>('OPEN');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [bugId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[BUG DETAIL] Fetching bug:', bugId);
      const response = await API.get(`/bugs/${bugId}`);
      
      console.log('[BUG DETAIL] Raw response:', response);
      
      // ✅ SAFE RESPONSE PARSING
      let bugData: Bug | null = null;
      
      if (response && (response._id || response.id)) {
        bugData = { ...response, _id: response._id || response.id };
      } else if (response && response.data && (response.data._id || response.data.id)) {
        bugData = { ...response.data, _id: response.data._id || response.data.id };
      } else if (response && response.bug && (response.bug._id || response.bug.id)) {
        bugData = { ...response.bug, _id: response.bug._id || response.bug.id };
      } else {
        throw new Error('Could not parse bug data from response');
      }
      
      if (!bugData || !bugData.status) {
        throw new Error('Bug data is invalid');
      }
      
      console.log('[BUG DETAIL] ✅ Bug loaded:', bugData);
      setBug(bugData);
      setNewStatus(bugData.status);
      
    } catch (err: any) {
      console.error('[BUG DETAIL] Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load bug');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SIMPLIFIED UPDATE FUNCTION
  const handleUpdateStatus = async () => {
    if (!bug) {
      console.error('[UPDATE] No bug data!');
      return;
    }

    // ⚠️ REMOVED THE EARLY RETURN - Allow saving even if status appears unchanged
    // This is needed when tester has only one option (CLOSED)
    console.log('[UPDATE] Proceeding with update...');
    console.log('[UPDATE] Current bug.status:', bug.status);
    console.log('[UPDATE] New status to save:', newStatus);

    console.log('🔥 ============================================');
    console.log('🔥 UPDATING STATUS');
    console.log('🔥 Bug ID:', bug._id);
    console.log('🔥 Old Status:', bug.status);
    console.log('🔥 New Status:', newStatus);
    console.log('🔥 ============================================');

    try {
      setUpdatingStatus(true);
      setError('');
      
      // Make the API call
      const response = await API.patch(`/bugs/${bug._id}/status`, {
        status: newStatus
      });

      console.log('✅ ============================================');
      console.log('✅ UPDATE SUCCESSFUL!');
      console.log('✅ Response:', response);
      console.log('✅ ============================================');

      // ⚠️ CRITICAL: Update the local state
      console.log('🔄 Updating local state...');
      console.log('🔄 Before:', bug.status);
      
      const updatedBug = { ...bug, status: newStatus };
      setBug(updatedBug);
      
      console.log('🔄 After:', updatedBug.status);
      console.log('🔄 State updated!');
      
      // Close the editor
      setEditingStatus(false);
      
      // Show success message
      setSuccessMessage(`Bug status updated to ${newStatus}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      console.error('❌ ============================================');
      console.error('❌ UPDATE FAILED!');
      console.error('❌ Error:', err);
      console.error('❌ Status Code:', err.response?.status);
      console.error('❌ Error Message:', err.response?.data?.message || err.message);
      console.error('❌ ============================================');
      
      // Reset to original
      setNewStatus(bug.status);
      
      // Show error
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
      
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Check permissions
  const canUpdateStatus = () => {
    if (!user || !bug) return false;
    return user.role === 'ADMIN' || user.role === 'DEVELOPER' || user.role === 'TESTER';
  };

  // Get available statuses
  const getAvailableStatuses = (): Bug['status'][] => {
    if (!user) return [];
    if (user.role === 'TESTER') return ['CLOSED'];
    if (user.role === 'ADMIN' || user.role === 'DEVELOPER') {
      return ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    }
    return [];
  };

  // Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { className: string; text: string }> = {
      OPEN: { className: 'bg-red-100 text-red-700 border-red-300', text: 'Open' },
      IN_PROGRESS: { className: 'bg-blue-100 text-blue-700 border-blue-300', text: 'In Progress' },
      RESOLVED: { className: 'bg-green-100 text-green-700 border-green-300', text: 'Resolved' },
      CLOSED: { className: 'bg-gray-100 text-gray-700 border-gray-300', text: 'Closed' }
    };
    const config = configs[status] || configs.OPEN;
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // Priority Badge
  const PriorityBadge = ({ priority }: { priority: string }) => {
    const configs: Record<string, { className: string }> = {
      CRITICAL: { className: 'bg-red-100 text-red-700 border-red-300' },
      HIGH: { className: 'bg-orange-100 text-orange-700 border-orange-300' },
      MEDIUM: { className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      LOW: { className: 'bg-green-100 text-green-700 border-green-300' }
    };
    const config = configs[priority] || configs.MEDIUM;
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${config.className}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!bug) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{error || 'Bug not found'}</p>
            <button
              onClick={() => router.push('/bugs')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Back to Bugs
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700 border border-green-300 flex gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 flex gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Bug Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">{bug.title}</h1>
            
            <div className="flex gap-2 flex-wrap items-center">
              {/* Status Editor */}
              {editingStatus ? (
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
                  <select
                    value={newStatus}
                    onChange={(e) => {
                      const selected = e.target.value as Bug['status'];
                      console.log('📝 Status changed in dropdown:', selected);
                      setNewStatus(selected);
                    }}
                    className="px-3 py-1 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={updatingStatus}
                  >
                    {getAvailableStatuses().map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => {
                      console.log('💾 Save button clicked');
                      handleUpdateStatus();
                    }}
                    disabled={updatingStatus}
                    className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {updatingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('❌ Cancel button clicked');
                      setEditingStatus(false);
                      setNewStatus(bug.status);
                    }}
                    disabled={updatingStatus}
                    className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusBadge status={bug.status} />
                  
                  {canUpdateStatus() && (
                    <button
                      onClick={() => {
                        console.log('✏️ Edit button clicked');
                        setEditingStatus(true);
                        
                        // ✅ AUTO-SELECT THE NEW STATUS FOR TESTERS
                        if (user?.role === 'TESTER') {
                          // Tester can only close, so auto-select CLOSED
                          console.log('🔄 Auto-selecting CLOSED for tester');
                          setNewStatus('CLOSED');
                        }
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card border border-border rounded transition-colors"
                      title="Edit status"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              
              <PriorityBadge priority={bug.priority} />
              
              {/* Show role-based hint */}
              {user?.role === 'TESTER' && !editingStatus && bug.status !== 'CLOSED' && (
                <span className="text-xs text-muted-foreground">
                  (You can close this bug)
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {bug.description && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{bug.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Reporter</p>
              </div>
              <p className="text-foreground font-medium">
                {typeof bug.reporter === 'object' && bug.reporter 
                  ? (bug.reporter.name || bug.reporter.email || 'Unknown')
                  : 'Unknown'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Assignee</p>
              </div>
              <p className="text-foreground font-medium">
                {bug.assignee 
                  ? (typeof bug.assignee === 'object' 
                      ? (bug.assignee.name || bug.assignee.email || 'Assigned')
                      : 'Assigned')
                  : 'Unassigned'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Project</p>
              </div>
              <p className="text-foreground font-medium">
                {typeof bug.projectId === 'object' && bug.projectId
                  ? (bug.projectId.name || 'Unknown')
                  : 'Unknown'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Created</p>
              </div>
              <p className="text-foreground font-medium">
                {new Date(bug.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Last Updated */}
          {bug.updatedAt && (
            <div className="text-sm text-muted-foreground text-center">
              Last updated: {new Date(bug.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}