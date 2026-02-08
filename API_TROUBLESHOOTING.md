# API & Token Troubleshooting Guide

## Quick Diagnostic Checklist

### Step 1: Verify Backend is Running
```bash
# Test backend availability
curl http://localhost:5000/api/health

# Expected: Should return a response (not "Connection refused")
```

### Step 2: Check Environment Variables
```bash
# In .env.local, verify:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# The URL should match your backend
```

### Step 3: Verify Token After Login
```javascript
// In browser console after login:
console.log('User:', localStorage.getItem('user'));
console.log('Token:', localStorage.getItem('token'));

// Both should exist and have values
```

### Step 4: Check API Request Headers
1. Open DevTools (F12) → Network tab
2. Click any API request (e.g., GET /bugs)
3. Click "Headers" tab
4. Look for "Authorization" in Request Headers
5. Should show: `Authorization: Bearer eyJ...`

## Common Issues & Solutions

### Issue #1: 401 Unauthorized on Protected APIs

**Symptoms:**
- Login succeeds
- Token shows in localStorage
- Protected API calls return 401
- Network shows no Authorization header

**Root Causes & Fixes:**

#### A. Token Not Being Attached
```javascript
// Check if token exists
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

// If null, token wasn't stored during login
// Check LoginForm.tsx -> login() function is called correctly
```

**Fix:** Ensure LoginForm passes token to login:
```typescript
// ✅ Correct
login(response.data.user, response.data.token);

// ❌ Wrong (missing token)
login(response.data.user);
```

#### B. API Utility Not Reading Token
```javascript
// The API utility in lib/api.ts should read token:
const token = localStorage.getItem('token');
if (token) {
  defaultHeaders.Authorization = `Bearer ${token}`;
}
```

**Fix:** Verify lib/api.ts is using the correct token attachment code.

#### C. Backend Token Validation Issue
```bash
# Test with curl to debug backend
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5000/api/bugs

# If you still get 401, issue is in backend auth middleware
```

**Fix:** Check backend:
- JWT secret key matches
- Token validation logic is correct
- Middleware is properly implemented

### Issue #2: Token Not Persisting Across Page Refresh

**Symptoms:**
- Login works
- User logged in
- Refresh page → Logged out

**Causes & Fixes:**

#### A. Token Not Being Stored
```javascript
// Debug in LoginForm.tsx
const onSubmit = async (data) => {
  const response = await API.post('/auth/login', data);
  console.log('Response:', response); // Verify response contains token
  login(response.data.user, response.data.token);
};
```

**Fix:** Verify response from backend includes token field.

#### B. AuthContext Not Reading localStorage
```javascript
// In AuthProvider useEffect
useEffect(() => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  // Both should be read and set
  if (storedUser && storedToken) {
    setUser(JSON.parse(storedUser));
    setToken(storedToken);
  }
}, []);
```

**Fix:** Verify AuthContext initialization includes both user AND token.

### Issue #3: 401 Immediately After Login

**Symptoms:**
- Login succeeds
- Redirects to dashboard
- Dashboard shows 401 error

**Causes & Fixes:**

#### A. Token Format Issue
```bash
# Backend expects: "Bearer <token>"
# Network should show: Authorization: Bearer eyJ...

# Not: Authorization: <token> (missing Bearer)
# Not: Authorization: "Bearer eyJ..." (quoted)
```

**Fix:** Verify API utility uses correct format:
```typescript
defaultHeaders.Authorization = `Bearer ${token}`;
```

#### B. Token Already Expired
```javascript
// Backend issued token with very short expiry
// Check backend: token expiry should be reasonable (7-30 days)
```

**Fix:** Configure backend JWT expiry time.

#### C. Backend Time Mismatch
```bash
# If server time is different from system time
# Tokens might be considered expired
```

**Fix:** Ensure backend server time is synchronized.

### Issue #4: "No token provided" Error from Backend

**Symptoms:**
- Backend returns specific error: "No token provided"
- Even though localStorage shows token

**Causes & Fixes:**

