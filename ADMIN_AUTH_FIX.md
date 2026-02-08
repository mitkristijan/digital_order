# Admin App Authentication Fix

## Problem

The Admin App was showing a `404 (Not Found)` error when accessing `/login` because:

1. The API client was configured to redirect unauthorized users to `/login` (see `apps/admin-app/src/lib/apiClient.ts:29`)
2. No `/login` route existed in the Admin App
3. Users couldn't authenticate to access protected routes

## Solution

Added complete authentication functionality to the Admin App with the following changes:

### 1. Created Login Page
**File**: `apps/admin-app/src/app/login/page.tsx`

- Professional login form with email and password fields
- Error handling for failed login attempts
- Loading states during authentication
- Demo credentials displayed for easy testing
- Integrates with the backend API at `POST /api/auth/login`
- Stores access token in localStorage
- Redirects to dashboard after successful login

### 2. Created Auth Guard Component
**File**: `apps/admin-app/src/components/AuthGuard.tsx`

- Client-side authentication check
- Redirects unauthenticated users to `/login`
- Shows loading spinner while checking authentication
- Wraps protected pages to ensure only authenticated users can access them

### 3. Updated Layout with Logout
**File**: `apps/admin-app/src/app/layout.tsx`

- Converted to client component to handle logout functionality
- Added Logout button in navigation bar
- Hides navigation on login page
- Clears access token and redirects to login on logout

### 4. Protected All Pages
Updated the following pages to use `AuthGuard`:

- `apps/admin-app/src/app/dashboard/page.tsx` - Order dashboard
- `apps/admin-app/src/app/menu/page.tsx` - Menu management
- `apps/admin-app/src/app/analytics/page.tsx` - Analytics dashboard

### 5. Added Middleware (Optional)
**File**: `apps/admin-app/src/middleware.ts`

- Basic route protection setup
- Allows access to public routes (e.g., `/login`)
- Ready for future server-side authentication checks

## How It Works

### Authentication Flow

1. User visits the Admin App (e.g., `http://localhost:3002`)
2. If not authenticated, `AuthGuard` redirects to `/login`
3. User enters credentials and submits form
4. Login page calls `POST http://localhost:3000/api/auth/login`
5. Backend validates credentials and returns access token
6. Token is stored in localStorage
7. User is redirected to `/dashboard`
8. Subsequent API calls include token via axios interceptor
9. If token expires (401 error), user is redirected back to `/login`

### Demo Credentials

The login page displays these demo credentials:

```
Super Admin (has access to demo tenant):
  Email: admin@digitalorder.com
  Password: Admin@123
```

Note: The super admin user has admin access to the "Demo Restaurant" tenant through TenantAccess.

## Files Modified

1. ✅ `apps/admin-app/src/app/login/page.tsx` (created)
2. ✅ `apps/admin-app/src/components/AuthGuard.tsx` (created)
3. ✅ `apps/admin-app/src/middleware.ts` (created)
4. ✅ `apps/admin-app/src/app/layout.tsx` (updated - added logout)
5. ✅ `apps/admin-app/src/app/dashboard/page.tsx` (updated - added AuthGuard)
6. ✅ `apps/admin-app/src/app/menu/page.tsx` (updated - added AuthGuard)
7. ✅ `apps/admin-app/src/app/analytics/page.tsx` (updated - added AuthGuard)

## Testing

### Manual Testing Steps

1. **Start the API server** (if not running):
   ```bash
   cd apps/api
   npx ts-node --files src/main.ts
   ```

2. **Start the Admin App** (if not running):
   ```bash
   npm run dev --workspace=@digital-order/admin-app
   ```

3. **Test Authentication Flow**:
   - Visit `http://localhost:3002`
   - Should redirect to `http://localhost:3002/login`
   - Enter credentials: `admin@digitalorder.com` / `Admin@123`
   - Click "Sign in"
   - Should redirect to dashboard with orders displayed
   - Click "Logout" in nav bar
   - Should redirect back to login page

4. **Test Protected Routes**:
   - Without logging in, try visiting:
     - `http://localhost:3002/dashboard` → redirects to login
     - `http://localhost:3002/menu` → redirects to login
     - `http://localhost:3002/analytics` → redirects to login

## API Endpoints Reference

The Admin App connects to these backend endpoints:

- `POST http://localhost:3000/api/auth/login` - Login with email/password
- `POST http://localhost:3000/api/auth/logout` - Logout (requires auth)
- `GET http://localhost:3000/api/auth/me` - Get current user profile
- `POST http://localhost:3000/api/auth/refresh` - Refresh access token

All other API calls are automatically authenticated via the axios interceptor that adds the Bearer token from localStorage.

## Future Improvements

1. **Add Remember Me functionality** - Option to persist session longer
2. **Implement Refresh Token logic** - Auto-refresh expired tokens
3. **Add Password Reset** - Link to password reset flow
4. **Add OTP Login** - Support phone number login with OTP
5. **Show User Info** - Display logged-in user's name/email in navbar
6. **Role-based Access** - Restrict certain routes based on user role
7. **Session Timeout Warning** - Notify user before session expires
8. **Secure Cookies** - Store refresh token in httpOnly cookies (already implemented on backend)

## Notes

- The access token is stored in localStorage (client-side)
- The backend sets refresh token in httpOnly cookies for security
- The axios interceptor automatically adds Authorization header to all requests
- On 401 errors, the interceptor redirects to login page
- All sensitive routes are protected with `AuthGuard` component

---

**Status**: ✅ Fixed and tested  
**Date**: February 8, 2026
