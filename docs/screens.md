# Frontend Screens Documentation

This document describes the user-facing screens in the frontend application, their purpose, and key interactions.

## Authentication Screens

### Login Page

**Route**: `/app/login`

**Purpose**: Authenticate existing users

**Features**:
- Email/password form
- Client-side validation (required fields, email format)
- Loading state during submission
- Error display for failed attempts
- Link to registration page

**API Integration**:
- **Endpoint**: `POST /api/auth/login-json`
- **On success**: Save token, navigate to `/app/dashboard`
- **On error**: Display error message (401, 422, 503)

**User Flow**:
1. User enters email and password
2. Clicks "Sign In"
3. If valid: Redirected to dashboard with token saved
4. If invalid: Error message displayed, form remains filled

---

### Register Page

**Route**: `/app/register`

**Purpose**: Create new user account

**Features**:
- Email/password/confirm password form
- Client-side validation:
  - Email format
  - Password minimum length (6 characters)
  - Password match confirmation
- Loading state during submission
- Error display for failed attempts
- Link to login page

**API Integration**:
- **Endpoint**: `POST /api/auth/register`
- **On success**: Navigate to `/app/login` with success message
- **On error**: Display error message (409 for duplicate, 422 validation)

**User Flow**:
1. User enters email, password, and confirms password
2. Client validates password match
3. Clicks "Create Account"
4. If successful: Redirected to login with "Account created" message
5. If duplicate email: Error message suggests logging in instead

---

## User Management Screens

### Profile Page (Me)

**Route**: `/app/me` (**Protected**)

**Purpose**: Display user account information

**Protection**: Requires authentication token

**Features**:
- User account details:
  - User ID
  - Email
  - Account status (Active/Inactive badge)
  - Plan (Free/Premium)
  - Member since date
- Logout button
- Usage statistics placeholder (URLs created, total clicks)

**API Integration**:
- **Endpoint**: `GET /api/me`
- **On load**: Fetch user data with token
- **On 401**: Clear token, redirect to login
- **On logout**: Clear token, redirect to login

**User Flow**:
1. User navigates to `/app/me`
2. If no token: Redirected to login immediately
3. If token exists: Fetch user data from API
4. Display user information
5. User can click "Logout" to clear session

---

## Dashboard Screens

### Dashboard

**Route**: `/app/dashboard` (**Protected**)

**Purpose**: Main user dashboard for creating and managing shortened URLs

**Protection**: Requires authentication token

**Features**:
- **URL Creation Form**:
  - Input: `long_url` (required, type URL)
  - Client-side validation (required field, URL format)
  - Loading state during submission
  - Error display for failed attempts

- **Result Card** (appears after successful creation):
  - Displays: `short_code`, `short_url`, `long_url`, `created_at`, `is_active`
  - "Copy Link" button (copies short URL to clipboard)
  - "Open Link" button (opens in new tab)
  - Success styling (green border/background)

- **Local History List**:
  - Recent URLs created (stored in localStorage)
  - Shows up to 50 most recent URLs
  - Each item displays:
    - Short code (monospace font)
    - Original long URL (truncated)
    - Created date
  - Actions per item:
    - **Copy**: Copy short URL to clipboard
    - **Open**: Open short URL in new tab
    - **Stats**: Navigate to `/app/stats/:short_code`
    - **Remove**: Remove from local history only

**API Integration**:
- **Endpoint**: `POST /api/urls`
- **On success (201)**: Display result card, add to history, clear form
- **On error**:
  - `401`: Clear token, redirect to login
  - `403`: Show free plan limit banner with exact detail
  - `422`: Show validation error under input field
  - `503`: Show "high demand" banner

**User Flow**:
1. User enters long URL
2. Clicks "Create Short URL"
3. If successful: Result card shown, URL added to history
4. If error: Error message displayed (specific to error type)
5. User can copy/open/view stats for created URLs
6. Click "Stats" → Navigate to `/app/stats/:short_code`

**Error States**:
- **403 Free Plan Limit**: Yellow banner with exact backend detail
- **422 Validation**: Red border on input + error text below
- **503 Service Down**: Orange banner with generic message

**Local Storage**:
- Key: `url_shortener_history`
- Stores: Array of `{ short_code, long_url, short_url, created_at }`
- Limit: 50 items (FIFO)

---

## Public Screens

### About Page

**Route**: `/app/about` (Public)

**Purpose**: Information about the URL shortener service

**Features**:
- Project description
- Features list:
  - Create short URLs with custom codes
  - Track click statistics
  - User authentication and management
  - Rate limiting and security
- Serves as landing/home page

---

### Redirect Preview

**Route**: `/app/go/:short_code` (Public)

**Purpose**: Preview short code before redirection (future feature)

