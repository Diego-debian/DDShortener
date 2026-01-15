# verify.ps1 - MVP Validation Script for URL Shortener (Windows PowerShell 5.1 safe)
# Usage: powershell -ExecutionPolicy Bypass -File .\verify.ps1

$ErrorActionPreference = "Stop"

# ----------------------------
# Configuration
# ----------------------------
$BASE_URL = "http://localhost:8010"   # Backend directo
$PASSWORD = "SecurePass123!"
$TIMESTAMP = [int][Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
$EMAIL = "demo+$TIMESTAMP@test.local"

# ----------------------------
# Helpers
# ----------------------------
function Fail($msg) {
  Write-Host ""
  Write-Host "FAIL: $msg" -ForegroundColor Red
  # Helpful logs
  Write-Host ""
  Write-Host "--- docker compose ps ---" -ForegroundColor Yellow
  try { docker compose ps } catch {}
  Write-Host ""
  Write-Host "--- backend logs (tail 80) ---" -ForegroundColor Yellow
  try { docker compose logs --tail=80 backend } catch {}
  exit 1
}

function Ok($msg) {
  Write-Host "OK: $msg" -ForegroundColor Green
}

function Info($msg) {
  Write-Host ""
  Write-Host "--- $msg ---" -ForegroundColor Cyan
}

function JsonRequest($url, $method = "GET", $body = $null, $headers = @{}) {
  $params = @{
    Uri        = $url
    Method     = $method
    Headers    = $headers
    TimeoutSec = 20
  }
  if ($body -ne $null) {
    $params["ContentType"] = "application/json"
    $params["Body"] = $body
  }
  return Invoke-RestMethod @params
}

function HttpNoRedirect($url, $headers = @{}) {
  # Load System.Net.Http assembly for PowerShell 5.1 compatibility
  Add-Type -AssemblyName System.Net.Http
  
  # Use HttpClient for reliable redirect handling (PowerShell 5.1 compatible)
  $handler = New-Object System.Net.Http.HttpClientHandler
  $handler.AllowAutoRedirect = $false
  $client = New-Object System.Net.Http.HttpClient($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(20)
  
  try {
    # Add headers if provided
    foreach ($key in $headers.Keys) {
      $client.DefaultRequestHeaders.Add($key, $headers[$key])
    }
    
    $response = $client.GetAsync($url).Result
    
    $statusCode = [int]$response.StatusCode
    $location = $null
    if ($response.Headers.Contains("Location")) {
      $location = $response.Headers.GetValues("Location") | Select-Object -First 1
    }
    
    return @{
      StatusCode = $statusCode
      Location   = $location
    }
  }
  finally {
    if ($client) { $client.Dispose() }
    if ($handler) { $handler.Dispose() }
  }
}

function GetStatusCodeFromException($_) {
  $code = $null
  if ($_.Exception -and $_.Exception.Response) {
    try { $code = [int]$_.Exception.Response.StatusCode } catch { $code = $null }
  }
  return $code
}

# ----------------------------
# Test 1: docker compose up
# ----------------------------
Info "Test 1: docker compose up -d --build"

# Temporarily allow stderr output (PowerShell 5.1 throws NativeCommandError)
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$out = & docker compose up -d --build 2>&1
$ErrorActionPreference = $prevErrorAction

if ($LASTEXITCODE -ne 0) {
  Write-Host $out
  Fail "docker compose failed with exit code $LASTEXITCODE"
}

Ok "Containers started (exit code 0)"

# Check backend is not in crash-loop
Start-Sleep -Seconds 2
$ps = docker compose ps 2>&1 | Out-String
if ($ps -match "shortener_backend" -and $ps -match "Restarting") {
  Fail "Backend container is in Restarting state (crash loop)"
}
Write-Host "Backend container status OK" -ForegroundColor Gray

# ----------------------------
# Test 2: wait for health
# ----------------------------
Info "Test 2: Waiting for backend health"
$maxWaitSeconds = 60
$intervalSeconds = 2
$maxAttempts = [int]($maxWaitSeconds / $intervalSeconds)
$attempt = 0
$healthy = $false
$lastError = ""

Write-Host "Checking $BASE_URL/api/health for up to $maxWaitSeconds seconds..."

while ($attempt -lt $maxAttempts) {
  $attempt++
  try {
    $health = JsonRequest "$BASE_URL/api/health" "GET" $null @{}
    if ($health.status -eq "ok") {
      $healthy = $true
      break
    }
    else {
      $lastError = "status=$($health.status)"
    }
  }
  catch {
    $lastError = $_.Exception.Message
  }
  Start-Sleep -Seconds $intervalSeconds
}

if (-not $healthy) {
  Fail "Backend not healthy after $maxWaitSeconds seconds. Last error: $lastError"
}
Ok "Backend healthy"

# ----------------------------
# Test 3: register
# ----------------------------
Info "Test 3: POST /api/auth/register"
$registerBody = @{ email = $EMAIL; password = $PASSWORD } | ConvertTo-Json
try {
  $reg = JsonRequest "$BASE_URL/api/auth/register" "POST" $registerBody @{}
  if (-not $reg.id) { Fail "Register response missing id" }
  Ok "Registered user: $EMAIL"
}
catch {
  Fail "Registration failed: $($_.Exception.Message)"
}

# ----------------------------
# Test 4: login-json
# ----------------------------
Info "Test 4: POST /api/auth/login-json"
$loginBody = @{ email = $EMAIL; password = $PASSWORD } | ConvertTo-Json
try {
  $login = JsonRequest "$BASE_URL/api/auth/login-json" "POST" $loginBody @{}
  if (-not $login.access_token) { Fail "Login response missing access_token" }
  $TOKEN = $login.access_token
  Ok "Login OK, token received"
}
catch {
  Fail "Login failed: $($_.Exception.Message)"
}

$authHeaders = @{ Authorization = "Bearer $TOKEN" }

# ----------------------------
# Test 5: create 3 urls
# ----------------------------
Info "Test 5: Create 3 URLs (free plan)"
function CreateUrl($n) {
  $payload = @{ long_url = "https://example.com/page$n" } | ConvertTo-Json
  $res = JsonRequest "$BASE_URL/api/urls" "POST" $payload $authHeaders
  if (-not $res.short_code) { Fail "Create URL #$n missing short_code" }
  return $res.short_code
}

try {
  $code1 = CreateUrl 1
  $code2 = CreateUrl 2
  $code3 = CreateUrl 3
  Ok "Created 3 URLs: $code1, $code2, $code3"
  $SHORT_CODE = $code1
}
catch {
  Fail "Creating URLs failed: $($_.Exception.Message)"
}

# ----------------------------
# Test 6: 4th url should fail 403
# ----------------------------
Info "Test 6: 4th URL should be blocked (expect 403)"
$payload4 = @{ long_url = "https://example.com/page4" } | ConvertTo-Json
try {
  $tmp = JsonRequest "$BASE_URL/api/urls" "POST" $payload4 $authHeaders
  Fail "4th URL creation succeeded but should have been blocked"
}
catch {
  $code = GetStatusCodeFromException $_
  if ($code -eq 403) {
    Ok "4th URL blocked with 403 as expected"
  }
  else {
    Fail "Expected 403, got $code"
  }
}

# ----------------------------
# Test 7: redirect 302 + Location
# ----------------------------
Info "Test 7: Redirect works (expect 302 + Location)"
try {
  $resp = HttpNoRedirect "$BASE_URL/$SHORT_CODE" @{}
  if ($resp.StatusCode -ne 302) { Fail "Expected 302, got $($resp.StatusCode)" }
  $loc = $resp.Location
  if (-not $loc) { Fail "Missing Location header" }
  Ok "Redirect OK (302) Location=$loc"
}
catch {
  Fail "Redirect test failed: $($_.Exception.Message)"
}

# ----------------------------
# Test 8: stats returns total_clicks >= 1 and correct code
# ----------------------------
Info "Test 8: Stats endpoint works"
try {
  $stats = JsonRequest "$BASE_URL/api/urls/$SHORT_CODE/stats" "GET" $null $authHeaders
  if ($null -eq $stats.total_clicks) { Fail "Stats missing total_clicks" }
  if ($stats.total_clicks -lt 1) { Fail "Expected total_clicks >= 1, got $($stats.total_clicks)" }

  # Handle both possible shapes:
  $returnedCode = $null
  if ($stats.url -and $stats.url.short_code) { $returnedCode = $stats.url.short_code }
  elseif ($stats.short_code) { $returnedCode = $stats.short_code }

  if (-not $returnedCode) { Fail "Stats missing short_code (root or stats.url.short_code)" }
  if ($returnedCode -ne $SHORT_CODE) { Fail "Stats returned short_code=$returnedCode expected=$SHORT_CODE" }

  Ok "Stats OK total_clicks=$($stats.total_clicks) short_code=$returnedCode"
}
catch {
  Fail "Stats test failed: $($_.Exception.Message)"
}

# ----------------------------
# Test 9: Premium plan allows more than 3 URLs
# ----------------------------
Info "Test 9: Premium plan allows > 3 URLs"

# Create a new premium user
$PREMIUM_TIMESTAMP = [int][Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds) + 1
$PREMIUM_EMAIL = "premium+$PREMIUM_TIMESTAMP@test.local"

# Register premium user
try {
  $premRegBody = @{ email = $PREMIUM_EMAIL; password = $PASSWORD } | ConvertTo-Json
  $premReg = JsonRequest "$BASE_URL/api/auth/register" "POST" $premRegBody @{}
  if (-not $premReg.id) { Fail "Premium user registration failed" }
  Write-Host "Registered premium test user: $PREMIUM_EMAIL" -ForegroundColor Gray
}
catch {
  Fail "Premium user registration failed: $($_.Exception.Message)"
}

# Promote user to premium via direct SQL (simulates admin action)
Write-Host "Promoting user to premium via SQL..." -ForegroundColor Gray
$sqlCmd = "docker compose exec -T db psql -U shortener_user -d shortener -c `"UPDATE users SET plan = 'premium' WHERE email = '$PREMIUM_EMAIL';`""
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$sqlOut = Invoke-Expression $sqlCmd 2>&1
$ErrorActionPreference = $prevErrorAction

if ($LASTEXITCODE -ne 0) {
  Write-Host $sqlOut
  Fail "Failed to promote user to premium"
}
Write-Host "User promoted to premium" -ForegroundColor Gray

# Login as premium user
try {
  $premLoginBody = @{ email = $PREMIUM_EMAIL; password = $PASSWORD } | ConvertTo-Json
  $premLogin = JsonRequest "$BASE_URL/api/auth/login-json" "POST" $premLoginBody @{}
  if (-not $premLogin.access_token) { Fail "Premium login failed" }
  $PREMIUM_TOKEN = $premLogin.access_token
  Write-Host "Premium user logged in" -ForegroundColor Gray
}
catch {
  Fail "Premium login failed: $($_.Exception.Message)"
}

$premiumAuthHeaders = @{ Authorization = "Bearer $PREMIUM_TOKEN" }

# Create 5 URLs as premium user (should NOT hit the 3 URL limit)
try {
  $premiumCodes = @()
  for ($i = 1; $i -le 5; $i++) {
    $payload = @{ long_url = "https://premium-example.com/page$i" } | ConvertTo-Json
    $res = JsonRequest "$BASE_URL/api/urls" "POST" $payload $premiumAuthHeaders
    if (-not $res.short_code) { Fail "Premium URL #$i missing short_code" }
    $premiumCodes += $res.short_code
  }
  Ok "Premium user created 5 URLs: $($premiumCodes -join ', ')"
}
catch {
  $code = GetStatusCodeFromException $_
  if ($code -eq 403) {
    Fail "Premium user got 403 on URL creation (limit should be 100, not 3)"
  }
  Fail "Premium URL creation failed: $($_.Exception.Message)"
}

# ----------------------------
# Test 10: /api/me returns plan field
# ----------------------------
Info "Test 10: /api/me returns plan field for premium user"
try {
  $me = JsonRequest "$BASE_URL/api/me" "GET" $null $premiumAuthHeaders
  if (-not $me.plan) { Fail "/api/me response missing plan field" }
  if ($me.plan -ne "premium") { Fail "Expected plan='premium', got plan='$($me.plan)'" }
  if (-not $me.email) { Fail "/api/me response missing email field" }
  Ok "/api/me returns plan='$($me.plan)' for user $($me.email)"
}
catch {
  Fail "/api/me test failed: $($_.Exception.Message)"
}

# ----------------------------
# Test 11: SECRET_KEY security warning (informational, does not fail)
# ----------------------------
Info "Test 11: SECRET_KEY security check (informational)"

# Check if backend is using default insecure SECRET_KEY
# We test by inspecting the container environment (development only)
$envCheck = docker compose exec -T backend sh -c 'echo $ENVIRONMENT' 2>$null
$secretCheck = docker compose exec -T backend sh -c 'echo $SECRET_KEY' 2>$null

if ($envCheck -match "prod") {
  # In production, the app would have already crashed if SECRET_KEY was insecure
  Ok "Production environment detected - app running means SECRET_KEY passed guardrail"
}
else {
  # In development, warn if using default key
  $insecureKeys = @(
    "super_secret_key_for_dev_only",
    "change_me",
    "secret",
    "secretkey"
  )
  
  $isInsecure = $false
  foreach ($key in $insecureKeys) {
    if ($secretCheck -match $key) {
      $isInsecure = $true
      break
    }
  }
  
  if ($isInsecure -or $secretCheck.Length -lt 32) {
    Write-Host "WARN: Default/insecure SECRET_KEY detected in development" -ForegroundColor Yellow
    Write-Host "      This is OK for local testing, but MUST be changed before production." -ForegroundColor Yellow
    Write-Host "      Generate a secure key: python -c `"import secrets; print(secrets.token_urlsafe(64))`"" -ForegroundColor Gray
  }
  else {
    Ok "SECRET_KEY appears secure (non-default, length >= 32)"
  }
}