#### A. Authorization Header Format Wrong
```javascript
// ❌ Wrong formats that won't work:
Authorization: 'Bearer token' // Quoted
Authorization: token          // Missing Bearer
Authorization: bearer token   // Lowercase bearer
Authorization: Token token    // Wrong prefix

// ✅ Correct format:
Authorization: Bearer eyJhbGc...
```

**Fix:** Verify exact format in API utility.

#### B. Custom Header Name
```javascript
// Some APIs use custom header names like:
X-Auth-Token: token
x-access-token: token
```

**Fix:** Check backend documentation for expected header name.

### Issue #5: 401 on Some APIs But Not Others

**Symptoms:**
- GET /bugs → 401
- POST /auth/login → 200
- Some endpoints work, others don't

**Causes & Fixes:**

#### A. Some Endpoints Don't Require Auth
```javascript
// Expected behavior:
// Public endpoints (login, register): No token needed
// Protected endpoints (bugs, projects): Token required
```

**Fix:** No fix needed, this is correct behavior.

#### B. Role-Based Access Control
```javascript
// 401 might indicate permission denied, not missing token
// Check backend error message for details
```

**Fix:** Verify user has correct role for endpoint.

## Debugging Workflow

### Step-by-Step Debugging

1. **Clear Everything**
   ```javascript
   localStorage.clear();
   // Then refresh page
   ```

2. **Login Again**
   - Navigate to /login
   - Check console for errors
   - Verify localStorage.getItem('token') has value

3. **Test Single API Call**
   ```javascript
   // In browser console
   const token = localStorage.getItem('token');
   fetch('http://localhost:5000/api/bugs', {
     headers: { Authorization: `Bearer ${token}` }
   }).then(r => r.json()).then(console.log);
   ```

4. **Check Network Tab**
   - F12 → Network tab
   - Make any API request
   - Check "Authorization" header exists
   - Copy exact value and test with curl

5. **Test with curl**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/bugs
   
   # If this works with curl but not in app, issue is in frontend
   # If this fails, issue is in backend
   ```

## Testing with Postman

1. **Set up Postman environment**
   ```json
   {
     "api_url": "http://localhost:5000/api",
     "token": ""
   }
   ```

2. **Login request**
   ```
   POST {{api_url}}/auth/login
   Body: {"email": "user@example.com", "password": "password"}
   ```

3. **Extract token**
   - Copy token from response
   - Set in Postman: token = (paste token)

4. **Test protected request**
   ```
   GET {{api_url}}/bugs
   Headers: Authorization: Bearer {{token}}
   ```

5. **Verify response**
   - Should return 200 with data
   - If 401, backend is rejecting token

## Backend Requirements

For frontend token management to work, backend must:

✅ **Return token on login:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "_id": "123", "email": "user@example.com", "name": "John", "role": "ADMIN" }
}
```

✅ **Accept Authorization header:**
```
Authorization: Bearer <token>
```

✅ **Validate token and return 401 if invalid:**
```json
{ "message": "Invalid token" }
```

✅ **Maintain consistent error messages:**
- "No token provided" - if Authorization header missing
- "Invalid token" - if token format wrong
- "Token expired" - if token outdated

## Performance Considerations

### Token Storage Method
- **Current:** localStorage (simple, XSS vulnerable)
- **More Secure:** httpOnly cookies (requires backend support)
- **Trade-off:** localStorage is easier to implement, cookies are more secure

### Request Overhead
- Token is read from localStorage on every API call
- Negligible performance impact for typical apps
- Consider implementing token cache if making 100+ requests/second

## Production Checklist

Before deploying to production:

- [ ] Change `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Ensure backend uses HTTPS
- [ ] Verify CORS headers allow frontend domain
- [ ] Test token expiry and refresh flow
- [ ] Implement token refresh endpoint (optional but recommended)
- [ ] Enable httpOnly cookies for token (recommended)
- [ ] Monitor 401 errors in production
- [ ] Have logout mechanism for stale tokens

## Support

If issues persist:

1. **Check browser console** for error messages
2. **Check browser DevTools Network tab** for request/response
3. **Check backend logs** for validation errors
4. **Verify backend is running** and accessible
5. **Test backend directly** with curl or Postman
6. **Review JWT_TOKEN_MANAGEMENT.md** for architecture details
