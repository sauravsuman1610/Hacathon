const express = require('express');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const { createEmbeddings, calculateSimilarity } = require('../utils/documentParser');

const router = express.Router();

// POST /api/jobs - Create new job
router.post('/', async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      requirements = [],
      skills = [],
      location,
      salary,
      employmentType = 'full-time',
      experience
    } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ error: 'Title, company, and description are required' });
    }

    // Create embeddings for the job description
    const jobText = `${title} ${description} ${requirements.join(' ')} ${skills.join(' ')}`;
    const embeddings = createEmbeddings(jobText);

    const job = new Job({
      title,
      company,
      description,
      requirements,
      skills,
      location,
      salary,
      employmentType,
      experience,
      embeddings
    });

    await job.save();

    res.status(201).json({
      message: 'Job created successfully',
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        description: job.description
      }
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// GET /api/jobs - Get all jobs
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const jobs = await Job.find({ isActive: true })
      .select('title company location salary employmentType postedDate')
      .sort({ postedDate: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Job.countDocuments({ isActive: true });

    res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get specific job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs/:id/match - Match candidates to job
router.post('/:id/match', async (req, res) => {
  try {
    const { top_n = 5 } = req.body;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get all resumes
    const resumes = await Resume.find({});
    
    // Calculate matches
    const matches = resumes.map(resume => {
      const similarity = calculateSimilarity(job.embeddings, resume.embeddings);
      
      // Calculate missing requirements
      const missingRequirements = job.requirements.filter(req => 
        !resume.content.toLowerCase().includes(req.toLowerCase())
      );
      
      // Calculate matching skills
      const matchingSkills = job.skills.filter(skill =>
        resume.parsedData.skills.some(resumeSkill =>
          resumeSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      // Calculate evidence snippets
      const evidence = [];
      job.requirements.forEach(req => {
        const regex = new RegExp(`.{0,50}${req}.{0,50}`, 'gi');
        const matches = resume.content.match(regex);
        if (matches) {
          evidence.push(...matches.slice(0, 2)); // Limit to 2 snippets per requirement
        }
      });

      return {
        candidateId: resume._id,
        candidateName: resume.parsedData.name,
        similarity: similarity,
        matchingSkills: matchingSkills,
        missingRequirements: missingRequirements,
        evidence: evidence.slice(0, 5), // Limit total evidence
        score: (similarity * 0.6) + (matchingSkills.length / job.skills.length * 0.4)
      };
    });

    // Sort by score and return top matches
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, top_n);

    res.json({
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      matches: topMatches,
      totalCandidates: resumes.length
    });

  } catch (error) {
    console.error('Job match error:', error);
    res.status(500).json({ error: 'Failed to match candidates' });
  }
});

// PUT /api/jobs/:id - Update job
router.put('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      message: 'Job updated successfully',
      job: job
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

module.exports = router;