# ----------------------------
# Test 12: App config files accessible
# ----------------------------
Info "Test 12: App config files accessible"

$configFiles = @(
  @{ Name = "promotions.json"; Url = "http://localhost/app-config/promotions.json" },
  @{ Name = "donations.json"; Url = "http://localhost/app-config/donations.json" }
)

$allConfigOk = $true
foreach ($config in $configFiles) {
  try {
    $response = Invoke-WebRequest -Uri $config.Url -Method HEAD -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 304) {
      Write-Host "  $($config.Name): OK ($($response.StatusCode))" -ForegroundColor Gray
    }
    else {
      Write-Host "  $($config.Name): Unexpected status $($response.StatusCode)" -ForegroundColor Yellow
      $allConfigOk = $false
    }
  }
  catch {
    Write-Host "  $($config.Name): FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allConfigOk = $false
  }
}

if ($allConfigOk) {
  Ok "All app config files accessible"
}
else {
  Fail "Some app config files are not accessible"
}

# ----------------------------
# Test 13: Container status check (informational)
# ----------------------------
Info "Test 13: Container status check (informational)"

$expectedContainers = @(
  "shortener_proxy",
  "shortener_backend",
  "shortener_frontend",
  "shortener_db"
)

$containerStatus = docker compose ps --format json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue

