import express, { Response } from 'express';
import Job from '../models/Job';
import Resume from '../models/Resume';
import { authenticate, authorize } from '../middleware/auth';
import { handleIdempotency, saveIdempotencyResponse } from '../middleware/idempotency';
import { calculateTextSimilarity } from '../utils/embedding';
import { AuthRequest, ErrorResponse, PaginatedResponse } from '../types';

const router = express.Router();

// POST /api/jobs - Create job
router.post(
  '/',
  authenticate,
  authorize('recruiter', 'admin'),
  handleIdempotency,
  async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
    try {
      const { title, description, requirements, skills } = req.body;

      if (!title) {
        return res.status(400).json({
          error: {
            code: 'FIELD_REQUIRED',
            field: 'title',
            message: 'Title is required'
          }
        });
      }

      if (!description) {
        return res.status(400).json({
          error: {
            code: 'FIELD_REQUIRED',
            field: 'description',
            message: 'Description is required'
          }
        });
      }

      const job = new Job({
        title,
        description,
        requirements: requirements || [],
        skills: skills || [],
        createdBy: req.user!.userId
      });

      await job.save();

      const response = {
        id: job._id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        createdAt: job.createdAt
      };

      if (req.idempotencyKey) {
        await saveIdempotencyResponse(req.idempotencyKey, response);
      }

      res.status(201).json(response);
    } catch (error) {
      console.error('Create job error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create job'
        }
      });
    }
  }
);

// GET /api/jobs - List jobs with pagination
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response<ErrorResponse | PaginatedResponse<any>>) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const total = await Job.countDocuments();
      const jobs = await Job.find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      const items = jobs.map(job => ({
        id: job._id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        createdAt: job.createdAt
      }));

      const response: PaginatedResponse<any> = {
        items,
        total
      };

      if (offset + limit < total) {
        response.next_offset = offset + limit;
      }

      res.json(response);
    } catch (error) {
      console.error('List jobs error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve jobs'
        }
      });
    }
  }
);

// GET /api/jobs/:id - Get single job
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Job not found'
          }
        });
      }

      res.json({
        id: job._id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        createdAt: job.createdAt
      });
    } catch (error) {
      console.error('Get job error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve job'
        }
      });
    }
  }
);

// POST /api/jobs/:id/match - Match candidates to job
router.post(
  '/:id/match',
  authenticate,
  async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
    try {
      const { top_n } = req.body;
      const topN = top_n || 10;

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Job not found'
          }
        });
      }

      // Get all resumes
      const resumes = await Resume.find();

      if (resumes.length === 0) {
        return res.json({
          jobId: job._id,
          jobTitle: job.title,
          matches: []
        });
      }

      // Calculate match scores
      const jobText = `${job.title} ${job.description} ${job.skills.join(' ')} ${job.requirements.join(' ')}`.toLowerCase();

      const scoredCandidates = resumes.map(resume => {
        const resumeText = `${resume.content} ${resume.parsedData.skills.join(' ')}`.toLowerCase();
        
        // Calculate overall similarity
        const overallScore = calculateTextSimilarity(jobText, resumeText);

        // Calculate skill matches
        const matchedSkills: string[] = [];
        const missingSkills: string[] = [];

        job.skills.forEach(jobSkill => {
          const found = resume.parsedData.skills.some(resumeSkill =>
            resumeSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
            jobSkill.toLowerCase().includes(resumeSkill.toLowerCase())
          );

          if (found) {
            matchedSkills.push(jobSkill);
          } else {
            missingSkills.push(jobSkill);
          }
        });

        // Calculate requirement matches
        const matchedRequirements: string[] = [];
        const missingRequirements: string[] = [];

        job.requirements.forEach(req => {
          const found = resumeText.includes(req.toLowerCase());
          if (found) {
            matchedRequirements.push(req);
          } else {
            missingRequirements.push(req);
          }
        });

        // Find evidence snippets
        const evidence: string[] = [];
        const sentences = resume.content.split(/[.!?]\s+/);
        
        matchedSkills.forEach(skill => {
          const sentence = sentences.find(s => 
            s.toLowerCase().includes(skill.toLowerCase())
          );
          if (sentence) {
            evidence.push(sentence.trim());
          }
        });

        const skillMatchRatio = job.skills.length > 0 
          ? matchedSkills.length / job.skills.length 
          : 1;

        const finalScore = (overallScore * 0.5) + (skillMatchRatio * 0.5);

        return {
          resumeId: resume._id.toString(),
          candidateName: resume.parsedData.name || 'Unknown',
          email: resume.parsedData.email,
          score: finalScore,
          matchedSkills,
          missingSkills,
          matchedRequirements,
          missingRequirements,
          evidence: evidence.slice(0, 3)
        };
      });

      // Sort by score (deterministic)
      scoredCandidates.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.resumeId.localeCompare(b.resumeId);
      });

      const matches = scoredCandidates.slice(0, topN);

      res.json({
        jobId: job._id,
        jobTitle: job.title,
        matches
      });
    } catch (error) {
      console.error('Match candidates error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to match candidates'
        }
      });
    }
  }
);

export default router;
