@echo off
echo 🚀 ResumeRAG Quick Start Script
echo ==============================

echo Checking MongoDB status...

REM Check if MongoDB service is running
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    sc query MongoDB | findstr "RUNNING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ MongoDB is running
    ) else (
        echo ⚠️  MongoDB service found but not running
        echo Starting MongoDB service...
        net start MongoDB
        if %errorlevel% equ 0 (
            echo ✅ MongoDB started successfully
        ) else (
            echo ❌ Failed to start MongoDB
            echo Please check MongoDB installation
            pause
            exit /b 1
        )
    )
) else (
    echo ❌ MongoDB service not found
    echo.
    echo Please install MongoDB first:
    echo 1. Download from: https://www.mongodb.com/try/download/community
    echo 2. Run installer as Administrator
    echo 3. Choose "Complete" installation
    echo 4. Check "Install MongoDB as a Service"
    echo 5. Complete installation
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo Checking Node.js dependencies...

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies found
)

REM Check if client node_modules exists
if not exist client\node_modules (
    echo 📦 Installing frontend dependencies...
    cd client
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
) else (
    echo ✅ Frontend dependencies found
)

echo.
echo Checking environment configuration...

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file...
    echo PORT=5000 > .env
    echo MONGODB_URI=mongodb://localhost:27017/resumerag >> .env
    echo NODE_ENV=development >> .env
    echo ✅ Created .env file
) else (
    echo ✅ .env file exists
)

echo.
echo 🎉 Everything is ready!
echo.
echo Starting ResumeRAG application...
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5000
echo.
echo Press Ctrl+C to stop the application
echo.

npm run dev
