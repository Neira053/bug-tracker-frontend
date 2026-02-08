'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoutes';
import useAuth from '@/hooks/useAuth';
import { FolderOpen, AlertCircle, Plus, Loader2, CheckCircle, Clock, Archive, Trash2, UserPlus, X, BugIcon, CircleDot } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  createdBy?: string;
  members?: Array<{ _id: string; name: string; email: string; role: string }>;
  createdAt?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Bug {
  _id: string;
  projectId: string;
  status: string;
}

type BugHealth = 'EMPTY' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export default function ProjectsPageWithStatus() {
  const { user } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Member management state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [addingMember, setAddingMember] = useState(false);

  // Bug health state
  const [projectBugs, setProjectBugs] = useState<Record<string, Bug[]>>({});

  // Fetch projects
  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/project');
      
      let projectsData: Project[] = [];
      
      if (Array.isArray(res)) {
        projectsData = res;
      } else if (res.data && Array.isArray(res.data)) {
        projectsData = res.data;
      } else if (res.projects && Array.isArray(res.projects)) {
        projectsData = res.projects;
      }
      
      setProjects(projectsData);
      
      // Fetch bugs for all projects
      if (projectsData.length > 0) {
        fetchAllBugs();
      }
    } catch (err: any) {
      console.error('[v0] Failed to fetch projects', err);
      setError(err.response?.data?.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all bugs and group by project
  const fetchAllBugs = async () => {
    try {
      const res = await API.get('/bugs');
      let bugsData: Bug[] = [];
      
      if (Array.isArray(res)) {
        bugsData = res;
      } else if (res.data && Array.isArray(res.data)) {
        bugsData = res.data;
      } else if (res.bugs && Array.isArray(res.bugs)) {
        bugsData = res.bugs;
      }

      // Group bugs by project
      const bugsByProject: Record<string, Bug[]> = {};
      bugsData.forEach(bug => {
        const projectId = typeof bug.projectId === 'object' 
          ? (bug.projectId as any)?._id || (bug.projectId as any)?.id 
          : bug.projectId;
        
        if (projectId) {
          if (!bugsByProject[projectId]) {
            bugsByProject[projectId] = [];
          }
          bugsByProject[projectId].push(bug);
        }
      });

      setProjectBugs(bugsByProject);
    } catch (err) {
      console.error('[v0] Failed to fetch bugs', err);
    }
  };

  // Compute bug health for a project
  const computeBugHealth = (projectId: string): BugHealth => {
    const bugs = projectBugs[projectId] || [];
    
    if (bugs.length === 0) {
      return 'EMPTY';
    }

    const hasOpen = bugs.some(bug => bug.status === 'OPEN');
    const hasInProgress = bugs.some(bug => bug.status === 'IN_PROGRESS');
    const allClosed = bugs.every(bug => bug.status === 'CLOSED' || bug.status === 'RESOLVED');

    if (allClosed) {
      return 'COMPLETED';
    } else if (hasInProgress) {
      return 'IN_PROGRESS';
    } else if (hasOpen) {
      return 'OPEN';
    }

    return 'EMPTY';
  };

  // Bug Health Badge Component
  const BugHealthBadge = ({ projectId }: { projectId: string }) => {
    const health = computeBugHealth(projectId);
    const bugs = projectBugs[projectId] || [];
    const bugCount = bugs.length;

    const healthConfigs = {
      EMPTY: {
        icon: <CircleDot className="w-3 h-3" />,
        text: 'No Bugs',
        className: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
      },
      OPEN: {
        icon: <AlertCircle className="w-3 h-3" />,
        text: `${bugCount} Open`,
        className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
      },
      IN_PROGRESS: {
        icon: <Loader2 className="w-3 h-3" />,
        text: `${bugCount} In Progress`,
        className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
      },
      COMPLETED: {
        icon: <CheckCircle className="w-3 h-3" />,
        text: `${bugCount} Resolved`,
        className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
      },
    };

    const config = healthConfigs[health];

    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <BugIcon className="w-3 h-3" />
        {config.text}
      </div>
    );
  };

  // Create project
  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    setCreating(true);
    setError('');

    try {
      const res = await API.post('/project', { 
        name: name.trim(),
        status: 'ACTIVE'
      });
      
      let newProject: Project | null = null;
      
      if (res._id || res.id) {
        newProject = {
          _id: res._id || res.id,
          name: res.name,
          description: res.description,
          status: res.status || 'ACTIVE',
          members: res.members || [],
          createdAt: res.createdAt,
        };
      } else if (res.data) {
        newProject = {
          _id: res.data._id || res.data.id,
          name: res.data.name,
          description: res.data.description,
          status: res.data.status || 'ACTIVE',
          members: res.data.members || [],
          createdAt: res.data.createdAt,
        };
      }
      
      if (newProject) {
        setProjects((prev) => [...prev, newProject!]);
        setName('');
        router.push(`/projects/${newProject._id}`);
      }
    } catch (err: any) {
      console.error('[v0] Failed to create project', err);
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  // Delete project (Admin only)
  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await API.delete(`/project/${projectId}`);
      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (err: any) {
      console.error('[v0] Failed to delete project', err);
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  // Update project status
  const updateProjectStatus = async (projectId: string, newStatus: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED') => {
    try {
      await API.patch(`/project/${projectId}`, { status: newStatus });
      
      setProjects(prev => prev.map(p => 
        p._id === projectId ? { ...p, status: newStatus } : p
      ));
    } catch (err) {
      console.error('Failed to update project status', err);
    }
  };

  // Fetch available users for adding members
  const fetchAvailableUsers = async (projectId: string) => {
    try {
      const res = await API.get('/users'); // Adjust endpoint as needed
      let users: User[] = [];
      
      if (Array.isArray(res)) {
        users = res;
      } else if (res.data && Array.isArray(res.data)) {
        users = res.data;
      } else if (res.users && Array.isArray(res.users)) {
        users = res.users;
      }
      
      // Filter out users who are already members
      const project = projects.find(p => p._id === projectId);
      if (project && project.members) {
        const memberIds = project.members.map(m => m._id);
        users = users.filter(u => !memberIds.includes(u._id));
      }
      
      setAvailableUsers(users);
    } catch (err) {
      console.error('[v0] Failed to fetch users', err);
      setAvailableUsers([]);
    }
  };

  // Add member to project
  const addMemberToProject = async (userId: string) => {
    if (!selectedProject) return;

    setAddingMember(true);
    try {
      await API.post(`/project/${selectedProject._id}/members`, { userId });
      
      // Refresh projects to get updated member list
      await fetchProjects();
      
      // Update available users list
      await fetchAvailableUsers(selectedProject._id);
      
    } catch (err: any) {
      console.error('[v0] Failed to add member', err);
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  // Remove member from project
  const removeMemberFromProject = async (projectId: string, memberId: string) => {
    try {
      await API.delete(`/project/${projectId}/members/${memberId}`);
      
      // Update local state
      setProjects(prev => prev.map(p => {
        if (p._id === projectId && p.members) {
          return {
            ...p,
            members: p.members.filter(m => m._id !== memberId)
          };
        }
        return p;
      }));

      // If modal is open, update selected project
      if (selectedProject && selectedProject._id === projectId) {
        setSelectedProject(prev => prev ? {
          ...prev,
          members: prev.members?.filter(m => m._id !== memberId)
        } : null);
        await fetchAvailableUsers(projectId);
      }
    } catch (err: any) {
      console.error('[v0] Failed to remove member', err);
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Open member management modal
  const openMemberModal = async (project: Project) => {
    setSelectedProject(project);
    setShowMemberModal(true);
    await fetchAvailableUsers(project._id);
  };

  // Status badge component
  const StatusBadge = ({ status, projectId, isAdmin }: { 
    status?: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED', 
    projectId: string,
    isAdmin: boolean 
  }) => {
    const [showMenu, setShowMenu] = useState(false);
    
    const configs = {
      ACTIVE: { 
        icon: <Clock className="w-3 h-3" />, 
        text: 'Active', 
        className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400' 
      },
      ON_HOLD: { 
        icon: <AlertCircle className="w-3 h-3" />, 
        text: 'On Hold', 
        className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400' 
      },
      COMPLETED: { 
        icon: <CheckCircle className="w-3 h-3" />, 
        text: 'Completed', 
        className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' 
      },
      ARCHIVED: { 
        icon: <Archive className="w-3 h-3" />, 
        text: 'Archived', 
        className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300' 
      },
    };
    
    const currentStatus = status || 'ACTIVE';
    const config = configs[currentStatus];
    
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
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.className} hover:opacity-80 transition-opacity`}
        >
          {config.icon}
          {config.text}
        </button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-20">
              {Object.entries(configs).map(([statusKey, statusConfig]) => (
                <button
                  key={statusKey}
                  onClick={() => {
                    updateProjectStatus(projectId, statusKey as any);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-2 text-foreground"
                >
                  {statusConfig.icon}
                  {statusConfig.text}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-2">Manage all projects and track their status</p>
          </div>

          {user?.role === "ADMIN" && (
            <form onSubmit={createProject} className="mb-8 flex gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                required
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive flex gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="animate-spin w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-12 border border-border rounded-xl bg-card">
              <FolderOpen className="w-10 h-10 mx-auto opacity-50 mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No projects found</p>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p) => {
                if (!p) return null;
                
                const projectId = p._id || (p as any).id;
                const projectName = typeof p.name === 'object' 
                  ? ((p.name as any)?.name || 'Untitled')
                  : (p.name || 'Untitled Project');
                
                const memberCount = p.members?.length || 0;
                
                return (
                  <div
                    key={projectId}
                    className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all relative group"
                  >
                    {/* Project Header */}
                    <div 
                      onClick={() => router.push(`/projects/${projectId}`)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <FolderOpen className="w-8 h-8 text-primary flex-shrink-0" />
                        <StatusBadge 
                          status={p.status} 
                          projectId={projectId}
                          isAdmin={user?.role === 'ADMIN'}
                        />
                      </div>
                      
                      <h2 className="font-semibold text-foreground text-lg mb-2">{projectName}</h2>
                      
                      {p.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {p.description}
                        </p>
                      )}

                      {/* Bug Health Badge */}
                      <div className="mb-3">
                        <BugHealthBadge projectId={projectId} />
                      </div>

                      {/* Members count */}
                      <p className="text-xs text-muted-foreground">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </p>
                    </div>

                    {/* Admin Actions */}
                    {user?.role === 'ADMIN' && (
                      <div className="mt-4 pt-4 border-t border-border flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openMemberModal(p)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Members
                        </button>
                        <button
                          onClick={() => deleteProject(projectId, projectName)}
                          className="px-3 py-2 text-sm bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Member Management Modal */}
        {showMemberModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  Manage Members - {typeof selectedProject.name === 'object' ? 'Project' : selectedProject.name}
                </h3>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {/* Current Members */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Current Members ({selectedProject.members?.length || 0})</h4>
                  {selectedProject.members && selectedProject.members.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.members.map((member) => (
                        <div key={member._id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email} · {member.role}</p>
                          </div>
                          <button
                            onClick={() => removeMemberFromProject(selectedProject._id, member._id)}
                            className="p-2 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No members yet</p>
                  )}
                </div>

                {/* Add Members */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Add Members</h4>
                  {availableUsers.length > 0 ? (
                    <div className="space-y-2">
                      {availableUsers.map((userItem) => (
                        <div key={userItem._id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{userItem.name}</p>
                            <p className="text-sm text-muted-foreground">{userItem.email} · {userItem.role}</p>
                          </div>
                          <button
                            onClick={() => addMemberToProject(userItem._id)}
                            disabled={addingMember}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No available users to add</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border">
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}