$allContainersUp = $true
foreach ($expected in $expectedContainers) {
  $container = $containerStatus | Where-Object { $_.Name -eq $expected }
  if ($container) {
    $state = $container.State
    if ($state -eq "running") {
      Write-Host "  $expected : running" -ForegroundColor Gray
    }
    else {
      Write-Host "  WARN: $expected is $state (not running)" -ForegroundColor Yellow
      $allContainersUp = $false
    }
  }
  else {
    Write-Host "  WARN: $expected not found" -ForegroundColor Yellow
    $allContainersUp = $false
  }
}

if ($allContainersUp) {
  Ok "All expected containers are running"
}
else {
  Write-Host "WARN: Some containers are not running. This is informational only." -ForegroundColor Yellow
}

# ----------------------------
# Test 14: Admin endpoints require admin role (403 for non-admin)
# ----------------------------
Info "Test 14: Admin endpoints require admin role"

# Use the premium user token from Test 9-10 (still logged in)
# Try to access admin endpoint as premium user - should get 403
try {
  $adminUrl = "$BASE_URL/api/admin/users/test@test.com/plan"
  $body = @{ plan = "premium" } | ConvertTo-Json
  $result = JsonRequest $adminUrl "PATCH" $body $premiumAuthHeaders
  Fail "Premium user should NOT be able to access admin endpoints"
}
catch {
  $code = GetStatusCodeFromException $_
  if ($code -eq 403) {
    Ok "Non-admin user correctly got 403 Forbidden on admin endpoint"
  }
  else {
    Fail "Expected 403, got $code"
  }
}

