# MongoDB Local Setup Guide

## 🍃 Complete MongoDB Installation Instructions

### Step 1: Download MongoDB Community Server

1. **Open your web browser** and navigate to:
   ```
   https://www.mongodb.com/try/download/community
   ```

2. **Select your configuration**:
   - Platform: Windows
   - Package: MSI
   - Version: Latest (8.0.x)

3. **Click Download** and save the file

### Step 2: Install MongoDB

1. **Right-click** the downloaded MSI file and select **"Run as administrator"**

2. **Follow the installation wizard**:
   - Click "Next" on the welcome screen
   - Accept the license agreement
   - Choose **"Complete"** installation type
   - **IMPORTANT**: Check **"Install MongoDB as a Service"**
   - **IMPORTANT**: Select **"Run service as Network Service user"**
   - **Optional**: Check **"Install MongoDB Compass"** (GUI tool)
   - Click **"Install"**

3. **Wait for installation** to complete (may take a few minutes)

4. **Click "Finish"** when installation is complete

### Step 3: Verify Installation

After installation, run one of these verification scripts:

**Option A: Batch File**
```cmd
verify_mongodb.bat
```

**Option B: PowerShell Script**
```powershell
.\verify_mongodb.ps1
```

### Step 4: Configure Your Application

Create a `.env` file in your project root with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/resumerag
NODE_ENV=development
```

### Step 5: Test Your Setup

1. **Start MongoDB** (if not already running):
   ```cmd
   net start MongoDB
   ```

2. **Start your ResumeRAG application**:
   ```cmd
   npm run dev
   ```

3. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## 🔧 Troubleshooting

### MongoDB Service Not Starting
```cmd
# Check service status
sc query MongoDB

# Start service manually
net start MongoDB

# Check Windows Event Viewer for errors
```

### Port Already in Use
```cmd
# Check what's using port 27017
netstat -ano | findstr :27017

# Kill the process if needed
taskkill /PID <process_id> /F
```

### Permission Issues
- Run Command Prompt as Administrator
- Ensure MongoDB service has proper permissions
- Check Windows Firewall settings

### Alternative: MongoDB Atlas (Cloud)
If local installation fails, you can use MongoDB Atlas (free tier):
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Update MONGODB_URI in .env file

## ✅ Verification Checklist

- [ ] MongoDB service is installed
- [ ] MongoDB service is running
- [ ] Can connect to localhost:27017
- [ ] Database 'resumerag' is accessible
- [ ] .env file is configured correctly
- [ ] ResumeRAG application starts without errors

## 🚀 Next Steps

Once MongoDB is running:
1. Upload some resume files via the web interface
2. Test the search functionality
3. Create job postings and test matching
4. Verify all features are working correctly

## 📞 Support

If you encounter issues:
1. Check Windows Event Viewer for MongoDB errors
2. Verify MongoDB service is running
3. Check firewall settings
4. Try restarting the MongoDB service
5. Consider using MongoDB Atlas as an alternative
