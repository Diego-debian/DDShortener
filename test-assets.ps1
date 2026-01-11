# Test asset loading
$html = (Invoke-WebRequest -Uri http://localhost/app/ -UseBasicParsing).Content
if ($html -match 'src="(/app/assets/[^"]+\.js)"') {
    $assetPath = $matches[1]
    Write-Host "Testing asset: $assetPath"
    $response = Invoke-WebRequest -Uri "http://localhost$assetPath" -UseBasicParsing
    Write-Host "Asset Status: $($response.StatusCode)"
    Write-Host "Content-Type: $($response.Headers['Content-Type'])"
} else {
    Write-Host "ERROR: No JS asset found in HTML"
}

if ($html -match 'href="(/app/assets/[^"]+\.css)"') {
    $cssPath = $matches[1]
    Write-Host "Testing CSS: $cssPath"
    $response = Invoke-WebRequest -Uri "http://localhost$cssPath" -UseBasicParsing
    Write-Host "CSS Status: $($response.StatusCode)"
}
