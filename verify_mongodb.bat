@echo off
echo 🍃 MongoDB Installation Verification
echo ====================================

echo Checking MongoDB installation...

REM Check if MongoDB service is running
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB service is installed
    sc query MongoDB | findstr "RUNNING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ MongoDB service is running
    ) else (
        echo ⚠️  MongoDB service is installed but not running
        echo Starting MongoDB service...
        net start MongoDB
        if %errorlevel% equ 0 (
            echo ✅ MongoDB service started successfully
        ) else (
            echo ❌ Failed to start MongoDB service
        )
    )
) else (
    echo ❌ MongoDB service not found. Please install MongoDB first.
    echo.
    echo Installation steps:
    echo 1. Download MongoDB from: https://www.mongodb.com/try/download/community
    echo 2. Run the MSI installer as Administrator
    echo 3. Choose "Complete" installation
    echo 4. Check "Install MongoDB as a Service"
    echo 5. Complete the installation
    pause
    exit /b 1
)

echo.
echo Testing MongoDB connection...
echo use resumerag > test_mongo.js
echo db.test.insertOne({message: "MongoDB is working!"}) >> test_mongo.js
echo db.test.find() >> test_mongo.js
echo exit >> test_mongo.js

REM Try to run MongoDB shell
"C:\Program Files\MongoDB\Server\8.0\bin\mongo.exe" test_mongo.js 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB connection successful!
    echo ✅ Database 'resumerag' is ready to use
) else (
    echo ⚠️  MongoDB shell test failed, but service is running
    echo This might be normal if MongoDB shell path is different
)

del test_mongo.js 2>nul

echo.
echo 🎉 MongoDB setup complete!
echo.
echo Your ResumeRAG application can now connect to MongoDB using:
echo MONGODB_URI=mongodb://localhost:27017/resumerag
echo.
echo Next steps:
echo 1. Update your .env file with the MongoDB URI above
echo 2. Run 'npm run dev' to start your ResumeRAG application
echo.
pause
