# ResumeRAG Deployment Guide

## Free Hosting Options

### 1. Railway (Recommended)
- **Backend**: Deploy Node.js app directly
- **Database**: Use Railway's MongoDB addon
- **Frontend**: Build and serve static files from Express

### 2. Render
- **Backend**: Deploy as Web Service
- **Database**: Use MongoDB Atlas (free tier)
- **Frontend**: Build and serve static files

### 3. Heroku (Alternative)
- **Backend**: Deploy Node.js app
- **Database**: Use MongoDB Atlas
- **Frontend**: Build and serve static files

## Environment Variables

Create a `.env` file with:
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resumerag
NODE_ENV=production
```

## Deployment Steps

### For Railway:
1. Connect GitHub repository to Railway
2. Add MongoDB addon
3. Set environment variables
4. Deploy automatically

### For Render:
1. Connect GitHub repository
2. Create MongoDB Atlas cluster
3. Set environment variables
4. Deploy

## Database Setup
- Use MongoDB Atlas free tier (512MB)
- Create cluster and get connection string
- Update MONGODB_URI in environment variables

## Features Included:
- ✅ Resume upload (PDF/DOCX)
- ✅ ZIP bulk upload
- ✅ Semantic search with RAG
- ✅ Job matching with evidence
- ✅ PII redaction
- ✅ Pagination
- ✅ Responsive UI
- ✅ Error handling
- ✅ Rate limiting
- ✅ Security headers

## API Endpoints:
- POST /api/resumes - Upload single resume
- POST /api/resumes/bulk - Upload ZIP file
- GET /api/resumes - List resumes with pagination
- GET /api/resumes/:id - Get specific resume
- POST /api/ask - Search resumes with RAG
- POST /api/jobs - Create job
- GET /api/jobs - List jobs
- POST /api/jobs/:id/match - Match candidates to job

## Frontend Pages:
- / - Home page
- /upload - Resume upload
- /search - Search interface
- /jobs - Job management
- /candidates/:id - Candidate details
