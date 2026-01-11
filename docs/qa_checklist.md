# QA Checklist - Manual Testing

This checklist should be completed before each release to ensure quality and prevent regressions.

---

## Authentication

### Login
- [ ] Navigate to `/app/login`
- [ ] Submit with empty fields → Validation prevents submission
- [ ] Submit with invalid email format → Backend 422 error shows readable message
- [ ] Submit with wrong password → "Invalid email or password" message
- [ ] Submit with correct credentials → Redirects to `/app/dashboard`
- [ ] Check token is saved in localStorage (`url_shortener_token`)

### Register
- [ ] Navigate to `/app/register`
- [ ] Submit with password mismatch → Frontend validation error
- [ ] Submit with short password (< 6 chars) → Frontend validation error
- [ ] Submit with already registered email → Backend error shows
- [ ] Submit with valid data → Creates account and redirects to `/app/login`

### Protected Routes
- [ ] Try accessing `/app/dashboard` without token → Redirects to `/app/login`
- [ ] Try accessing `/app/me` without token → Redirects to `/app/login`
- [ ] Access protected route with token → Works normally

---

## Dashboard

### URL Creation
- [ ] Navigate to `/app/dashboard` (logged in)
- [ ] Submit empty form → Client validation prevents submit
- [ ] Submit invalid URL → Backend 422 shows readable validation error (not "[object Object]")
- [ ] Submit valid URL → Success:
  - [ ] Result card shows with short_code, long_url, dates
  - [ ] Toast notification shows "Link copied to clipboard!" (not alert)
  - [ ] URL appears in history list

### Free Plan Limit
- [ ] Create 3 URLs successfully
- [ ] Try creating 4th URL → Shows banner: "Free plan limit: You can only create up to 3 URLs"
- [ ] Banner is yellow/warning color
- [ ] No stacktrace shown

### URL History
- [ ] Create URL → Appears in history
- [ ] Refresh page → History persists (localStorage)
- [ ] Click "Copy" button → Toast shows "Link copied!"
- [ ] Click "Open" button → Opens in new tab
- [ ] Click "Stats" button → Navigates to `/app/stats/:short_code`
- [ ] Click "Remove" button → Removes from history
- [ ] Close/reopen browser → History still exists

### Copy Functionality
- [ ] Copy link from result card → Toast (not alert)
- [ ] Copy link from history → Toast (not alert)
- [ ] If copy fails → Toast shows error (not alert)

---

## Stats Page

### Valid Short Code
- [ ] Navigate to `/app/stats/:short_code` (existing code)
- [ ] Page shows:
  - [ ] Short code (monospace, blue)
  - [ ] Long URL
  - [ ] Created date
  - [ ] Expiration date (if set)
  - [ ] Active status
  - [ ] Total clicks (large number)
  - [ ] Clicks by date (bar chart)

### Copy/Open Buttons
- [ ] Click "Copy Short URL" → Toast shows success (not alert)
- [ ] Click "Open Short URL" → Opens in new tab

### Error States
- [ ] Navigate to `/app/stats/nonexistent` → Shows "URL not found or inactive" (404)
- [ ] Navigate to expired URL stats → Shows "URL expired or limit reached" (410)
- [ ] Navigate to `/app/stats/../../../etc` → Shows "Invalid short code format" (422)
- [ ] All error states show:
  - [ ] Clear error message
  - [ ] "Back to Dashboard" button
  - [ ] "Retry" button
  - [ ] NO stacktrace

---

## Go Page (YouTube Promotion)

### Valid Short Code with Video
- [ ] Navigate to `/app/go/test123`
- [ ] Page shows:
  - [ ] YouTube embed (if config has videos)
  - [ ] Countdown timer (5→4→3→2→1→0)
  - [ ] Short code display
  - [ ] "Ir ahora" button
  - [ ] "Ver en YouTube" button (if video present)
- [ ] Countdown reaches 0 → Redirects to `/test123` (backend)
- [ ] YouTube video autoplays (muted)
- [ ] YouTube iframe loads correctly (CSP allows it)

### Action Buttons
- [ ] Click "Ir ahora" before countdown ends → Im mediate redirect to `/test123`
- [ ] Click "Ver en YouTube" → Opens YouTube in new tab

### Invalid Short Code
- [ ] Navigate to `/app/go/../../../etc/passwd`
- [ ] Shows error page: "Invalid short code"
- [ ] No countdown starts
- [ ] No auto-redirect happens
- [ ] "Back to Dashboard" link works

### Config Fallback
- [ ] Stop nginx or rename promotions.json
- [ ] Navigate to `/app/go/test123`
- [ ] Shows countdown (no video)
- [ ] Still redirects after countdown
- [ ] No error shown to user
- [ ] Check console: Warning logged (not error)

---

## Accessibility

### Keyboard Navigation
- [ ] Tab through login form → All inputs reachable
- [ ] Tab through registration form → All inputs reachable
- [ ] Tab through dashboard form → " Input reachable
- [ ] Press Enter on submit button → Form submits
- [ ] Focus visible on buttons (blue outline on Tab, not on click)

