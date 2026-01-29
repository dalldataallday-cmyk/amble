# =========================================================
# AMBLE: Startup Orchestrator (Fixed Version)
# =========================================================

$AppName      = "Amble"
$RootDir      = "C:\Data\react\data\Amble"
$BackendDir   = "$RootDir\backend"
$FrontendDir  = "$RootDir\frontend"
$BackendFile  = "app.py"
$BackendUrl   = "http://127.0.0.1:5000"

Write-Host "=== Starting $AppName Ecosystem ===" -ForegroundColor Cyan

# 1. Directory Validation
if (-not (Test-Path $BackendDir)) { Write-Error "Backend path missing"; exit 1 }
if (-not (Test-Path $FrontendDir)) { Write-Error "Frontend path missing"; exit 1 }

# 2. Cache Cleanup
Write-Host "Cleaning environment caches..." -ForegroundColor Yellow
Get-ChildItem -Path $BackendDir -Filter "__pycache__" -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path "$FrontendDir\node_modules\.cache") { Remove-Item -Path "$FrontendDir\node_modules\.cache" -Recurse -Force }

# 3. Launch Flask Backend
Write-Host "Launching Flask Backend..." -ForegroundColor Yellow
try {
    # Combined into one line to prevent "Unexpected Token" errors
    Start-Process -FilePath "python" -ArgumentList $BackendFile -WorkingDirectory $BackendDir -WindowStyle Normal
}
catch {
    Write-Host "Critical Failure: Could not start Flask." -ForegroundColor Red
    exit 1
}

# 4. Wait for Backend Readiness
Write-Host "Waiting for API to respond at $BackendUrl..." -ForegroundColor Yellow
$MaxAttempts = 15
$Attempt = 0
$Ready = $false

while ($Attempt -lt $MaxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $BackendUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) { $Ready = $true; break }
    }
    catch {
        Start-Sleep -Seconds 2
        $Attempt++
        Write-Host "  Attempt $($Attempt)/$MaxAttempts..." -ForegroundColor DarkGray
    }
}

# 5. Launch React Frontend (Updated for visibility)
Write-Host "Launching React Frontend..." -ForegroundColor Yellow
try {
    # Using /k keeps the window open if it crashes so you can read the error
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k npm start" -WorkingDirectory $FrontendDir
}
catch {
    Write-Host "Critical Failure: Could not start React." -ForegroundColor Red
    exit 1
}

Write-Host "=== $AppName is running! ===" -ForegroundColor Green