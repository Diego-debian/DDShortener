# verify.ps1 - Basic verification for URL shortener (no auth)
# Usage: powershell -ExecutionPolicy Bypass -File .\verify.ps1

$ErrorActionPreference = "Stop"

function Fail($msg) {
  Write-Host "`n❌ FAIL: $msg" -ForegroundColor Red
  exit 1
}

function Ok($msg) {
  Write-Host "✅ $msg" -ForegroundColor Green
}

function Info($msg) {
  Write-Host "`n--- $msg ---" -ForegroundColor Cyan
}

function CurlJson($url, $method="GET", $body=$null, $headers=@{}) {
  $params = @{
    Uri = $url
    Method = $method
    Headers = $headers
    TimeoutSec = 20
  }
  if ($body -ne $null) {
    $params["ContentType"] = "application/json"
    $params["Body"] = $body
  }
  return Invoke-RestMethod @params
}

function CurlStatus($url, $method="GET", $headers=@{}) {
  try {
    $resp = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -MaximumRedirection 0 -TimeoutSec 20
    return $resp.StatusCode
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      return [int]$_.Exception.Response.StatusCode
    }
    throw
  }
}

# ---- Config ----
$BACKEND = "http://localhost:8010"   # backend directo (si publicaste 8010:8000)
$PROXY   = "http://localhost"        # nginx

Info "1) Docker compose up (build)"
docker compose up -d --build | Out-Null
Start-Sleep -Seconds 2

Info "2) Health checks"
$h1 = CurlJson "$BACKEND/api/health"
if ($h1.status -ne "ok") { Fail "Backend health not ok" }
Ok "Backend /api/health OK"

$h2 = CurlJson "$PROXY/api/health"
if ($h2.status -ne "ok") { Fail "Proxy health not ok" }
Ok "Proxy /api/health OK"

Info "3) Create a short URL"
$payload = '{"long_url":"https://example.com"}'
$created = CurlJson "$BACKEND/api/urls" "POST" $payload
if (-not $created.short_code) { Fail "No short_code returned" }
$code = $created.short_code
Ok "Created short_code=$code"

Info "4) Redirect works (302 expected)"
$status = CurlStatus "$BACKEND/$code"
if ($status -ne 302) { Fail "Expected 302, got $status" }
Ok "Redirect on backend OK (302)"

$status2 = CurlStatus "$PROXY/$code"
if ($status2 -ne 302) { Fail "Expected 302 via proxy, got $status2" }
Ok "Redirect via proxy OK (302)"

Info "5) Stats endpoint responds"
$stats = CurlJson "$BACKEND/api/urls/$code/stats"
if (-not $stats.total_clicks -and $stats.total_clicks -ne 0) { Fail "Stats missing total_clicks" }
Ok "Stats OK (total_clicks=$($stats.total_clicks))"

Write-Host "`n🎉 ALL BASIC CHECKS PASSED" -ForegroundColor Green
exit 0
