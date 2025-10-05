import express, { Response } from 'express';
import multer from 'multer';
import Resume from '../models/Resume';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { handleIdempotency, saveIdempotencyResponse } from '../middleware/idempotency';
import { parseDocument, extractResumeData, redactPII } from '../utils/documentParser';
import { extractZipFiles } from '../utils/zipHandler';
import { generateEmbedding } from '../utils/embedding';
import { AuthRequest, ErrorResponse, PaginatedResponse, IResume } from '../types';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, TXT, and ZIP allowed.'));
    }
  }
});

// POST /api/resumes - Upload resume(s)
router.post(
  '/',
  authenticate,
  handleIdempotency,
  upload.single('file'),
  async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'FIELD_REQUIRED',
            field: 'file',
            message: 'File is required'
          }
        });
      }

      const uploadedResumes: any[] = [];
      let filesToProcess: { name: string; content: Buffer; mimetype: string }[] = [];

      // Check if it's a ZIP file
      if (req.file.mimetype === 'application/zip' || req.file.mimetype === 'application/x-zip-compressed') {
        filesToProcess = await extractZipFiles(req.file.buffer);
      } else {
        filesToProcess = [{
          name: req.file.originalname,
          content: req.file.buffer,
          mimetype: req.file.mimetype
        }];
      }

      // Get existing resumes for embedding context
      const existingResumes = await Resume.find().limit(100);
      const corpus = existingResumes.map(r => r.content);

      // Process each file
      for (const file of filesToProcess) {
        try {
          const content = await parseDocument(file.content, file.mimetype);
          const parsedData = extractResumeData(content);
          const embedding = generateEmbedding(content, corpus);

          const resume = new Resume({
            userId: req.user!.userId,
            filename: `${Date.now()}_${file.name}`,
            originalName: file.name,
            content,
            parsedData,
            embedding
          });

          await resume.save();

          uploadedResumes.push({
            id: resume._id,
            filename: resume.originalName,
            uploadedAt: resume.uploadedAt
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }

      const response = {
        message: `Successfully uploaded ${uploadedResumes.length} resume(s)`,
        resumes: uploadedResumes
      };

      // Save idempotency response if key provided
      if (req.idempotencyKey) {
        await saveIdempotencyResponse(req.idempotencyKey, response);
      }

      return res.status(201).json(response);
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload resume'
        }
      });
    }
  }
);

// GET /api/resumes - List resumes with pagination and search
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response<ErrorResponse | PaginatedResponse<any>>) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const q = req.query.q as string;

      let query: any = {};

      // Search functionality
      if (q) {
        query.$or = [
          { content: { $regex: q, $options: 'i' } },
          { 'parsedData.skills': { $regex: q, $options: 'i' } },
          { 'parsedData.name': { $regex: q, $options: 'i' } }
        ];
      }

      // Non-recruiters can only see their own resumes
      if (req.user!.role !== 'recruiter' && req.user!.role !== 'admin') {
        query.userId = req.user!.userId;
      }

      const total = await Resume.countDocuments(query);
      const resumes = await Resume.find(query)
        .sort({ uploadedAt: -1 })
        .skip(offset)
        .limit(limit);

      // Get user profiles for all resumes
      const userIds = [...new Set(resumes.map(r => r.userId))];
      const users = await User.find({ _id: { $in: userIds } }).select('profile email');
      const userMap = new Map(users.map(u => [u._id.toString(), u]));

      const items = resumes.map(resume => {
        const user = userMap.get(resume.userId);
        const data: any = {
          id: resume._id,
          filename: resume.originalName,
          uploadedAt: resume.uploadedAt,
          userId: resume.userId,
          parsedData: req.user!.role === 'recruiter' || req.user!.role === 'admin'
            ? resume.parsedData
            : redactPII(resume.parsedData)
        };

        if (req.user!.userId === resume.userId) {
          data.parsedData = resume.parsedData; // Show full data for own resumes
        }

        // Add user profile information
        if (user) {
          data.candidateName = user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
            : resume.parsedData.name || 'Unknown';
          data.candidateEmail = user.email;
          data.candidateProfile = {
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            profileImage: user.profile?.profileImage,
            location: user.profile?.location
          };
        } else {
          data.candidateName = resume.parsedData.name || 'Unknown';
          data.candidateEmail = resume.parsedData.email;
        }

        return data;
      });

      const response: PaginatedResponse<any> = {
        items,
        total
      };

      if (offset + limit < total) {
        response.next_offset = offset + limit;
      }

      return res.json(response);
    } catch (error) {
      console.error('List resumes error:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve resumes'
        }
      });
    }
  }
);

// GET /api/resumes/:id - Get single resume
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
    try {
      const resume = await Resume.findById(req.params.id);

      if (!resume) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Resume not found'
          }
        });
      }

      // Check if user can access this resume
      if (req.user!.role !== 'recruiter' && req.user!.role !== 'admin' && req.user!.userId !== resume.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
      }

      const data: any = {
        id: resume._id,
        filename: resume.originalName,
        uploadedAt: resume.uploadedAt,
        parsedData: req.user!.role === 'recruiter' || req.user!.role === 'admin'
          ? resume.parsedData
          : redactPII(resume.parsedData),
        content: resume.content
      };

      if (req.user!.userId === resume.userId) {
        data.parsedData = resume.parsedData; // Show full data for own resumes
      }

      return res.json(data);
    } catch (error) {
      console.error('Get resume error:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve resume'
        }
      });
    }
  }
);

export default router;
