# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

**All dependencies are pre-configured in `package.json`** including:
- Next.js 16
- React 19
- Tailwind CSS
- shadcn/ui components
- Form validation (React Hook Form + Zod)
- Icons (Lucide React)
- Dark theme support (next-themes)

## 2. Setup Environment

Create `.env.local` in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**That's it!** The API base URL is the only required environment variable.

## 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Login with Demo Account

Select one of three roles:
- **Admin** - Full access to create projects and manage all bugs
- **Tester** - Can view projects and create bug reports
- **Developer** - Can view and update bug status

## Production Build

```bash
npm run build    # Build for production
npm start        # Start production server
```

---

## Architecture Overview

### Frontend Structure
- **Authentication**: Context-based with localStorage persistence
- **Routing**: Next.js App Router with protected routes
- **State Management**: React hooks + Context API
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: shadcn/ui built on Radix UI

### Key Files
- `app/layout.tsx` - Root layout with auth providers
- `context/AuthContext.tsx` - Auth state management
- `components/Navbar.tsx` - Main navigation
- `lib/api.ts` - API client (handles auth headers)

### API Connection
The frontend communicates with backend at `NEXT_PUBLIC_API_URL`:

```javascript
// Example API calls
GET  /api/project              // Get all projects
POST /api/project              // Create project
GET  /api/bugs                 // Get all bugs
POST /api/bugs                 // Create bug
PUT  /api/bugs/{id}            // Update bug
DELETE /api/bugs/{id}          // Delete bug
```

---

## Deployment Checklist

- [ ] Install dependencies: `npm install`
- [ ] Create `.env.local` with backend URL
- [ ] Test locally: `npm run dev`
- [ ] Build: `npm run build`
- [ ] Set `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Deploy to hosting (Vercel, Docker, etc.)

---

## Common Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run linter
```

---

## Important Notes

1. **Environment Variables**: Must start with `NEXT_PUBLIC_` to be accessible in the browser
2. **Backend URL**: Update `NEXT_PUBLIC_API_URL` before production deployment
3. **Authentication**: Token stored in localStorage, sent as `Bearer` token in API headers
4. **Dark Mode**: Automatically enabled, respects system preference
5. **Responsive Design**: Works on mobile, tablet, and desktop

---

## Next Steps

1. Start development server
2. Login with demo account
3. Explore dashboard and features
4. Integrate with your backend API
5. Deploy to production

For detailed setup instructions, see `SETUP.md`
