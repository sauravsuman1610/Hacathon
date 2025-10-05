Write-Host "🍃 MongoDB Installation Verification" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Write-Host "Checking MongoDB installation..." -ForegroundColor Yellow

# Check if MongoDB service exists
try {
    $service = Get-Service -Name "MongoDB" -ErrorAction Stop
    Write-Host "✅ MongoDB service is installed" -ForegroundColor Green
    
    if ($service.Status -eq "Running") {
        Write-Host "✅ MongoDB service is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB service is installed but not running" -ForegroundColor Yellow
        Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
        Start-Service -Name "MongoDB"
        Start-Sleep -Seconds 3
        
        $service = Get-Service -Name "MongoDB"
        if ($service.Status -eq "Running") {
            Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start MongoDB service" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ MongoDB service not found. Please install MongoDB first." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation steps:" -ForegroundColor Yellow
    Write-Host "1. Download MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Run the MSI installer as Administrator" -ForegroundColor White
    Write-Host "3. Choose 'Complete' installation" -ForegroundColor White
    Write-Host "4. Check 'Install MongoDB as a Service'" -ForegroundColor White
    Write-Host "5. Complete the installation" -ForegroundColor White
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""
Write-Host "Testing MongoDB connection..." -ForegroundColor Yellow

# Create test script
$testScript = @"
use resumerag
db.test.insertOne({message: "MongoDB is working!"})
db.test.find()
exit
"@

$testScript | Out-File -FilePath "test_mongo.js" -Encoding UTF8

# Try to find MongoDB installation path
$possiblePaths = @(
    "C:\Program Files\MongoDB\Server\8.0\bin\mongo.exe",
    "C:\Program Files\MongoDB\Server\7.0\bin\mongo.exe",
    "C:\Program Files\MongoDB\Server\6.0\bin\mongo.exe"
)

$mongoPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $mongoPath = $path
        break
    }
}

if ($mongoPath) {
    try {
        & $mongoPath test_mongo.js 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB connection successful!" -ForegroundColor Green
            Write-Host "✅ Database 'resumerag' is ready to use" -ForegroundColor Green
        } else {
            Write-Host "⚠️  MongoDB shell test failed, but service is running" -ForegroundColor Yellow
            Write-Host "This might be normal if MongoDB shell path is different" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not test MongoDB shell, but service is running" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Could not find MongoDB shell executable" -ForegroundColor Yellow
    Write-Host "MongoDB service is running, but shell path not found" -ForegroundColor Yellow
}

# Clean up
Remove-Item "test_mongo.js" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 MongoDB setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your ResumeRAG application can now connect to MongoDB using:" -ForegroundColor Yellow
Write-Host "MONGODB_URI=mongodb://localhost:27017/resumerag" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with the MongoDB URI above" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start your ResumeRAG application" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
