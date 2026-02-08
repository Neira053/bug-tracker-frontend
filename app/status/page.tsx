'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoutes';
import StatCard from '@/components/StatCard';
import { useStats } from '@/hooks/useStats';
import useAuth from '@/hooks/useAuth';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  BugIcon,
  FolderOpen,
  Clock,
  Archive,
  Pause,
} from 'lucide-react';

const BUG_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'RESOLVED'];
const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']; // ✅ FIXED: Correct spelling

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'; // ✅ FIXED: Correct spelling
}

interface Bug {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId?: string;
}

export default function StatusPage() {
  const router = useRouter();
  const { stats } = useStats();
  const { user } = useAuth();
  
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBugStatus, setSelectedBugStatus] = useState('OPEN');
  const [selectedProjectStatus, setSelectedProjectStatus] = useState<'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'>('ACTIVE');
  const [viewType, setViewType] = useState<'bugs' | 'projects'>('bugs');
  
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  // Normalize status to uppercase for consistent comparison
  const normalizeStatus = (status: string): string => {
    return status?.toUpperCase().replace(/-/g, '_') || 'OPEN';
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (!isMountedRef.current) return;
        
        setLoading(true);
        
        console.log('[STATUS] Fetching data...');
        
        // ✅ FIXED: Use /project (singular) not /projects (plural)
        const [bugsRes, projectsRes] = await Promise.all([
          API.get<any>('/bugs').catch(err => {
            console.error('[STATUS] Bugs fetch error:', err);
            return { data: [] };
          }),
          API.get<any>('/project').catch(err => {
            console.error('[STATUS] Projects fetch error:', err);
            return { data: [] };
          }),
        ]);

        if (!isMountedRef.current) return;

        let bugsData: Bug[] = [];
        let projectsData: Project[] = [];

        // Extract bugs - handle multiple response formats
        if (Array.isArray(bugsRes)) {
          bugsData = bugsRes;
        } else if (bugsRes?.data && Array.isArray(bugsRes.data)) {
          bugsData = bugsRes.data;
        } else if (bugsRes?.bugs && Array.isArray(bugsRes.bugs)) {
          bugsData = bugsRes.bugs;
        }

        // Extract projects - handle multiple response formats
        if (Array.isArray(projectsRes)) {
          projectsData = projectsRes;
        } else if (projectsRes?.data && Array.isArray(projectsRes.data)) {
          projectsData = projectsRes.data;
        } else if (projectsRes?.projects && Array.isArray(projectsRes.projects)) {
          projectsData = projectsRes.projects;
        }

        console.log('[STATUS] ✅ Loaded - Bugs:', bugsData.length, 'Projects:', projectsData.length);
        
        // Debug: Log actual project statuses from backend
        if (projectsData.length > 0) {
          const statuses = projectsData.map(p => p.status).filter(Boolean);
          console.log('[STATUS] 📊 Project statuses from backend:', statuses);
          console.log('[STATUS] 📋 Sample project:', projectsData[0]);
        }

        if (isMountedRef.current) {
          setBugs(bugsData);
          setProjects(projectsData);
        }
      } catch (err: any) {
        console.error('[STATUS] ❌ Failed to load data:', err.message);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ✅ FIXED: Correct endpoint is /project/:id/status
  const updateProjectStatus = async (projectId: string, newStatus: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED') => {
    try {
      console.log('[STATUS] Updating project status:', projectId, 'to', newStatus);
      
      // ✅ FIXED: Use /project/:id/status (with /status at the end)
      await API.patch(`/project/${projectId}/status`, { status: newStatus });
      
      // Update local state
      setProjects(prev => prev.map(p => 
        p._id === projectId ? { ...p, status: newStatus } : p
      ));
      
      console.log('[STATUS] ✅ Project status updated successfully');
    } catch (err: any) {
      console.error('[STATUS] ❌ Failed to update project status:', err);
      alert(err.response?.data?.message || 'Failed to update project status');
    }
  };

  // Status badge for projects
  const ProjectStatusBadge = ({ project, isAdmin }: { project: Project; isAdmin: boolean }) => {
    const [showMenu, setShowMenu] = useState(false);
    
    const statusConfigs = {
      ACTIVE: { 
        icon: <Clock className="w-3 h-3" />, 
        text: 'Active', 
        className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400' 
      },
      ON_HOLD: { 
        icon: <Pause className="w-3 h-3" />, 
        text: 'On Hold', 
        className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400' 
      },
      COMPLETED: { 
        icon: <CheckCircle className="w-3 h-3" />, 
        text: 'Completed', 
        className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' 
      },
      ARCHIVED: { // ✅ FIXED: Correct spelling
        icon: <Archive className="w-3 h-3" />, 
        text: 'Archived',
        className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300' 
      },
    };
    
    const currentStatus = project.status || 'ACTIVE';
    const config = statusConfigs[currentStatus];
    
    if (!isAdmin) {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}>
          {config.icon}
          {config.text}
        </div>
      );
    }
    
    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.className} hover:opacity-80 transition-opacity cursor-pointer`}
        >
          {config.icon}
          {config.text}
          <span className="ml-1">▾</span>
        </button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-20">
              {PROJECT_STATUSES.map((status) => {
                const config = statusConfigs[status as keyof typeof statusConfigs];
                return (
                  <button
                    key={status}
                    onClick={() => {
                      updateProjectStatus(project._id, status as typeof project.status);
                      setShowMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm ${
                      currentStatus === status ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    {config.icon}
                    {config.text}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const getBugStatusIcon = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "OPEN":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "CLOSED":
      case "RESOLVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <BugIcon className="w-4 h-4" />;
    }
  };

  const getBugStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "OPEN":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "CLOSED":
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Get project name for a bug
  const getProjectName = (projectId?: string): string => {
    if (!projectId) return 'No Project';
    const project = projects.find(p => p._id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Filter bugs with case-insensitive comparison
  const filteredBugs = bugs.filter((b) => normalizeStatus(b.status) === selectedBugStatus);
  const filteredProjects = projects.filter((p) => (p.status || 'ACTIVE') === selectedProjectStatus);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
            <p className="text-muted-foreground">Loading status overview...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="border-b border-border px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground">Status Overview</h1>
          <p className="text-muted-foreground mt-2">View all items by status</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Bugs" value={stats.total} icon={<BugIcon className="w-5 h-5" />} />
            <StatCard label="Open" value={stats.open} icon={<AlertCircle className="w-5 h-5 text-red-600" />} />
            <StatCard label="In Progress" value={stats.progress} icon={<Clock className="w-5 h-5 text-amber-600" />} />
            <StatCard label="Closed" value={stats.closed} icon={<CheckCircle className="w-5 h-5 text-green-600" />} />
          </div>

          {/* View Type Selector */}
          <div className="mb-6 flex gap-4 border-b border-border pb-4">
            <button
              onClick={() => setViewType("bugs")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewType === "bugs" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              <BugIcon className="w-4 h-4 inline mr-2" />
              Bugs ({bugs.length})
            </button>
            <button
              onClick={() => setViewType("projects")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewType === "projects" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Projects ({projects.length})
            </button>
          </div>

          {/* Status Filter */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Filter by Status</h2>
            
            {viewType === "bugs" ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {BUG_STATUSES.map((status) => {
                  const count = bugs.filter(b => normalizeStatus(b.status) === status).length;
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedBugStatus(status)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedBugStatus === status 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getBugStatusIcon(status)}
                          <span className="font-medium text-sm">{status.replace('_', ' ')}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PROJECT_STATUSES.map((status) => {
                  const count = projects.filter(p => (p.status || 'ACTIVE') === status).length;
                  const statusConfigs = {
                    ACTIVE: { icon: <Clock className="w-4 h-4" />, text: 'Active' },
                    ON_HOLD: { icon: <Pause className="w-4 h-4" />, text: 'On Hold' },
                    COMPLETED: { icon: <CheckCircle className="w-4 h-4" />, text: 'Completed' },
                    ARCHIVED: { icon: <Archive className="w-4 h-4" />, text: 'Archived' }, // ✅ FIXED
                  };
                  const config = statusConfigs[status as keyof typeof statusConfigs];
                  
                  // Safety check: if config is undefined, skip this status
                  if (!config) {
                    console.warn('[STATUS] Unknown project status:', status);
                    return null;
                  }
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedProjectStatus(status as typeof selectedProjectStatus)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedProjectStatus === status 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span className="font-medium text-sm">{config.text}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {viewType === "bugs" 
                ? `Showing ${filteredBugs.length} of ${bugs.length} bugs`
                : `Showing ${filteredProjects.length} of ${projects.length} projects`
              }
            </p>
          </div>

          {/* Bugs View */}
          {viewType === "bugs" && (
            <div className="space-y-3">
              {filteredBugs.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-lg bg-card">
                  <BugIcon className="w-10 h-10 mx-auto opacity-50 mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No {selectedBugStatus.toLowerCase().replace('_', ' ')} bugs</p>
                </div>
              ) : (
                filteredBugs.map((bug) => (
                  <div
                    key={bug._id}
                    onClick={() => router.push(`/bugs/${bug._id}`)}
                    className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground mb-1 truncate">{bug.title}</h3>
                        {bug.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{bug.description}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          {bug.projectId && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>{getProjectName(bug.projectId)}</span>
                            </div>
                          )}
                          {bug.priority && (
                            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {bug.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getBugStatusColor(bug.status)}`}>
                        {normalizeStatus(bug.status).replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Projects View */}
          {viewType === "projects" && (
            <div className="space-y-3">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-lg bg-card">
                  <FolderOpen className="w-10 h-10 mx-auto opacity-50 mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No {selectedProjectStatus.toLowerCase().replace('_', ' ')} projects</p>
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const projectBugs = bugs.filter(b => b.projectId === project._id);
                  const openBugs = projectBugs.filter(b => normalizeStatus(b.status) === 'OPEN').length;
                  
                  return (
                    <div
                      key={project._id}
                      onClick={() => router.push(`/projects/${project._id}`)}
                      className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground mb-1 truncate">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <BugIcon className="w-3.5 h-3.5" />
                              <span>{projectBugs.length} total bugs</span>
                            </div>
                            {openBugs > 0 && (
                              <div className="flex items-center gap-1.5 text-red-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{openBugs} open</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ProjectStatusBadge project={project} isAdmin={user?.role === 'ADMIN'} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}