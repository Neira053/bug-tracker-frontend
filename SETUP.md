# Bug Tracker Frontend - Setup Guide

## Installation & Environment Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn package manager
- Git

### Step 1: Install Dependencies

All required dependencies are already listed in `package.json`. Install them using:

```bash
npm install
# or
yarn install
```

### Step 2: Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your configuration:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Environment Variables Explained:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:5000/api` | Backend API endpoint. Use `NEXT_PUBLIC_` prefix to expose to browser. For production, set to your deployed backend URL. |

### Step 3: Development Server

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Authentication Pages

### Login Page
- **Route:** `/login`
- **Features:** Email/password authentication with password visibility toggle
- **Form Validation:** Uses Zod schema for validation
- **Error Handling:** Server errors displayed to user
- **Redirect:** Authenticated users redirected to dashboard

### Registration Page
- **Route:** `/register`
- **Features:** Account creation with name, email, password, and role selection
- **Validation:**
  - Name: 2-100 characters
  - Email: Valid email format
  - Password: Min 6 chars, must include uppercase, lowercase, and number
  - Role: Admin, Tester, or Developer
  - Password confirmation: Must match password
- **Password Strength Indicator:** Shows real-time password requirements
- **Error Handling:** Server and validation errors displayed

### Home Page
- **Route:** `/` (root)
- **Features:** Marketing homepage with feature highlights
- **Navigation:** Links to login and register pages
- **Auto-redirect:** Authenticated users automatically redirected to dashboard

## API Endpoints Required

Your backend should implement these authentication endpoints:

### POST `/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMIN"
  }
}
```

### POST `/auth/register`
**Request:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "TESTER"
}
```

**Response (201 Created):**
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "TESTER"
  }
}
```

### Error Response
```json
{
  "message": "Invalid email or password"
}
```


### Step 4: Production Build

Build for production:

```bash
npm run build
npm start
```

---

## Dependencies Overview

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | React framework with built-in routing and SSR |
| `react` | 19 | UI library |
| `react-dom` | 19 | React DOM rendering |
| `typescript` | 5.7.3 | Type safety |

### UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 3.4.17 | Utility-first CSS framework |
| `autoprefixer` | 10.4.20 | Vendor prefixes for CSS |
| `tailwind-merge` | 2.5.5 | Merge Tailwind classes intelligently |
| `tailwindcss-animate` | 1.0.7 | Animation utilities |
| `next-themes` | 0.4.6 | Dark mode support |

### UI Components (shadcn/ui via Radix UI)

Built-in UI components library using Radix UI primitives:
- Buttons, forms, dialogs, dropdowns, etc.
- Fully accessible and customizable
- All `@radix-ui/*` packages are included

### Form & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | 7.54.1 | Efficient form state management |
| `@hookform/resolvers` | 3.9.1 | Schema validation resolvers |
| `zod` | 3.24.1 | TypeScript-first schema validation |

### Icons & Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | 0.544.0 | Beautiful icon library |
| `class-variance-authority` | 0.7.1 | Component variant management |
| `clsx` | 2.1.1 | Conditional CSS class builder |
| `sonner` | 1.7.1 | Toast notifications |

### Data Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | 2.15.0 | React charts library |

### Other Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | 4.1.0 | Date manipulation |
| `cmdk` | 1.1.1 | Command palette/search |
| `embla-carousel-react` | 8.5.1 | Carousel component |
| `react-resizable-panels` | 2.1.7 | Resizable panel layouts |
| `react-day-picker` | 8.10.1 | Date picker component |
| `input-otp` | 1.4.1 | OTP input component |
| `vaul` | 1.1.2 | Drawer component |

---

## Project Structure

```
/vercel/share/v0-project/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home/login page
│   ├── dashboard/page.tsx   # Dashboard page
│   ├── projects/            # Projects pages
│   ├── bugs/                # Bugs pages
│   ├── status/              # Status overview page
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   ├── Navbar.tsx          # Navigation bar
│   ├── ProtectedRoutes.tsx # Route protection wrapper
│   ├── BugCard.tsx         # Bug card component
│   ├── theme-provider.tsx  # Dark mode provider
│   └── ui/                 # shadcn/ui components
├── context/                # React context providers
│   └── AuthContext.tsx     # Authentication context
├── hooks/                  # Custom React hooks
│   └── useAuth.ts         # Auth hook
├── lib/                    # Utility functions
│   ├── api.ts             # API client
│   └── utils.ts           # Helper utilities
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind configuration
├── next.config.mjs         # Next.js configuration
└── tsconfig.json           # TypeScript configuration
```

---

## Key Features

### Authentication
- Role-based access control (Admin, Tester, Developer)
- Demo login for testing
- Protected routes with automatic redirects
- Session management via localStorage

### Pages

1. **Home/Login** (`/`) - Role selection and authentication
2. **Dashboard** (`/dashboard`) - Overview with stats and quick actions
3. **Projects** (`/projects`) - Project list and management
4. **Project Details** (`/projects/[projectId]`) - Individual project with bugs
5. **Bugs** (`/bugs`) - Bug list with filtering by status and priority
6. **Create Bug** (`/bugs/create`) - New bug creation form
7. **Bug Details** (`/bugs/[id]`) - Individual bug view and updates
8. **Status Overview** (`/status`) - Comprehensive status filtering

### API Integration

The frontend connects to a backend API at `NEXT_PUBLIC_API_URL`:

**Expected API Endpoints:**
- `GET /bugs` - Get all bugs
- `GET /bugs?status=OPEN` - Get bugs by status
- `POST /bugs` - Create new bug
- `PUT /bugs/{id}` - Update bug
- `DELETE /bugs/{id}` - Delete bug
- `GET /project` - Get all projects
- `POST /project` - Create project
- `GET /project/{id}` - Get project with bugs

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running on the specified URL
- Check browser console for CORS errors
- Backend should have proper CORS headers

### Dark Mode Not Working
- Clear browser cache and localStorage
- Ensure `next-themes` is properly initialized
- Check that `ThemeProvider` wraps the app in `layout.tsx`

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` → Your production backend URL
4. Deploy

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Other Platforms

Set the same environment variable and run:
```bash
npm run build
npm start
```

---

## Development Tips

- Use `npm run dev` for hot reload during development
- Check browser DevTools console for errors
- Use `console.log("[v0] ...")` for debugging
- Always rebuild after changing environment variables

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code structure and comments
3. Verify API endpoints match your backend
4. Check environment variables are set correctly
