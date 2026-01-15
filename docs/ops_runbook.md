# Operations Runbook

This document provides operational commands and procedures for running DD Shortener on a resource-constrained VM (4GB RAM).

## Quick Reference

```bash
# Project directory
cd /path/to/url_shortener_project/repo

# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps
```

## Health Checks

### 1. Service Status

```bash
# Check all containers are running
docker compose ps

# Expected: All containers "Up" and healthy
#   shortener_proxy     running
#   shortener_backend   running
#   shortener_frontend  running
#   shortener_db        running (healthy)
```

### 2. API Health

```bash
# Via proxy (port 80)
curl http://localhost/api/health
# Expected: {"status":"ok"}

# Direct to backend (port 8010)
curl http://localhost:8010/api/health
# Expected: {"status":"ok"}
```

### 3. Database Health

```bash
# Check database is accepting connections
docker compose exec db pg_isready -U shortener_user -d shortener
# Expected: /var/run/postgresql:5432 - accepting connections

# Quick table count
docker compose exec -T db psql -U shortener_user -d shortener -c "
  SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM urls) as urls,
    (SELECT COUNT(*) FROM clicks) as clicks;
"
```

### 4. Disk Usage

```bash
# Docker disk usage
docker system df

# Log file sizes (on host)
du -sh /var/lib/docker/containers/*/

# PostgreSQL data size
docker compose exec -T db psql -U shortener_user -d shortener -c "
  SELECT pg_size_pretty(pg_database_size('shortener')) as db_size;
"
```

## Backups

### PostgreSQL Backup

```bash
# Create backup directory
mkdir -p backups

# Full database dump (recommended before maintenance)
docker compose exec -T db pg_dump -U shortener_user -d shortener > backups/shortener_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup (for transfer)
docker compose exec -T db pg_dump -U shortener_user -d shortener | gzip > backups/shortener_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup is not empty
ls -lh backups/
```

### PowerShell (Windows)

```powershell
# Create backup directory
New-Item -ItemType Directory -Force -Path backups

# Full database dump
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
docker compose exec -T db pg_dump -U shortener_user -d shortener > "backups\shortener_$timestamp.sql"

# Verify backup
Get-ChildItem backups
```

### Backup Retention

Keep at least:
- Last 3 daily backups
- Last 2 weekly backups (before major deployments)

```bash
# Clean old backups (keep last 5)
ls -t backups/*.sql | tail -n +6 | xargs rm -f
```

## Recovery

### Restore from Backup

```bash
# Stop application (keep db running)
docker compose stop backend frontend proxy

# Restore database
docker compose exec -T db psql -U shortener_user -d shortener < backups/shortener_YYYYMMDD_HHMMSS.sql

# Restart all services
docker compose up -d
```

### Emergency: Recreate Database

⚠️ **WARNING: This destroys all data!**

```bash
# Stop everything
docker compose down

# Remove database volume
docker volume rm url_shortener_project_postgres-data

# Start fresh
docker compose up -d

# Run migrations
cat docs/migrations/*.sql | docker compose exec -T db psql -U shortener_user -d shortener
```

## Container Logs

### View Logs

```bash
# All services (follow)
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last N lines
docker compose logs --tail=100 backend

# Since timestamp
docker compose logs --since="2026-01-14T10:00:00" backend
```

### Log Rotation

Logging is configured in `docker-compose.yml` with automatic rotation:
- Max file size: 10 MB
- Max files: 3 per container
- Total max per container: ~30 MB

No manual rotation needed.

## Database Maintenance

### View Click Statistics

```bash
# Count clicks by age
docker compose exec -T db psql -U shortener_user -d shortener -c "
  SELECT 
    DATE(event_time) as date,
    COUNT(*) as clicks
  FROM clicks 
  GROUP BY DATE(event_time) 
  ORDER BY date DESC 
  LIMIT 30;
"
```

### Maintenance Script

Use the provided maintenance script for click data management:

```powershell
# Dry run - count old clicks (30 days)
.\scripts\db_maintenance.ps1 -DaysOld 30 -DryRun

# Actually delete old clicks (DESTRUCTIVE)
.\scripts\db_maintenance.ps1 -DaysOld 30 -Delete

# VACUUM after deletion
.\scripts\db_maintenance.ps1 -Vacuum
```

See `scripts/db_maintenance.ps1` for full options.

## Common Issues

### Backend in Restart Loop

```bash
# Check logs for error
docker compose logs --tail=50 backend

# Common causes:
# 1. Database not ready - wait and retry
# 2. Missing migrations - run migrations
# 3. Bad SECRET_KEY in prod - check .env
```

### Out of Disk Space

```bash
# 1. Check what's using space
docker system df

# 2. Clean unused Docker resources
docker system prune -f

# 3. Check log sizes
du -sh /var/lib/docker/containers/*/

# 4. Consider purging old click data (see maintenance script)
```

### Database Connection Refused

```bash
# Check db container is running
docker compose ps db

# Check db logs
docker compose logs db

# Verify healthcheck passes
docker compose exec db pg_isready -U shortener_user -d shortener
```

### High Memory Usage

For 4GB VMs:

```bash
# Check container memory
docker stats --no-stream

# If PostgreSQL using too much memory, consider adding to docker-compose.yml:
#   deploy:
#     resources:
#       limits:
#         memory: 512M
```

## Checklist: Small Server Operations

### Daily
- [ ] Verify all containers running: `docker compose ps`
- [ ] Check disk usage: `df -h`
- [ ] Quick health check: `curl localhost/api/health`

### Weekly
- [ ] Create database backup
- [ ] Check click count growth: `SELECT COUNT(*) FROM clicks`
- [ ] Review backend logs for errors

### Monthly
- [ ] Purge old click data (>90 days if needed)
- [ ] Run VACUUM ANALYZE: `scripts/db_maintenance.ps1 -Vacuum`
- [ ] Check Docker disk usage: `docker system df`
- [ ] Clean unused images: `docker image prune -f`

### Before Deploy
- [ ] Create fresh backup
- [ ] Verify backup is readable
- [ ] Note current container versions
- [ ] Test in staging if possible

---

**Last Updated:** January 2026  
**Maintainer:** Diego Parra (@diegodebian)