### Form Labels
- [ ] Inspect login email input → Has associated label (htmlFor="email")
- [ ] Inspect login password input → Has associated label
- [ ] Inspect register fields → All have labels
- [ ] Inspect dashboard longUrl input → Has label

### Contrast
- [ ] Error banners (red) → Text readable on background
- [ ] Success toasts (green) → Text readable
- [ ] Warning banners (yellow) → Text readable
- [ ] All colors meet WCAG AA minimum (4.5:1 contrast)

---

## Security

### Headers (curl tests)
```bash
# Test Content-Security-Policy
curl -I http://localhost/app/ | grep Content-Security-Policy
# Should include: frame-src https://www.youtube-nocookie.com

# Test X-Content-Type-Options
curl -I http://localhost/app/ | grep X-Content-Type-Options
# Should show: nosniff

# Test Referrer-Policy
curl -I http://localhost/app/ | grep Referrer-Policy
# Should show: strict-origin-when-cross-origin

# Test Permissions-Policy
curl -I http://localhost/app/ | grep Permissions-Policy
# Should show: camera=(), microphone=(), geolocation=()
```

### CSP Compliance
- [ ] Navigate to `/app/go/:short_code`
- [ ] YouTube embed loads (allowed by CSP)
- [ ] No CSP errors in browser console
- [ ] Frontend styles work (unsafe-inline allowed)
- [ ] All fetch requests work (connect-src 'self')

---

## Error Handling

### 422 Validation Errors
- [ ] Trigger 422 with array detail (e.g., invalid email format)
- [ ] Error message is readable string (not "[object Object]")
- [ ] First error from array is shown
- [ ] No technical JSON shown to user

### 503 Service Unavailable
- [ ] Stop backend: `docker compose stop backend`
- [ ] Try creating URL → Shows "Service experiencing high demand..."
- [ ] Banner is orange/warning
- [ ] No HTML error page shown
- [ ] No stacktrace shown

### Network Errors
- [ ] Disconnect internet
- [ ] Try any API call → Shows generic error message
- [ ] Reconnect → Feature works again

---

## UX Consistency

### Toast Notifications
- [ ] All copy actions show toast (not alert)
- [ ] Toast appears top-right
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Only one toast visible at a time
- [ ] Toast doesn't block critical UI elements

### Messages
- [ ] Copy success: "Link copied to clipboard!"
- [ ] Copy failure: "Failed to copy. Please copy manually."
- [ ] No technical error messages shown
- [ ] All user-facing text is friendly and clear

---

## Docker & Infrastructure

### Startup
```bash
docker compose up -d
```
- [ ] All 4 containers start (proxy, backend, frontend, db)
- [ ] No errors in logs
- [ ] Frontend accessible at http://localhost/app/
- [ ] Backend accessible at http://localhost/api/docs
- [ ] promotions.json accessible at http://localhost/app-config/promotions.json

### Promotions Config
```bash
# Edit promotions.json
nano app-config/promotions.json

# Wait 2 minutes or restart nginx
docker compose restart proxy

# Verify changes
curl http://localhost/app-config/promotions.json
```
- [ ] Config file is editable
- [ ] Changes apply after cache expiry (2 min)
- [ ] OR changes apply immediately after nginx restart
- [ ] No frontend rebuild needed

### Cache Verification (MANDATORY)

**Run all 3 curl commands**:

```bash
# 1. index.html - no caching
curl -I http://localhost/app/ | grep Cache-Control
# Expected: Cache-Control: no-store, max-age=0, must-revalidate

# 2. Hashed assets - long cache + immutable
# Replace XXXXX with actual hash from build output
curl -I http://localhost/app/assets/index-XXXXX.js | grep Cache-Control
# Expected: Cache-Control: public, max-age=31536000, immutable

# 3. promotions.json - short cache
curl -I http://localhost/app-config/promotions.json | grep Cache-Control
# Expected: Cache-Control: public, max-age=120
```

- [ ] index.html has no-store cache
- [ ] Hashed assets have immutable cache (1 year)
- [ ] promotions.json has short cache (120s)
- [ ] All cache headers present and correct

---

## Regression Tests

### No Regressions
- [ ] Login still works
- [ ] Registration still works
- [ ] Dashboard URL creation still works
- [ ] Stats page still works
- [ ] Go page still works
- [ ] `/{short_code}` backend redirect still works
- [ ] All navigation links work
- [ ] No console errors on any page

### Build
```bash
cd frontend
npm run build
```
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Bundle size reasonable (< 300KB JS)

---

## Final Checks

- [ ] No `alert()` in codebase (grep for it)
- [ ] All forms have proper labels
- [ ] All buttons are keyboard accessible
- [ ] Security headers present
- [ ] YouTube embed works with CSP
- [ ] 422 errors show readable messages
- [ ] Toast notifications work consistently
- [ ] docker compose up -d works
- [ ] No sensitive data in logs
- [ ] No stacktraces shown to users

---

## Sign-Off

**Tested by**: _______________  
**Date**: _______________  
**Version/Tag**: _______________  
**Result**: ☐ PASS ☐ FAIL  

**Issues Found** (if any):
- 
- 
-
