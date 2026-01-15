-- DB Maintenance Script for DD Shortener
-- Usage: docker compose exec -T db psql -U shortener_user -d shortener < scripts/db_maintenance.sql
-- 
-- This script provides READ-ONLY queries for analysis.
-- For deletion, use the interactive PowerShell script: scripts/db_maintenance.ps1

-- ============================================================
-- SECTION 1: Database Overview
-- ============================================================

\echo '=== Database Size ==='
SELECT pg_size_pretty(pg_database_size('shortener')) as total_size;

\echo ''
\echo '=== Table Sizes ==='
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================
-- SECTION 2: Record Counts
-- ============================================================

\echo ''
\echo '=== Record Counts ==='
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM urls) as total_urls,
    (SELECT COUNT(*) FROM clicks) as total_clicks;

-- ============================================================
-- SECTION 3: Click Data Analysis
-- ============================================================

\echo ''
\echo '=== Clicks by Age (days since event) ==='
SELECT 
    CASE 
        WHEN event_time >= NOW() - INTERVAL '7 days' THEN '0-7 days'
        WHEN event_time >= NOW() - INTERVAL '30 days' THEN '8-30 days'
        WHEN event_time >= NOW() - INTERVAL '90 days' THEN '31-90 days'
        WHEN event_time >= NOW() - INTERVAL '180 days' THEN '91-180 days'
        ELSE '180+ days'
    END as age_range,
    COUNT(*) as click_count,
    pg_size_pretty(SUM(pg_column_size(clicks.*))::bigint) as estimated_size
FROM clicks
GROUP BY 1
ORDER BY MIN(event_time) DESC;

\echo ''
\echo '=== Clicks by Month ==='
SELECT 
    DATE_TRUNC('month', event_time)::date as month,
    COUNT(*) as clicks
FROM clicks
GROUP BY 1
ORDER BY 1 DESC
LIMIT 12;

-- ============================================================
-- SECTION 4: Candidate Data for Cleanup
-- ============================================================

\echo ''
\echo '=== Clicks older than 30 days (candidate for cleanup) ==='
SELECT COUNT(*) as clicks_older_than_30_days
FROM clicks 
WHERE event_time < NOW() - INTERVAL '30 days';

\echo ''
\echo '=== Clicks older than 90 days (candidate for cleanup) ==='
SELECT COUNT(*) as clicks_older_than_90_days
FROM clicks 
WHERE event_time < NOW() - INTERVAL '90 days';

-- ============================================================
-- SECTION 5: DRY RUN DELETE Queries
-- ============================================================
-- 
-- To actually delete, copy and run manually:
-- 
-- DELETE 30-day-old clicks:
--   DELETE FROM clicks WHERE event_time < NOW() - INTERVAL '30 days';
--
-- DELETE 90-day-old clicks:
--   DELETE FROM clicks WHERE event_time < NOW() - INTERVAL '90 days';
--
-- After deletion, run:
--   VACUUM ANALYZE clicks;
--
-- ============================================================

\echo ''
\echo '=== Maintenance Complete ==='
\echo 'For deletion, use scripts/db_maintenance.ps1 or run DELETE manually.'
