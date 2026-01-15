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

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ALL TESTS PASSED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
exit 0
