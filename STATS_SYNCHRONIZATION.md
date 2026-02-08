# Stats Synchronization Guide

## Overview

All pages in the application now use a centralized stats calculation hook (`useStats`) to ensure consistent data across the dashboard, bugs page, and status page.

## Shared Stats Hook

**Location:** `/hooks/useStats.ts`

The `useStats` hook provides:
- **total**: Total number of bugs
- **open**: Bugs with OPEN status
- **progress**: Bugs with IN_PROGRESS status
- **closed**: Bugs with CLOSED status
- **resolved**: Bugs with RESOLVED status
- **projects**: Total number of projects

### Usage

```tsx
import { useStats } from '@/hooks/useStats';

function MyComponent() {
  const { stats, loading, error, refetch } = useStats();
  
  return (
    <div>
      <p>Total Bugs: {stats.total}</p>
      <p>Open: {stats.open}</p>
    </div>
  );
}
```

## Pages Using Shared Stats

### 1. Dashboard (`/app/dashboard/page.tsx`)
- Uses `useStats` for the main statistics display
- Shows total bugs, open, in progress, closed, and projects count
- Auto-updates when page loads

### 2. Bugs Page (`/app/bugs/page.tsx`)
- Uses `useStats` for the stats cards at the top
- Can filter bugs by status and priority independently
- Stats remain consistent with other pages

### 3. Status Page (`/app/status/page.tsx`)
- Uses `useStats` for the stats overview section
- Shows all 5 bug status metrics
- Allows filtering by individual status types

## Pages with Isolated Stats

### Project Details (`/app/projects/[projectId]/page.tsx`)
- **Calculates own stats** for the specific project
- Only counts bugs for that projectId
- This is intentional as it shows project-specific metrics

## Data Consistency

The stats are calculated identically across all pages:

```typescript
const stats = {
  total: bugsData.length,
  open: bugsData.filter((b) => b.status === 'OPEN').length,
  progress: bugsData.filter((b) => b.status === 'IN_PROGRESS').length,
  closed: bugsData.filter((b) => b.status === 'CLOSED').length,
  resolved: bugsData.filter((b) => b.status === 'RESOLVED').length,
  projects: projectsData.length,
};
```

## Why Synchronization Matters

1. **Single Source of Truth** - All pages fetch and calculate data the same way
2. **Consistency** - Stats on dashboard match stats on bugs page and status page
3. **Maintainability** - Changes to calculation logic only need to be made in one place
4. **Performance** - Hook manages caching and prevents redundant API calls

## Refreshing Stats

To refresh stats manually:

```tsx
const { stats, refetch } = useStats();

// Refresh stats
await refetch();
```

This is useful after creating, updating, or deleting bugs.

## Real-time Updates

The stats are fetched when:
1. Component mounts (useEffect with empty dependency array in hook)
2. `refetch()` is manually called
3. Page is navigated to

For real-time updates on data changes, call `refetch()` after mutation operations (create, update, delete).

## Environment Variables

The API base URL is configured in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Ensure your backend is running on this URL for stats to load correctly.
