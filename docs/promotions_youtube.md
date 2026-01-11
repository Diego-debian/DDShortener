# YouTube Promotions System

## Overview

The URL shortener supports showing promotional YouTube videos before redirecting users to their destination URL. This is configured via a static JSON file that can be edited without redeploying the frontend.

## Configuration File

**Location**: `app-config/promotions.json`

**Served at**: `http://localhost/app-config/promotions.json`

**Cache**: 2 minutes (120 seconds)

### Schema

```json
{
  "hold_seconds": 5,
  "mode": "stable",
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "weight": 1
    },
    {
      "id": "jNQXAC9IVRw",
      "weight": 1
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hold_seconds` | number | Yes | Countdown duration in seconds (minimum 0, recommended 3-10) |
| `mode` | string | No | Selection mode: "stable" (default) or "random" |
| `videos` | array | Yes | List of YouTube videos to show (can be empty) |
| `videos[].id` | string | Yes | YouTube video ID (exactly 11 characters) |
| `videos[].weight` | number | Yes | Weight for video selection (currently all videos have equal chance) |

---

## Validation

### Video ID Validation

**Pattern**: `/^[A-Za-z0-9_-]{11}$/`

**Requirements**:
- Exactly 11 characters
- Alphanumeric characters, underscore, and hyphen only
- Case-sensitive

**Examples**:
- ✅ `dQw4w9WgXcQ` (valid)
- ✅ `jNQXAC9IVRw` (valid)
- ❌ `invalid_id` (too short)
- ❌ `../../../etc/passwd` (invalid characters)

**Security**: Invalid video IDs are silently ignored. The page will show countdown without video.

### Short Code Validation

**Pattern**: `/^[A-Za-z0-9_-]{1,64}$/`

**Requirements**:
- 1 to 64 characters
- Alphanumeric characters, underscore, and hyphen only
- Case-sensitive

**Examples**:
- ✅ `test123` (valid)
- ✅ `my-short-url_v2` (valid)
- ❌ `../../etc/passwd` (invalid characters)
- ❌ `a`.repeat(65) (too long)

**Security**: Invalid short codes show an error page and do NOT auto-redirect.

---

## Getting YouTube Video IDs

### From YouTube URL

**Standard video URL**:
```
https://youtube.com/watch?v=dQw4w9WgXcQ
                              ^^^^^^^^^^^
                              Video ID
```

**Short URL**:
```
https://youtu.be/dQw4w9WgXcQ
                 ^^^^^^^^^^^
                 Video ID
```

**Shorts URL**:
```
https://youtube.com/shorts/dQw4w9WgXcQ
                            ^^^^^^^^^^^
                            Video ID
```

### Best Practices

- **Use public videos**: Private or unlisted videos may not embed
- **Check embed permissions**: Some videos disable embedding
- **Test first**: Verify video ID works before adding to config
- **Short videos**: For better UX, use videos under 60 seconds

---

## Video Selection Algorithm

**Stable Selection (Default)**: The same `short_code` always shows the same video.
- **Config**: `"mode": "stable"` (or omit mode)
- **Algorithm**: `hash(short_code) % videos.length`
- **Rationale**: Consistent user experience.

**Random Selection**: Videos are selected randomly weighted by their `weight` property.
- **Config**: `"mode": "random"`
- **Algorithm**: Weighted random selection.
  - Video with `weight: 2` appears twice as often as `weight: 1`.
  - Selection is recalculated on every page load (refreshing changes video).
- **Rationale**: Variety, A/B testing, or simply showing different content.

---

## Editing the Configuration

### 1. Locate the File

```bash
cd /path/to/url_shortener_project/repo
ls app-config/promotions.json
```

### 2. Edit the File

```bash
# Using nano
nano app-config/promotions.json

# Using vim
vim app-config/promotions.json

# Using VS Code
code app-config/promotions.json
```

### 3. Update Values

**Change countdown duration**:
```json
{
  "hold_seconds": 3,  // Changed from 5 to 3 seconds
  "videos": [...]
}
```

**Add a new video**:
```json
{
  "hold_seconds": 5,
  "videos": [
    { "id": "dQw4w9WgXcQ", "weight": 1 },
    { "id": "jNQXAC9IVRw", "weight": 1 },
    { "id": "9bZkp7q19f0", "weight": 1 }  // NEW
  ]
}
```

