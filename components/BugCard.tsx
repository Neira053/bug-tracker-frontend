'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import API from '@/lib/api';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TESTER' | 'DEVELOPER';
}

interface Bug {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

interface BugCardProps {
  bug: Bug;
  user: User | null;
  onDelete?: (bugId: string) => void;
}

export default function BugCard({ bug, user, onDelete }: BugCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${bug.title}"?`)) return;
    
    setDeleting(true);
    try {
      await API.delete(`/bugs/${bug._id}`);
      
      // Call parent callback if provided
      if (onDelete) {
        onDelete(bug._id);
      }
    } catch (err: any) {
      console.error('[v0] Failed to delete bug:', err);
      alert(err.response?.data?.message || 'Failed to delete bug');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => router.push(`/bugs/${bug._id}`)}
      className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{bug.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bug.description}</p>
        </div>
        <div className="flex gap-2 ml-4 items-start">
          <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary whitespace-nowrap">
            {bug.status.replace('_', ' ')}
          </span>
          <span
            className={`px-2 py-1 text-xs rounded whitespace-nowrap font-medium ${
              bug.priority === 'HIGH'
                ? 'bg-red-500/10 text-red-600'
                : bug.priority === 'MEDIUM'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-green-500/10 text-green-600'
            }`}
          >
            {bug.priority}
          </span>

          {/* Delete button - only for Admin and Tester */}
          {(user?.role === 'ADMIN' || user?.role === 'TESTER') && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 hover:bg-red-500/10 text-red-600 rounded transition-colors disabled:opacity-50"
              title="Delete bug"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}