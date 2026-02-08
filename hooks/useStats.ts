'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import API from '@/lib/api';

export interface Stats {
  total: number;
  open: number;
  progress: number;
  closed: number;
  resolved: number;
  projects: number;
}

interface Bug {
  _id: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
  [key: string]: any;
}

interface Project {
  _id: string;
  [key: string]: any;
}

/**
 * Custom hook for fetching and auto-refreshing bug tracker statistics
 * 
 * @param autoRefreshInterval - Time in milliseconds between auto-refreshes (default: 5000ms)
 *                              Set to 0 to disable auto-refresh
 * @returns Object containing stats, loading state, error state, and manual refetch function
 */
export function useStats(autoRefreshInterval: number = 5000) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    open: 0,
    progress: 0,
    closed: 0,
    resolved: 0,
    projects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Track if a fetch is in progress to prevent overlapping requests
  const isFetchingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch stats from API and update state
   * Uses a ref to prevent memory leaks and overlapping requests
   */
  const fetchStats = useCallback(async () => {
    // Prevent overlapping requests
    if (isFetchingRef.current) {
      console.log('[v0] Skipping stats fetch - request already in progress');
      return;
    }

    isFetchingRef.current = true;

    try {
      console.log('[v0] Fetching stats...');
      
      // Fetch bugs and projects in parallel
      const [bugsRes, projectsRes] = await Promise.all([
        API.get<any>('/bugs'),
        API.get<any>('/project'),
      ]);

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('[v0] Component unmounted, skipping state update');
        return;
      }

      // Handle different response formats
      // Your backend might return: { data: [...] } or [...] directly
      let bugsData: Bug[] = [];
      let projectsData: Project[] = [];

      // Extract bugs data
      if (Array.isArray(bugsRes)) {
        // Direct array response
        bugsData = bugsRes;
      } else if (bugsRes.data && Array.isArray(bugsRes.data)) {
        // Wrapped in data property
        bugsData = bugsRes.data;
      } else if (bugsRes.bugs && Array.isArray(bugsRes.bugs)) {
        // Alternative naming
        bugsData = bugsRes.bugs;
      }

      // Extract projects data
      if (Array.isArray(projectsRes)) {
        // Direct array response
        projectsData = projectsRes;
      } else if (projectsRes.data && Array.isArray(projectsRes.data)) {
        // Wrapped in data property
        projectsData = projectsRes.data;
      } else if (projectsRes.projects && Array.isArray(projectsRes.projects)) {
        // Alternative naming
        projectsData = projectsRes.projects;
      }

      console.log('[v0] Bugs data:', bugsData.length, 'items');
      console.log('[v0] Projects data:', projectsData.length, 'items');

      // Calculate stats from fetched data
      const newStats: Stats = {
        total: bugsData.length,
        open: bugsData.filter((b) => b.status === 'OPEN').length,
        progress: bugsData.filter((b) => b.status === 'IN_PROGRESS').length,
        closed: bugsData.filter((b) => b.status === 'CLOSED').length,
        resolved: bugsData.filter((b) => b.status === 'RESOLVED').length,
        projects: projectsData.length,
      };

      console.log('[v0] Stats updated:', newStats);
      
      setStats(newStats);
      setError(null);
      
    } catch (err: any) {
      console.error('[v0] Failed to fetch stats:', err.message);
      
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch statistics';
        setError(errorMessage);
      }
    } finally {
      isFetchingRef.current = false;
      
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Empty deps - function is stable and doesn't depend on props/state

  // Initial fetch on mount
  useEffect(() => {
    console.log('[v0] useStats: Initial fetch');
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh at specified interval
  useEffect(() => {
    // Skip auto-refresh if interval is 0 or negative
    if (autoRefreshInterval <= 0) {
      console.log('[v0] Auto-refresh disabled (interval <= 0)');
      return;
    }

    console.log(`[v0] Setting up auto-refresh every ${autoRefreshInterval}ms`);
    
    const interval = setInterval(() => {
      console.log('[v0] Auto-refresh triggered');
      fetchStats();
    }, autoRefreshInterval);

    // Cleanup interval on unmount or when interval changes
    return () => {
      console.log('[v0] Cleaning up auto-refresh interval');
      clearInterval(interval);
    };
  }, [fetchStats, autoRefreshInterval]);

  return { 
    stats, 
    loading, 
    error, 
    refetch: fetchStats 
  };
}