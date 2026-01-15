<#
.SYNOPSIS
    Database maintenance script for DD Shortener.
    
.DESCRIPTION
    Provides commands for:
    - Counting old click data
    - Deleting old click data (with confirmation)
    - Running VACUUM ANALYZE
    
.PARAMETER DaysOld
    Age threshold in days for click data (default: 90)
    
.PARAMETER DryRun
    Show what would be deleted without actually deleting
    
.PARAMETER Delete
    Actually delete old click data (requires confirmation)
    
.PARAMETER Vacuum
    Run VACUUM ANALYZE on clicks table
    
.PARAMETER Stats
    Show database size and record statistics
    
.EXAMPLE
    .\db_maintenance.ps1 -Stats
    
.EXAMPLE
    .\db_maintenance.ps1 -DaysOld 30 -DryRun
    
.EXAMPLE
    .\db_maintenance.ps1 -DaysOld 90 -Delete
    
.EXAMPLE
    .\db_maintenance.ps1 -Vacuum
#>

param(
    [int]$DaysOld = 90,
    [switch]$DryRun,
    [switch]$Delete,
    [switch]$Vacuum,
    [switch]$Stats
)

$ErrorActionPreference = "Stop"

# Database connection info
$DB_USER = "shortener_user"
$DB_NAME = "shortener"

function Invoke-DbQuery {
    param([string]$Query)
    $result = docker compose exec -T db psql -U $DB_USER -d $DB_NAME -t -c $Query 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Database error: $result" -ForegroundColor Red
        exit 1
    }
    return $result.Trim()
}

function Show-Stats {
    Write-Host ""
    Write-Host "=== Database Statistics ===" -ForegroundColor Cyan
    
    # Database size
    $dbSize = Invoke-DbQuery "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"
    Write-Host "Database size: $dbSize"
    
    # Record counts
    $users = Invoke-DbQuery "SELECT COUNT(*) FROM users;"
    $urls = Invoke-DbQuery "SELECT COUNT(*) FROM urls;"
    $clicks = Invoke-DbQuery "SELECT COUNT(*) FROM clicks;"
    
    Write-Host ""
    Write-Host "Record counts:"
    Write-Host "  Users:  $users"
    Write-Host "  URLs:   $urls"
    Write-Host "  Clicks: $clicks"
    
    # Table sizes
    Write-Host ""
    Write-Host "Table sizes:"
    $tableSizes = docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c "
        SELECT tablename, pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
        FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    " 2>&1
    Write-Host $tableSizes
}

function Show-ClickAgeDistribution {
    Write-Host ""
    Write-Host "=== Click Age Distribution ===" -ForegroundColor Cyan
    
    $distribution = docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c "
        SELECT 
            CASE 
                WHEN event_time >= NOW() - INTERVAL '7 days' THEN '0-7 days'
                WHEN event_time >= NOW() - INTERVAL '30 days' THEN '8-30 days'
                WHEN event_time >= NOW() - INTERVAL '90 days' THEN '31-90 days'
                ELSE '90+ days'
            END as age_range,
            COUNT(*) as clicks
        FROM clicks
        GROUP BY 1
        ORDER BY MIN(event_time) DESC;
    " 2>&1
    Write-Host $distribution
}

function Count-OldClicks {
    param([int]$Days)
    
    Write-Host ""
    Write-Host "=== Clicks older than $Days days ===" -ForegroundColor Cyan
    
    $count = Invoke-DbQuery "SELECT COUNT(*) FROM clicks WHERE event_time < NOW() - INTERVAL '$Days days';"
    Write-Host "Count: $count clicks"
    
    if ([int]$count -gt 0) {
        $oldestDate = Invoke-DbQuery "SELECT MIN(event_time)::date FROM clicks WHERE event_time < NOW() - INTERVAL '$Days days';"
        $newestDate = Invoke-DbQuery "SELECT MAX(event_time)::date FROM clicks WHERE event_time < NOW() - INTERVAL '$Days days';"
        Write-Host "Date range: $oldestDate to $newestDate"
    }
    
    return [int]$count
}

function Delete-OldClicks {
    param([int]$Days)
    
    $count = Count-OldClicks -Days $Days
    
    if ($count -eq 0) {
        Write-Host ""
        Write-Host "No clicks to delete." -ForegroundColor Green
        return
    }
    
    Write-Host ""
    Write-Host "WARNING: This will permanently delete $count click records!" -ForegroundColor Yellow
    Write-Host "This action cannot be undone." -ForegroundColor Yellow
    Write-Host ""
    
    $confirm = Read-Host "Type 'DELETE' to confirm deletion"
    
    if ($confirm -ne "DELETE") {
        Write-Host "Deletion cancelled." -ForegroundColor Gray
        return
    }
    
    Write-Host ""
    Write-Host "Deleting clicks older than $Days days..." -ForegroundColor Yellow
    
    $result = Invoke-DbQuery "DELETE FROM clicks WHERE event_time < NOW() - INTERVAL '$Days days' RETURNING id;"
    $deletedCount = ($result -split "`n" | Where-Object { $_ -match '\d' }).Count
    
    Write-Host "Deleted $deletedCount click records." -ForegroundColor Green
    Write-Host ""
    Write-Host "Recommended: Run -Vacuum to reclaim disk space." -ForegroundColor Cyan
}

function Run-Vacuum {
    Write-Host ""
    Write-Host "=== Running VACUUM ANALYZE ===" -ForegroundColor Cyan
    Write-Host "This may take a moment..."
    
    docker compose exec -T db psql -U $DB_USER -d $DB_NAME -c "VACUUM ANALYZE clicks;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "VACUUM ANALYZE completed successfully." -ForegroundColor Green
    }
    else {
        Write-Host "VACUUM ANALYZE failed." -ForegroundColor Red
    }
}

# Main logic
Write-Host "DD Shortener - Database Maintenance" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check Docker is running
$dockerCheck = docker compose ps db 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Cannot connect to database container. Is Docker running?" -ForegroundColor Red
    exit 1
}

if ($Stats) {
    Show-Stats
    Show-ClickAgeDistribution
}
elseif ($DryRun) {
    Count-OldClicks -Days $DaysOld
    Write-Host ""
    Write-Host "(Dry run - no changes made)" -ForegroundColor Gray
}
elseif ($Delete) {
    Delete-OldClicks -Days $DaysOld
}
elseif ($Vacuum) {
    Run-Vacuum
    Show-Stats
}
else {
    # Default: show help
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\db_maintenance.ps1 -Stats              # Show database statistics"
    Write-Host "  .\db_maintenance.ps1 -DaysOld 30 -DryRun # Count clicks older than 30 days"
    Write-Host "  .\db_maintenance.ps1 -DaysOld 90 -Delete # Delete clicks older than 90 days"
    Write-Host "  .\db_maintenance.ps1 -Vacuum             # Run VACUUM ANALYZE"
    Write-Host ""
    Write-Host "Default: Show this help" -ForegroundColor Gray
}

Write-Host ""
