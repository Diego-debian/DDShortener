# Frontend Security

## Overview

This document describes security measures implemented in the frontend to protect users and data.

---

## Token Storage

### Implementation

**Storage**: `localStorage`  
**Key**: `url_shortener_token`  
**Content**: JWT access_token from backend

```typescript
// lib/auth.ts
export function setToken(token: string): void {
  localStorage.setItem('url_shortener_token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('url_shortener_token');
}
```

### Security Considerations

**Risks**:
- **XSS Attacks**: Malicious scripts can read localStorage
- **No HTTP-only**: Token accessible to JavaScript

**Mitigations**:
- **Content Security Policy**: Prevents external script injection
- **Same-Origin Only**: CORS not configured, token only sent to same origin
- **Auto-Logout on 401**: Invalid tokens cleared immediately

**Why localStorage** (vs httpOnly cookies):
- Simpler MVP implementation
- Same-origin architecture (no CORS needed)
- CSP provides XSS protection layer

**Future Improvement**: Consider httpOnly cookies for enhanced security

---

## Content Security Policy (CSP)

### Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  frame-src https://www.youtube-nocookie.com;
```

### Directive Breakdown

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Only load resources from same origin by default |
| `script-src` | `'self'` | Only execute JavaScript from our domain (prevents XSS) |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind CSS requires inline styles |
| `img-src` | `'self' data:` | Images from us + base64 data URIs |
| `font-src` | `'self'` | Fonts only from our domain |
| `connect-src` | `'self'` | Fetch/XHR only to same origin (/api, /app-config) |
| `frame-src` | `https://www.youtube-nocookie.com` | ONLY youtube-nocookie for Go page embeds |

### Exceptions & Why

**`'unsafe-inline'` for styles**:
- **Why**: Tailwind CSS generates inline styles in production build
- **Risk**: Moderate (style injection less dangerous than script injection)
- **Mitigation**: No user-generated styles, build-time only

**`youtube-nocookie.com` for frames**:
- **Why**: Go page feature requires YouTube embed
- **Risk**: Low (trusted Google domain, privacy-enhanced mode)
- **Mitigation**: Video IDs validated with strict regex before embed

---

## Security Headers

### Implemented Headers

```nginx
# nginx.conf
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "..." always;
```

### Header Descriptions

**X-Content-Type-Options: nosniff**:
- **Purpose**: Prevents MIME type sniffing attacks
- **Effect**: Browser respects declared Content-Type, won't guess
- **Protects**: Against executing .jpg as .js, etc.

**Referrer-Policy: strict-origin-when-cross-origin**:
- **Purpose**: Privacy-enhanced referrer handling
- **Effect**:
  - Same-origin: Send full URL as referrer
  - Cross-origin: Send origin only (no path/query)
- **Protects**: User privacy when navigating to external links

**Permissions-Policy: camera=(), microphone=(), geolocation=()**:
- **Purpose**: Disable unused browser features
- **Effect**: Camera, microphone, geolocation APIs always disabled
- **Protects**: Against permission prompt attacks

---

## Input Validation

### short_code Validation

**Pattern**: `/^[A-Za-z0-9_-]{1,64}$/`

**Validates**:
- ✅ Alphanumeric characters
- ✅ Underscore and hyphen
- ✅ 1-64 characters length

**Prevents**:
- ❌ Path traversal (`../`, `../../`)
- ❌ Special characters (`<`, `>`, `&`, etc.)
- ❌ Excessive length (DoS)

**Implementation**:
```typescript
// frontend/src/pages/Go.tsx
const SHORT_CODE_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

if (!SHORT_CODE_REGEX.test(short_code)) {
  // Show error, do NOT auto-redirect
  setIsValidShortCode(false);
  return;
}
```

**Security Benefit**: Invalid codes never reach backend, UI shows clear error

---

### videoId Validation

**Pattern**: `/^[A-Za-z0-9_-]{11}$/`

**Validates**:
- ✅ Exactly 11 characters (YouTube standard)
- ✅ Alphanumeric + underscore + hyphen only

**Prevents**:
- ❌ XSS via iframe src injection
- ❌ Loading arbitrary URLs

**Implementation**:
```typescript
const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
const validVideos = data.videos.filter(v => VIDEO_ID_REGEX.test(v.id));
```

**Security Benefit**: Only valid YouTube video IDs embedded, malicious strings ignored

---

## YouTube Embed Safety

### Privacy-Enhanced Domain

**Used**: `https://www.youtube-nocookie.com/embed/{videoId}`

