# Smart ICU Dashboard - Start All Services

Write-Host "🏥 Starting Smart ICU Dashboard..." -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Start MongoDB check
Write-Host "🔍 Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = Get-Process -Name mongod -ErrorAction SilentlyContinue
if (-not $mongoRunning) {
    Write-Host "⚠️  MongoDB is not running!" -ForegroundColor Red
    Write-Host "Please start MongoDB first or use MongoDB Atlas.`n" -ForegroundColor Yellow
    $continue = Read-Host "Continue without MongoDB check? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

Write-Host "`n🚀 Starting services...`n" -ForegroundColor Green

# Start Backend
Write-Host "📡 Starting Backend (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start AI Service
Write-Host "🤖 Starting AI Service (Port 8000)..." -ForegroundColor Cyan
# Using direct path to python executable in venv to ensure correct environment
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ai-service'; & '.\venv\Scripts\python.exe' main.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "🎨 Starting Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`n✅ All services started!`n" -ForegroundColor Green

Write-Host "📍 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:    http://localhost:5000" -ForegroundColor White
Write-Host "   AI Service: http://localhost:8000`n" -ForegroundColor White

Write-Host "🔐 Default Login:" -ForegroundColor Cyan
Write-Host "   Email:    admin@icu.com" -ForegroundColor White
Write-Host "   Password: admin123`n" -ForegroundColor White

Write-Host "Press Ctrl+C to stop this script. Close individual terminal windows to stop services." -ForegroundColor Yellow
Write-Host "`nOpening browser in 5 seconds..." -ForegroundColor Green

Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

# Keep script running
Write-Host "`nScript running. Press Ctrl+C to exit." -ForegroundColor Yellow
while ($true) {
    Start-Sleep -Seconds 60
}
