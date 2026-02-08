# JWT Token Management & API Authorization

## Overview

This document explains how JWT token authentication and authorization are implemented in the Bug Tracker frontend.

## Architecture

### Token Flow

1. **User Login/Registration**
   - User submits credentials → Backend validates → Returns JWT token + user data
   - Frontend stores token in localStorage
   - Token is passed to AuthContext

2. **Protected API Requests**
   - API utility reads token from localStorage
   - Attaches `Authorization: Bearer <token>` header to all requests
   - Sends request to backend

3. **Token Expiration**
   - Backend returns 401 Unauthorized if token is expired/invalid
   - API utility clears localStorage and redirects to /login?expired=true
   - User must login again

## Implementation Details

### 1. AuthContext (`context/AuthContext.tsx`)

Manages user and token state globally:

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  login: (user: User, token: string) => void;
}
```

**Key Methods:**
- `login(user, token)` - Stores user + token in state and localStorage
- `logout()` - Clears user, token, and localStorage

**State Persistence:**
- On app load, reads user + token from localStorage
- Only marks as authenticated if BOTH user AND token exist
- Clears both on logout or 401 error

### 2. API Utility (`lib/api.ts`)

Handles all API requests with automatic token attachment:

```typescript
// Token is automatically read and attached
const token = localStorage.getItem('token');
if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

**Features:**
- ✅ Automatic token attachment to all requests
- ✅ 401 error handling → Auto-logout + redirect
- ✅ Detailed error logging
- ✅ Graceful error handling with user-friendly messages

### 3. useAuth Hook (`hooks/useAuth.ts`)

Provides easy access to auth state in components:

```typescript
const { user, token, isAuthenticated, login, logout } = useAuth();
```

### 4. Login/Register Forms

Both forms call the login function with token:

```typescript
const response = await API.post('/auth/login', { email, password });
login(response.data.user, response.data.token);
```

## Token Storage

### localStorage Keys

- **`user`** - JSON stringified user object
  ```json
  {
    "_id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN"
  }
  ```

- **`token`** - JWT token string (e.g., "eyJhbGc...")

### Persistence Strategy

1. **On Login:**
   - AuthContext stores user + token in state
   - localStorage.setItem('user', JSON.stringify(user))
   - localStorage.setItem('token', token)

2. **On Page Refresh:**
   - AuthProvider reads both from localStorage
   - Restores user + token in state
   - User remains logged in

3. **On Logout:**
   - AuthContext clears both state and localStorage
   - Navbar removed
   - User redirected to home page

4. **On 401 Error:**
   - API utility clears both from localStorage
   - Redirects to /login?expired=true
   - Shows "Session expired" message

## API Request Examples

### With Token (Protected Endpoint)

```bash
GET http://localhost:5000/api/bugs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Response Codes

- **200 OK** - Success, token is valid
- **401 Unauthorized** - Token expired, invalid, or missing → Auto-logout
- **403 Forbidden** - User lacks permission
- **500 Server Error** - Backend error

## Common Issues & Solutions

### Issue: 401 Unauthorized Despite Login

**Symptoms:**
- Login works, user data stored
- Protected API calls return 401
- Network tab shows no Authorization header

**Solutions:**

1. **Check token is being stored:**
   ```javascript
   // In browser console
   localStorage.getItem('token') // Should show JWT token
   localStorage.getItem('user')  // Should show user object
   ```

2. **Verify API endpoint:**
   ```javascript
   // In .env.local
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Check backend auth middleware:**
   - Backend should validate token format
   - Should return meaningful 401 messages
   - Should include "Bearer" in Authorization header

### Issue: Session Expires Too Quickly

**Cause:** Backend JWT expiry time is too short

**Solution:** Configure backend token expiry (typically 7-30 days)

### Issue: Token Not Sent in Headers

**Debug Steps:**
1. Open browser DevTools → Network tab
2. Click any API request
3. Check "Authorization" header in Request Headers
4. If missing:
   - localStorage.getItem('token') might be null
   - Check AuthContext initialization
   - Verify localStorage isn't disabled

## Security Best Practices

✅ **Implemented:**
- Token stored in localStorage (accessible to JavaScript)
- Auto-attached to all requests via API utility
- Automatic 401 handling with logout
- Token cleared on logout

⚠️ **Additional Considerations:**
- Consider httpOnly cookies for added security (backend setting)
- Implement token refresh/rotation (backend feature)
- Add CSRF protection (backend feature)
- Use HTTPS in production (infrastructure requirement)

## Testing Token Flow

### Manual Testing

1. **Login Test:**
   - Navigate to /login
   - Enter valid credentials
   - Check localStorage in DevTools
   - Verify both 'user' and 'token' exist

2. **Protected API Test:**
   - Open DevTools → Network tab
   - Click on any API request
   - Check Request Headers for Authorization
   - Should show: `Authorization: Bearer <token>`

3. **Expiry Test:**
   - Manually delete 'token' from localStorage
   - Try to access /dashboard
   - Should redirect to /login
   - Or manually call an API
   - Should get 401 and auto-redirect

### API Testing with Postman

```bash
1. Send Login Request:
   POST http://localhost:5000/api/auth/login
   Body: {"email": "user@example.com", "password": "password"}
   
2. Copy token from response

3. Send Protected Request:
   GET http://localhost:5000/api/bugs
   Headers: Authorization: Bearer <token>
   
4. Should return 200 OK with data
```

## Frontend Configuration

### Required Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### No Additional Configuration Needed

Token handling is completely built into:
- AuthContext (automatic initialization)
- API utility (automatic attachment)
- ProtectedRoute (automatic validation)

## Debugging Tips

### Enable Console Logging

The API utility logs all requests:
```javascript
// Check browser console for API activity
[API] GET /bugs failed: (error message)
[API] POST /auth/login success
```

### Common Error Messages

- **"Session expired. Please login again."** → 401 received, auto-logout triggered
- **"No token provided"** → Token is null/undefined, user not logged in
- **"Invalid token"** → Backend rejected token format
- **"API Error: 500 Internal Server Error"** → Backend issue, check server logs

## Summary

The token management system ensures:

1. ✅ Token is stored after successful login
2. ✅ Token is automatically attached to all API requests
3. ✅ 401 responses trigger automatic logout + redirect
4. ✅ Token persists across page refreshes
5. ✅ Token is cleared on logout

All of this works transparently without requiring manual token management in individual components.