**Remove all videos** (countdown only):
```json
{
  "hold_seconds": 5,
  "videos": []  // No videos, just countdown
}
```

### 4. Verify JSON Syntax

```bash
# Check JSON is valid
cat app-config/promotions.json | python -m json.tool
```

### 5. Wait for Cache Expiry

**Cache duration**: 2 minutes

**Options**:
- **Wait**: Changes visible within ~2 minutes
- **Force nginx reload**: `docker compose restart proxy` (instant, but briefly interrupts service)

### 6. Verify Changes

```bash
# Fetch current config
curl http://localhost/app-config/promotions.json

# Check cache headers
curl -I http://localhost/app-config/promotions.json | grep Cache-Control
```

---

## User Flow

1. User clicks short URL link (e.g., from email, SMS)
2. Link directs to `/app/go/:short_code`
3. Frontend validates `short_code`
4. Frontend fetches `/app-config/promotions.json`
5. Frontend selects video (if available) based on `short_code` hash
6. Frontend displays:
   - YouTube embed (if video available and valid)
   - Countdown timer
   - "Ir ahora" button (skip to destination)
   - "Ver en YouTube" button (open video on YouTube)
7. After countdown reaches 0: `window.location.href = "/{short_code}"`
8. Backend handles `/{short_code}` redirect (302/404/410)

---

## Fallback Behavior

### Config Fetch Fails

**Scenarios**:
- File not found
- Network error
- Invalid JSON

**Behavior**:
- Log warning to console
- Use fallback: `hold_seconds = 5`, `videos = []`
- Show countdown only (no video)
- Still redirect after countdown

**User Experience**: Graceful degradation, core functionality intact.

### Invalid Video ID

**Scenarios**:
- Video ID doesn't match `/^[A-Za-z0-9_-]{11}$/`
- Malformed data in config

**Behavior**:
- Filter out invalid videos silently
- Use remaining valid videos
- If all invalid: Show countdown only

**User Experience**: No error shown, seamless fallback.

### Invalid Short Code

**Scenarios**:
- Short code contains special characters
- Short code > 64 characters
- Path traversal attempt

**Behavior**:
- Show error page
- Do NOT start countdown
- Do NOT auto-redirect

**User Experience**: Clear error message, prevent abuse.

---

## Troubleshooting

### Video Not Showing

**Check**:
1. Is video ID exactly 11 characters?
2. Is video public and embeddable?
3. Is `/app-config/promotions.json` accessible? `curl http://localhost/app-config/promotions.json`
4. Is JSON valid? `cat app-config/promotions.json | python -m json.tool`

**Solution**: Verify video ID, check embed permissions, validate JSON.

### Changes Not Appearing

**Check**:
1. Has 2 minutes passed since edit?
2. Is browser caching? Hard refresh (Ctrl+Shift+R)

**Solution**: Wait for cache expiry or restart nginx: `docker compose restart proxy`

### Page Shows Error

**Check**:
1. Is short code valid? Only `[A-Za-z0-9_-]{1,64}`
2. Check browser console for errors

**Solution**: Use valid short code, check frontend logs.

### Countdown Doesn't Redirect

**Check**:
1. Is countdown reaching 0?
2. Check browser console for JavaScript errors
3. Is backend running? `docker compose ps`

**Solution**: Verify backend is healthy, check logs.

---

## Security Considerations

### Input Validation

✅ **Short code regex**: Prevents path traversal, injection  
✅ **Video ID regex**: Prevents XSS via iframe src  
✅ **YouTube domain**: Only `youtube-nocookie.com` URLs used

### Privacy

✅ **YouTube-nocookie.com**: Privacy-enhanced embed mode  
✅ **No cookies**: Video embed doesn't set tracking cookies by default

### Rate Limiting

The `/app-config/` route is NOT rate-limited (it's a static file).

---

## Future Enhancements

- **A/B testing**: Track which videos perform better
- **Time-based rules**: Show different videos at different times
- **Geo-targeting**: Show videos based on user location
- **Analytics**: Track video views and skip rates
