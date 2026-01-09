# Database vs Code Mismatch Analysis

**Generated**: 2026-01-09  
**Status**: CRITICAL MISMATCHES FOUND

## Summary

The application code expects columns in the `urls` table that **do not exist** in the actual PostgreSQL database. This causes runtime errors when attempting to create URLs, track clicks, or retrieve statistics.

---

## Detailed Mismatches

### Table: `urls`

| Column Name | Code Expects | DB Has | Impact | Affected Files |
|-------------|--------------|---------|---------|----------------|
| `user_email` | String, nullable, indexed | ❌ **MISSING** | **CRITICAL** - Cannot create URLs, cannot count user's URLs for free tier limit | `models.py:33`, `url_service.py:14,24` |
| `user_id` | Integer, ForeignKey | ❌ **MISSING** | Not currently used (was replaced with user_email) | N/A |
| `click_count` | Integer, default=0 | ❌ **MISSING** | **CRITICAL** - Cannot track clicks, redirect endpoint will fail | `models.py:34`, `url_service.py:25`, `redirect_service.py:14,15,34`, `stats_service.py:18` |
| `click_limit` | Integer, default=1000 | ❌ **MISSING** | **CRITICAL** - Cannot enforce click limits | `models.py:35`, `url_service.py:26`, `redirect_service.py:14,34` |

### Table: `users`

| Column Name | Code Expects | DB Has | Impact |
|-------------|--------------|---------|---------|
| All columns | Match | ✅ **MATCH** | No issues |

### Table: `clicks`

| Column Name | Code Expects | DB Has | Impact |
|-------------|--------------|---------|---------|
| All columns | Match | ✅ **MATCH** | No issues |

---

## Root Cause

The database was created with an **older/incomplete schema** that predates the current application code. The models in `models.py` define columns that were never added to the actual PostgreSQL tables.

The migration file `docs/migrations/0001_users_limits.sql` exists and includes `ALTER TABLE` statements to add these columns, but **it was never executed** on the database.

---

## Resolution Options

### Option A: Run Migration (RECOMMENDED)
Execute the migration SQL to add missing columns to the existing database.

**Pros**: 
- Preserves existing data
- Aligns DB with code expectations
- Minimal code changes

**Cons**:
- Requires database access
- Downtime during migration

### Option B: Revert Code to Match DB
Remove references to non-existent columns from the code.

**Pros**:
- No database changes needed
- Works immediately

**Cons**:
- Loses important functionality (user tracking, click limits)
- Does not meet MVP requirements
- Significant code refactoring needed

---

## Affected Endpoints

All endpoints that interact with URLs are affected:

- ✅ `GET /api/health` - **NOT AFFECTED**
- ✅ `POST /api/auth/register` - **NOT AFFECTED**
- ✅ `POST /api/auth/login-json` - **NOT AFFECTED**
- ❌ `POST /api/urls` - **FAILS** (tries to insert user_email, click_count, click_limit)
- ❌ `GET /{short_code}` - **FAILS** (tries to check click_count < click_limit)
- ❌ `GET /api/urls/{short_code}/stats` - **FAILS** (tries to read url.click_count)

---

## Critical User Journeys Broken

1. **Create a short URL**: 500 error when trying to insert into urls table
2. **Click a short URL**: 500 error when trying to update click_count
3. **View URL statistics**: 500 error when trying to read click_count
4. **Free tier enforcement**: Cannot count URLs per user without user_email column
