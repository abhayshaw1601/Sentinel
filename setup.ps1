# Smart ICU Dashboard - Quick Start Script

Write-Host "Smart ICU Dashboard - Setup Wizard" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js $nodeVersion installed" -ForegroundColor Green
}
catch {
    Write-Host "Node.js not found. Please install Node.js 18+ from nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $text = python --version 2>&1
    Write-Host "$text installed" -ForegroundColor Green
}
catch {
    Write-Host "Python not found. Please install Python 3.9+ from python.org" -ForegroundColor Red
    exit 1
}

# Check MongoDB
$mongoRunning = Get-Process -Name mongod -ErrorAction SilentlyContinue
if ($mongoRunning) {
    Write-Host "MongoDB is running" -ForegroundColor Green
}
if (-not $mongoRunning) {
    Write-Host "MongoDB not detected. Please start MongoDB or use MongoDB Atlas" -ForegroundColor Yellow
}

Write-Host "`nSetting up project...`n" -ForegroundColor Cyan

# Setup Backend
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Set-Location backend
    
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    if (-not (Test-Path ".env")) {
        Write-Host "Creating backend .env file..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item .env.example .env
            Write-Host "Please update backend/.env with your MongoDB URI and JWT secret" -ForegroundColor Yellow
        }
        if (-not (Test-Path ".env.example")) {
            Write-Host "backend/.env.example not found" -ForegroundColor Red
        }
    }
    
    Set-Location ..
}
if (-not (Test-Path "backend")) {
    Write-Host "backend directory not found" -ForegroundColor Red
}

# Setup Frontend
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location frontend
    
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    Set-Location ..
}
if (-not (Test-Path "frontend")) {
    Write-Host "frontend directory not found" -ForegroundColor Red
}

# Setup AI Service
Write-Host "`nSetting up AI service..." -ForegroundColor Yellow
if (Test-Path "ai-service") {
    Set-Location ai-service
    
    if (-not (Test-Path "venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
    
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    if (Test-Path "venv\Scripts\python.exe") {
        .\venv\Scripts\python.exe -m pip install -r requirements.txt
    }
    if (-not (Test-Path "venv\Scripts\python.exe")) {
        Write-Host "venv python not found. Pip install failed." -ForegroundColor Red
    }

    if (-not (Test-Path ".env")) {
        Write-Host "Creating AI service .env file..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item .env.example .env
            Write-Host "Please update ai-service/.env with your GEMINI_API_KEY" -ForegroundColor Yellow
        }
    }
    
    Set-Location ..
}
if (-not (Test-Path "ai-service")) {
    Write-Host "ai-service directory not found" -ForegroundColor Red
}

Write-Host "`nSetup complete!`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with MongoDB URI and JWT secret" -ForegroundColor White
Write-Host "2. Update ai-service/.env with GEMINI_API_KEY" -ForegroundColor White
Write-Host "3. Run: cd backend; npm run seed (to create sample data)" -ForegroundColor White
Write-Host "4. Start all services using the start script`n" -ForegroundColor White

Write-Host "For detailed instructions, see README.md" -ForegroundColor Cyan