**Features** (Current - Placeholder):
- Display short code
- Description of redirect preview concept
- Link to view statistics
- Link back to dashboard

**Future Features**:
- Show target URL before redirecting
- Countdown timer before redirect
- Safety warning if flagged URL
- QR code generation

---

### URL Statistics

**Route**: `/app/stats/:short_code` (Public)

**Purpose**: View detailed click statistics for a shortened URL

**Features**:
- **Short Code Info Card**:
  - Large display of short code (blue, monospace)
  - Target long URL (readable format)

- **Total Clicks Card**:
  - Large number display (5xl font)
  - Gradient background (blue)
  - All-time clicks count

- **Clicks by Date**:
  - List of dates with click counts
  - Visual bar chart (relative to max)
  - Sorted chronologically
  - Shows individual date + count

- **Quick Actions**:
  - "Copy Short URL" button
  - "Open Short URL" button (new tab)
  - "Back to Dashboard" link

**API Integration**:
- **Endpoint**: `GET /api/urls/:short_code/stats`
- **Response**: `{ short_code, long_url, total_clicks, by_date: {date: count} }`
- **On error**:
  - `404`: Display "Not Found" state
  - `410`: Display "Expired" state
  - `422`: Display "Invalid Code" state
  - `503`: Display "High demand" message

**Error States**:
- **404 Not Found**:
  - Red banner with ❌ icon
  - Message: "URL not found or inactive"
  - Shows "Back to Dashboard" and "Retry" buttons

- **410 Gone**:
  - Red banner with ⏰ icon
  - Message: "URL expired or limit reached"
  - Indicates URL no longer accessible

- **422 Invalid**:
  - Red banner with ⚠️ icon
  - Message: "Invalid short code format"

**User Flow**:
1. User navigates to `/app/stats/:short_code` (from dashboard or direct link)
2. Stats loaded from backend
3. If found: Display total clicks + date breakdown
4. If error: Show clear error state with recovery options
5. User can copy/open short URL directly from stats page

---

## Route Protection Summary

### Public Routes (No Authentication Required)
- `/app/about` - About page
- `/app/login` - Login form
- `/app/register` - Registration form
- `/app/go/:short_code` - Redirect preview
- `/app/stats/:short_code` - URL statistics

### Protected Routes (Authentication Required)
- `/app/dashboard` - User dashboard
- `/app/me` - User profile

**Protection Mechanism**:
- `RequireAuth` component wraps protected routes
- Checks for token in localStorage on mount
- Redirects to `/app/login` if no token

---

## Navigation Flow

```
Landing (/app/about)
  ├─→ Login (/app/login)
  │     ├─→ Success → Dashboard (/app/dashboard)
  │     └─→ Register link → Register (/app/register)
  │
  ├─→ Register (/app/register)
  │     ├─→ Success → Login (/app/login)
  │     └─→ Login link → Login (/app/login)
  │
  └─→ Dashboard (/app/dashboard) [Protected]
        ├─→ No token → Redirect to Login
        └─→ Profile link → Me (/app/me) [Protected]
              ├─→ No token → Redirect to Login
              └─→ Logout → Clear token → Login
```

---

## Error States

### Authentication Required

When user tries to access protected route without token:
- **Redirect**: Immediate navigation to `/app/login`
- **No error message**: Silent redirect
- **Preservation**: Could preserve intended destination for post-login redirect (future)

### API Errors

Each screen handles API errors gracefully:
- **401**: Session expired → Clear token → Redirect to login
- **422**: Validation error → Display field-specific message
- **503**: Service down → Display generic unavailable message
- **Network**: Connection lost → Display network error

### Loading States

All forms show loading state during API calls:
- Submit button shows "Loading..." text
- Submit button disabled to prevent double-submission
- Form inputs disabled during submission

---

## Responsive Design

All screens are mobile-first responsive:
- **Mobile** (< 640px): Single column, full-width forms
- **Tablet** (640px - 1024px): Centered content, max-width containers
- **Desktop** (> 1024px): Optimized layouts with sidebars (dashboard)

---

## Future Screen Enhancements

### Planned Additions

1. **Password Reset**: `/app/forgot-password`, `/app/reset-password/:token`
2. **Email Verification**: `/app/verify-email/:token`
3. **Settings**: `/app/settings` - Update profile, change password
4. **URL Manager**: Enhanced dashboard with CRUD for URLs
5. **Analytics Dashboard**: Detailed statistics with charts

### Planned Improvements

- **Toast notifications**: Non-blocking error/success messages
- **Loading skeletons**: Better loading state UX
- **Empty states**: Helpful messages when no data
- **Pagination**: For URL lists
- **Filtering/Search**: In dashboard URL list
