@echo off
echo 🚀 ResumeRAG Setup Script
echo =========================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (>=16.0.0) first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install backend dependencies
echo 📦 Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd client
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    echo PORT=5000 > .env
    echo MONGODB_URI=mongodb://localhost:27017/resumerag >> .env
    echo NODE_ENV=development >> .env
    echo ✅ Created .env file with default settings
) else (
    echo ✅ .env file already exists
)

REM Create uploads directory
if not exist uploads mkdir uploads
echo ✅ Created uploads directory

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Make sure MongoDB is running locally, or update MONGODB_URI in .env
echo 2. Run 'npm run dev' to start the development server
echo 3. Open http://localhost:3000 in your browser
echo.
echo For deployment:
echo - Check DEPLOYMENT.md for hosting options
echo - Update MONGODB_URI for production database
echo - Set NODE_ENV=production
echo.
echo Happy coding! 🚀
pause
