# Authentication System - Complete Guide

## Overview

The Bug Tracker frontend has a complete, production-ready authentication system with login and registration pages. It uses:
- **Form Validation**: Zod for schema validation
- **State Management**: React Context API for auth state
- **Form Handling**: React Hook Form for efficient form management
- **Password Security**: Client-side validation with strength indicators
- **Error Handling**: User-friendly error messages

## Pages

### 1. Home Page (`/`)
- **Purpose**: Marketing landing page for unauthenticated users
- **Features**:
  - Navigation bar with Sign in / Get started buttons
  - Feature highlights
  - Call-to-action buttons
  - Auto-redirects authenticated users to dashboard

### 2. Login Page (`/login`)
- **Route**: `/login`
- **Purpose**: Sign in existing users
- **Features**:
  - Email and password fields
  - Password visibility toggle
  - Form validation with inline error messages
  - Server error display
  - Link to registration page
  - Loading state during submission

**Form Fields:**
```
email: string (required, valid email format)
password: string (required, min 6 characters)
```

### 3. Registration Page (`/register`)
- **Route**: `/register`
- **Purpose**: Create new user accounts
- **Features**:
  - Name field (2-100 characters)
  - Email field (valid email format)
  - Role selection dropdown (Admin, Tester, Developer)
  - Password field with strength indicator
  - Confirm password field
  - Real-time password validation
  - Form validation with inline error messages
  - Server error display
  - Link to login page
  - Loading state during submission

**Form Fields:**
```
name: string (2-100 characters)
email: string (required, valid email format)
password: string (min 6 chars, uppercase, lowercase, number)
confirmPassword: string (must match password)
role: 'ADMIN' | 'TESTER' | 'DEVELOPER'
```

**Password Requirements:**
- Minimum 6 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## Authentication Flow

### Login Flow
1. User navigates to `/login`
2. Enters email and password
3. Client validates form (Zod schema)
4. On valid input, POST request to `/auth/login` endpoint
5. Backend validates credentials
6. If successful:
   - Token stored in localStorage
   - User data stored in localStorage
   - Auth context updated
   - User redirected to `/dashboard`
7. If failed:
   - Error message displayed
   - User can retry

### Registration Flow
1. User navigates to `/register`
2. Enters name, email, password, role, confirm password
3. Client validates form (Zod schema)
4. Password strength shown in real-time
5. On valid input, POST request to `/auth/register` endpoint
6. Backend creates user account
7. If successful:
   - Token stored in localStorage
   - User data stored in localStorage
   - Auth context updated
   - User redirected to `/dashboard`
8. If failed:
   - Error message displayed
   - User can retry

### Logout Flow
1. User clicks logout in navbar
2. Auth context clears user data
3. localStorage cleared
4. User redirected to `/`

## State Management

### AuthContext Structure
```typescript
interface AuthContextType {
  user: User | null;           // Current user or null
  isLoading: boolean;           // Auth state loading
  isAuthenticated: boolean;     // True if user logged in
  logout: () => void;           // Logout function
  login: (user: User) => void;  // Set user after auth
}
```

### useAuth Hook
```typescript
const { user, loading, isAuthenticated, logout, login } = useAuth();
```

## API Integration

### Required Backend Endpoints

#### POST `/auth/login`
Authenticates user with email and password.

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user-id-123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMIN"
  }
}
```

**Error Response (401/400):**
```json
{
  "message": "Invalid email or password"
}
```

#### POST `/auth/register`
Creates a new user account.

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user-id-123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "TESTER"
  }
}
```

**Error Response (400):**
```json
{
  "message": "Email already registered"
}
```

## Security Considerations

### Client-Side Security
- **Password Visibility Toggle**: Users can toggle password visibility
- **Form Validation**: All inputs validated using Zod schemas before submission
- **Password Requirements**: Enforced password complexity
- **No Password Exposure**: Passwords never logged or displayed after input

### Backend Requirements
- **Password Hashing**: Use bcrypt or similar (minimum 10 rounds)
- **JWT Tokens**: Secure, HttpOnly cookies or localStorage-safe tokens
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configure CORS properly in backend
- **Rate Limiting**: Implement rate limiting on auth endpoints
- **Input Validation**: Always validate server-side
- **SQL Injection Prevention**: Use parameterized queries

## File Structure

```
app/
├── login/
│   └── page.tsx           # Login page
├── register/
│   └── page.tsx           # Registration page
├── page.tsx               # Home page
└── layout.tsx             # Root layout with AuthProvider

components/
├── LoginForm.tsx          # Login form component
└── RegisterForm.tsx       # Registration form component

context/
└── AuthContext.tsx        # Auth context and provider

hooks/
└── useAuth.ts             # useAuth hook

lib/
├── api.ts                 # API client with auth headers
└── validations/
    └── auth.ts            # Zod schemas for auth forms
```

## Validation Schemas

### Login Schema
```typescript
{
  email: string (required, email format)
  password: string (required, min 6)
}
```

### Register Schema
```typescript
{
  name: string (2-100 chars)
  email: string (required, email format)
  password: string (min 6, uppercase, lowercase, number)
  confirmPassword: string (matches password)
  role: 'ADMIN' | 'TESTER' | 'DEVELOPER'
}
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Token Storage

Tokens are stored in `localStorage`:
- **Key**: `token`
- **Value**: JWT token from backend
- **Cleared on logout**: Yes
- **Cleared on error**: No (user must logout manually)

## Testing the Authentication

### Test Login
1. Navigate to `http://localhost:3000/login`
2. Enter valid credentials
3. Should redirect to `/dashboard`

### Test Registration
1. Navigate to `http://localhost:3000/register`
2. Fill in all fields
3. Should redirect to `/dashboard` on success

### Test Logout
1. While logged in, click logout in navbar
2. Should redirect to `/`
3. Accessing protected routes should redirect to login

### Test Protected Routes
1. Logout first
2. Try accessing `/dashboard`, `/projects`, `/bugs`
3. Should redirect to `/login`

## Troubleshooting

### "Login failed" with no details
- Check backend is running
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for network errors

### Password validation not working
- Check password meets all requirements (uppercase, lowercase, number, min 6)
- Real-time validation should show requirements in red/green

### Tokens not persisting
- Check localStorage is enabled in browser
- Verify token is returned from backend
- Check for console errors

### Infinite redirect loop
- Clear browser cache and cookies
- Check that `/` doesn't require authentication
- Verify AuthContext is properly initialized