**NOT used**: `https://www.youtube.com/embed/{videoId}`

**Benefits**:
- No tracking cookies set by default
- Better GDPR/privacy compliance
- Same functionality as regular embed

### Embed Parameters

```
?autoplay=1&mute=1&controls=1&rel=0
```

**Security considerations**:
- `autoplay=1` + `mute=1`: Required by browser policy (not a risk)
- `controls=1`: User can control playback (good UX)
- `rel=0`: Don't show unrelated videos from other channels

### CSP Protection

**CSP Restriction**: `frame-src https://www.youtube-nocookie.com`

**Effect**:
- ONLY youtube-nocookie.com can be embedded
- Attempts to embed other domains → Blocked by browser
- Even if videoId validation bypassed, CSP is final defense

---

## API Request Security

### Authentication

**Header**: `Authorization: Bearer {token}`

**Where sent**:
- ✅ Protected endpoints (dashboard URL creation, /api/me)
- ❌ Public endpoints (login, register, stats)

**Implementation** (`apiFetch.ts`):
```typescript
const token = getToken();
if (token && !skipAuth) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

### 401 Handling

**Automatic token clearing**:
```typescript
if (err.status === 401 && !skipAuth) {
  clearToken();
  navigate('/login');
}
```

**Security Benefit**: Expired/invalid tokens don't linger, user forced to re-authenticate

---

## Error Message Security

### Never Expose Sensitive Data

**Rules**:
1. Never show raw backend error objects
2. Never show stack traces to users
3. Never show database errors
4. Never show JWT contents

**Implementation** (`apiFetch.ts`):
```typescript
// Parse 422 validation errors (array) → readable string
if (Array.isArray(errorData.detail)) {
  message = errorData.detail[0]?.msg || 'Validation error';
} else if (typeof errorData.detail === 'string') {
  message = errorData.detail;
} else {
  message = 'An error occurred. Please try again.';  // Generic fallback
}
```

**Security Benefit**: Technical implementation details never leaked to users

---

## Caching Security

### No Caching of Sensitive Data

**index.html**: `Cache-Control: no-store`
- Always fresh from server
- Latest security patches/updates deployed immediately

**Assets**: `Cache-Control: public, max-age=31536000, immutable`
- Safe because hashed (content-addressed)
- No sensitive data in JS bundles

**promotions.json**: `Cache-Control: public, max-age=120`
- Public data only (YouTube video IDs)
- Short cache allows updates

**Security Benefit**: No credentials or sensitive data cached in browser

---

## Threat Model

### Threats Mitigated

| Threat | Mitigation |
|--------|------------|
| XSS (Cross-site scripting) | CSP blocks external scripts, Input validation |
| CSRF (Cross-site request forgery) | JWT in Authorization header (not cookie) |
| Clickjacking | (Could add X-Frame-Options if needed) |
| MIME sniffing attacks | X-Content-Type-Options: nosniff |
| Path traversal | Input validation (short_code regex) |
| Malicious iframe embeds | CSP frame-src whitelist |
| Token theft via XSS | CSP + input validation layers |

### Threats NOT Fully Mitigated (Known Risks)

| Threat | Status | Future Improvement |
|--------|--------|-------------------|
| XSS if CSP bypassed | Low risk | Consider httpOnly cookies |
| localStorage accessible to scripts | Acceptable for MVP | Migrate to httpOnly cookies |
| No HTTPS enforcement | Deployment-dependent | Enforce in production nginx |

---

## Best Practices Followed

✅ **Principle of Least Privilege**: Only necessary features enabled  
✅ **Defense in Depth**: Multiple security layers (validation + CSP + headers)  
✅ **Secure by Default**: Restrictive CSP, opt-in for features  
✅ **Fail Securely**: Invalid inputs → Error page, NOT auto-redirect  
✅ **Privacy-Enhanced**: youtube-nocookie.com, strict referrer policy  

---

## Security Checklist (Pre-Release)

- [ ] CSP headers present (`curl -I` verification)
- [ ] All security headers present (X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [ ] No `alert()` in codebase (use Toast instead)
- [ ] Input validation working (test with `/../` in short_code)
- [ ] 401 auto-logout working (try expired token)
- [ ] YouTube embed ONLY from youtube-nocookie.com
- [ ] No sensitive data in console logs
- [ ] No stack traces shown to users
- [ ] Token cleared on logout

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Contact the team privately
3. Provide details: steps to reproduce, impact, suggested fix
4. Allow reasonable time for patch before public disclosure

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [YouTube Player Parameters](https://developers.google.com/youtube/player_parameters)