# ----------------------------
# Test 15: Admin can update user plan
# ----------------------------
Info "Test 15: Admin can update user plan"

# Create and promote an admin user
$ADMIN_TIMESTAMP = [int][Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds) + 100
$ADMIN_EMAIL = "admin+$ADMIN_TIMESTAMP@test.local"

# Register admin user
try {
  $adminRegBody = @{ email = $ADMIN_EMAIL; password = $PASSWORD } | ConvertTo-Json
  $adminReg = JsonRequest "$BASE_URL/api/auth/register" "POST" $adminRegBody @{}
  if (-not $adminReg.id) { Fail "Admin user registration failed" }
  Write-Host "Registered admin test user: $ADMIN_EMAIL" -ForegroundColor Gray
}
catch {
  Fail "Admin registration failed: $($_.Exception.Message)"
}

# Promote to admin via SQL
Write-Host "Promoting user to admin via SQL..." -ForegroundColor Gray
$sqlCmd = "docker compose exec -T db psql -U shortener_user -d shortener -c `"UPDATE users SET plan = 'admin' WHERE email = '$ADMIN_EMAIL';`""
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$sqlOut = Invoke-Expression $sqlCmd 2>&1
$ErrorActionPreference = $prevErrorAction

if ($LASTEXITCODE -ne 0) {
  Write-Host $sqlOut
  Fail "Failed to promote user to admin"
}
Write-Host "User promoted to admin" -ForegroundColor Gray

# Login as admin
try {
  $adminLoginBody = @{ email = $ADMIN_EMAIL; password = $PASSWORD } | ConvertTo-Json
  $adminLogin = JsonRequest "$BASE_URL/api/auth/login-json" "POST" $adminLoginBody @{}
  if (-not $adminLogin.access_token) { Fail "Admin login failed" }
  $ADMIN_TOKEN = $adminLogin.access_token
  Write-Host "Admin user logged in" -ForegroundColor Gray
}
catch {
  Fail "Admin login failed: $($_.Exception.Message)"
}

$adminAuthHeaders = @{ Authorization = "Bearer $ADMIN_TOKEN" }

# Create a test user to modify
$TARGET_EMAIL = "target+$ADMIN_TIMESTAMP@test.local"
try {
  $targetRegBody = @{ email = $TARGET_EMAIL; password = $PASSWORD } | ConvertTo-Json
  $targetReg = JsonRequest "$BASE_URL/api/auth/register" "POST" $targetRegBody @{}
  Write-Host "Created target user: $TARGET_EMAIL" -ForegroundColor Gray
}
catch {
  # May already exist, continue
  Write-Host "Target user may already exist, continuing..." -ForegroundColor Gray
}

# Admin updates target user's plan to premium
try {
  $updatePlanBody = @{ plan = "premium" } | ConvertTo-Json
  $updateResult = JsonRequest "$BASE_URL/api/admin/users/$TARGET_EMAIL/plan" "PATCH" $updatePlanBody $adminAuthHeaders
  if ($updateResult.plan -ne "premium") {
    Fail "Plan update failed: expected 'premium', got '$($updateResult.plan)'"
  }
  Ok "Admin successfully updated user plan to 'premium'"
}
catch {
  Fail "Admin plan update failed: $($_.Exception.Message)"
}

# ----------------------------
# Test 16: Admin can update URL status
# ----------------------------
Info "Test 16: Admin can update URL status"

# Use one of the URLs created in Test 5 or 9
# Get a URL short_code - first one from premium user (Test 9)
$testUrlCode = "1h"  # From premium user test

# First verify URL exists
try {
  $statsRes = JsonRequest "$BASE_URL/api/urls/$testUrlCode/stats" "GET" $null $premiumAuthHeaders
  if (-not $statsRes.url) {
    # Try another code
    $testUrlCode = "Y"  # From earlier test
    $statsRes = JsonRequest "$BASE_URL/api/urls/$testUrlCode/stats" "GET" $null $authHeaders
  }
  Write-Host "Using URL code: $testUrlCode for status update test" -ForegroundColor Gray
}
catch {
  # Create a new URL as admin
  $newUrlBody = @{ long_url = "https://admin-test.example.com" } | ConvertTo-Json
  $newUrl = JsonRequest "$BASE_URL/api/urls" "POST" $newUrlBody $adminAuthHeaders
  $testUrlCode = $newUrl.short_code
  Write-Host "Created new URL for test: $testUrlCode" -ForegroundColor Gray
}

# Admin disables the URL
try {
  $disableBody = @{ is_active = $false } | ConvertTo-Json
  $disableResult = JsonRequest "$BASE_URL/api/admin/urls/$testUrlCode" "PATCH" $disableBody $adminAuthHeaders
  if ($disableResult.is_active -ne $false) {
    Fail "URL disable failed: is_active should be false"
  }
  Write-Host "  URL disabled successfully" -ForegroundColor Gray
}
catch {
  Fail "Admin URL disable failed: $($_.Exception.Message)"
}

# Admin re-enables the URL
try {
  $enableBody = @{ is_active = $true } | ConvertTo-Json
  $enableResult = JsonRequest "$BASE_URL/api/admin/urls/$testUrlCode" "PATCH" $enableBody $adminAuthHeaders
  if ($enableResult.is_active -ne $true) {
    Fail "URL enable failed: is_active should be true"
  }
  Ok "Admin successfully toggled URL status (disabled then enabled)"
}
catch {
  Fail "Admin URL enable failed: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ALL TESTS PASSED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
exit 0
