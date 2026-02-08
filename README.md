# Bug Tracker Application

A comprehensive bug tracking and project management system built with Next.js 16, React 19, TypeScript, and Tailwind CSS. This application provides real-time bug tracking, project management, and role-based access control.

## Features

### Authentication & Authorization
- Secure JWT-based authentication with HttpOnly cookies
- Role-based access control (ADMIN, TESTER, DEVELOPER)
- Protected routes and restricted page access
- Session management with automatic token refresh
- Logout functionality

### Dashboard & Statistics
- Real-time stats with auto-update every 5 seconds
- Total bugs, open issues, in-progress tasks, and closed items
- Quick project and issue access
- Status overview with clickable stats
- Synchronized statistics across all pages

### Bug Management
- Create, read, update, and delete bugs
- Filter by status (Open, In Progress, Closed)
- Filter by priority (Low, Medium, High)
- Real-time bug list updates
- Role-based bug creation (Testers only)

### Project Management
- Create and manage projects (Admin only)
- View project details
- Track bugs per project
- Auto-updating project list

### Status Page
- Comprehensive status overview
- Filter bugs and projects by status
- Real-time data refresh
- Visual status indicators with color coding

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19.2 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Hooks with Context API
- **HTTP Client**: Custom Fetch API wrapper
- **Authentication**: JWT with context-based auth

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with AuthProvider
│   ├── page.tsx                # Landing page with conditional nav
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Registration page
│   ├── dashboard/page.tsx      # Main dashboard with stats
│   ├── bugs/
│   │   ├── page.tsx            # Issues list with filters
│   │   └── create/page.tsx     # Create bug (tester only)
│   ├── projects/
│   │   ├── page.tsx            # Projects list
│   │   └── [projectId]/page.tsx # Project details
│   └── status/page.tsx         # Status overview page
├── components/
│   ├── LoginForm.tsx           # Login form with validation
│   ├── LoginFormWrapper.tsx    # Auth check wrapper
│   ├── RegisterForm.tsx        # Registration form
│   ├── RegisterFormWrapper.tsx # Auth check wrapper
│   ├── StatCard.tsx            # Reusable stat card component
│   ├── BugCard.tsx             # Bug item component
│   └── ProtectedRoutes.tsx     # Route protection wrapper
├── context/
│   └── AuthContext.tsx         # Auth state management
├── hooks/
│   ├── useAuth.ts              # Auth context hook
│   ├── useStats.ts             # Real-time stats hook
│   └── use-mobile.tsx          # Mobile detection hook
├── lib/
│   ├── api.ts                  # API client with error handling
│   ├── utils.ts                # Utility functions
│   └── validations/
│       └── auth.ts             # Form validation schemas
└── public/
    └── [static assets]
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Backend API running on `http://localhost:5000`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bug-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## API Endpoints Required

The backend API must implement these endpoints:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Bugs
- `GET /bugs` - Get all bugs (with optional filters: status, priority)
- `GET /bugs/:id` - Get bug details
- `POST /bugs` - Create bug (Tester only)
- `PUT /bugs/:id` - Update bug
- `DELETE /bugs/:id` - Delete bug

### Projects
- `GET /project` - Get all projects
- `GET /project/:id` - Get project details
- `POST /project` - Create project (Admin only)
- `PUT /project/:id` - Update project
- `DELETE /project/:id` - Delete project

### Response Format
All endpoints should return data in this format:
```json
{
  "user": { "_id": "...", "email": "...", "name": "...", "role": "..." },
  "token": "jwt-token-here"
}
```

## Real-Time Updates

The application includes automatic real-time updates:

### Update Intervals
- **Dashboard**: Stats refresh every 5 seconds
- **Bugs Page**: Stats refresh every 5 seconds
- **Projects Page**: List refreshes every 5 seconds
- **Status Page**: Data refreshes every 5 seconds

### Custom Refresh Interval
Modify the interval in individual pages or hooks:
```typescript
const { stats } = useStats(10000); // 10 seconds
```

## Authentication Flow

1. User visits the application
2. AuthContext initializes and checks for stored token
3. If token exists and valid, user is logged in
4. Protected routes check authentication status
5. On 401 response, user is redirected to login with `?expired=true` flag
6. Token is stored in localStorage and passed with every API request

## Role-Based Access Control

- **ADMIN**: Create/manage projects, view all data
- **TESTER**: Create bugs, view bugs and projects
- **DEVELOPER**: View bugs, update bug status

## Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Graceful fallback with error messages
- **Authentication Errors**: Automatic redirect to login
- **Validation Errors**: Client-side form validation before submission
- **Server Errors**: User-friendly error messages from API
- **Logging**: All errors logged to browser console with `[v0]` prefix

## Production Readiness Checklist

### ✅ Implemented
- [x] TypeScript with strict type checking
- [x] Secure authentication with JWT tokens
- [x] Protected routes and role-based access
- [x] Environment variable configuration
- [x] Error handling and logging
- [x] Form validation
- [x] Real-time auto-updating stats
- [x] Responsive design
- [x] ARIA labels and accessibility basics
- [x] Hydration mismatch fixes
- [x] Auto-refresh intervals for data freshness

### ⚠️ Recommended for Production
1. **Backend Validation**: Implement strict validation on backend API
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **HTTPS**: Deploy with HTTPS only (no HTTP)
4. **CORS Configuration**: Configure CORS properly in backend
5. **Database Backups**: Set up automated backups
6. **Monitoring**: Add application monitoring (Sentry, LogRocket)
7. **Analytics**: Add user analytics (Mixpanel, Amplitude)
8. **Performance**: Implement caching strategies
9. **Security Headers**: Add CSP, X-Frame-Options headers
10. **Testing**: Add unit and integration tests

## TypeScript Status

✅ **Fully Type-Safe**
- All pages have proper component types
- All hooks have return type annotations
- All function parameters are typed
- Interface definitions for data models
- No `any` types in critical code paths

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
1. Build: `npm run build`
2. Start: `npm run start`
3. Ensure `NEXT_PUBLIC_API_URL` is set in production environment

## Troubleshooting

### Login/Register Fails
1. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
2. Verify backend API is running
3. Check browser console for `[v0]` error messages
4. Ensure API endpoints return correct response format

### Stats Not Updating
1. Check if backend API is returning data
2. Verify network tab shows API requests every 5 seconds
3. Check browser console for network errors
4. Try manual refresh: Press F5 or click refresh button

### Pages Not Loading
1. Check if you're authenticated (should see Dashboard)
2. If not authenticated, should see login page
3. Check protected routes are wrapped with `<ProtectedRoute>`

## Support & Documentation

See individual documentation files:
- `JWT_TOKEN_MANAGEMENT.md` - Token handling details
- `API_TROUBLESHOOTING.md` - API debugging guide
- `AUTHENTICATION.md` - Auth implementation details
- `STATS_SYNCHRONIZATION.md` - Stats sync architecture

## License

MIT License - Feel free to use in your projects
