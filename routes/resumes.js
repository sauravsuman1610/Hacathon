const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const { parsePDF, parseDOCX, extractResumeData, createEmbeddings, redactPII } = require('../utils/documentParser');
const AdmZip = require('adm-zip');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

// POST /api/resumes - Upload single resume
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();
    
    let content = '';
    
    // Parse file based on type
    if (fileType === '.pdf') {
      content = await parsePDF(fs.readFileSync(filePath));
    } else if (fileType === '.docx') {
      content = await parseDOCX(fs.readFileSync(filePath));
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Extract structured data
    const parsedData = extractResumeData(content);
    
    // Create embeddings
    const embeddings = createEmbeddings(content);
    
    // Create redacted version
    const redactedContent = redactPII(content);

    // Save to database
    const resume = new Resume({
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: fileType,
      fileSize: req.file.size,
      content: redactedContent,
      parsedData: parsedData,
      embeddings: embeddings,
      isRedacted: true
    });

    await resume.save();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        filename: resume.originalName,
        parsedData: resume.parsedData
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process resume: ' + error.message });
  }
});

// POST /api/resumes/bulk - Upload multiple resumes (ZIP support)
router.post('/bulk', upload.single('zipfile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file uploaded' });
    }

    const filePath = req.file.path;
    const zip = new AdmZip(filePath);
    
    const uploadedResumes = [];
    const errors = [];

    for (const zipEntry of zip.getEntries()) {
      if (zipEntry.isDirectory) continue;
      
      const fileName = zipEntry.entryName;
      const fileType = path.extname(fileName).toLowerCase();
      
      if (!['.pdf', '.docx', '.doc'].includes(fileType)) {
        errors.push(`${fileName}: Unsupported file type`);
        continue;
      }

      try {
        const content = zipEntry.getData();
        let parsedContent = '';
        
        if (fileType === '.pdf') {
          parsedContent = await parsePDF(content);
        } else if (fileType === '.docx') {
          parsedContent = await parseDOCX(content);
        }

        const parsedData = extractResumeData(parsedContent);
        const embeddings = createEmbeddings(parsedContent);
        const redactedContent = redactPII(parsedContent);

        const resume = new Resume({
          filename: fileName,
          originalName: fileName,
          fileType: fileType,
          fileSize: content.length,
          content: redactedContent,
          parsedData: parsedData,
          embeddings: embeddings,
          isRedacted: true
        });

        await resume.save();
        uploadedResumes.push({
          id: resume._id,
          filename: fileName,
          parsedData: resume.parsedData
        });

      } catch (error) {
        errors.push(`${fileName}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `Processed ${uploadedResumes.length} resumes`,
      uploaded: uploadedResumes,
      errors: errors
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to process ZIP file: ' + error.message });
  }
});

// GET /api/resumes - Get all resumes with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.q || '';
    const offset = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { 'parsedData.name': { $regex: search, $options: 'i' } },
          { 'parsedData.skills': { $in: [new RegExp(search, 'i')] } },
          { content: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const resumes = await Resume.find(query)
      .select('filename originalName parsedData uploadDate')
      .sort({ uploadDate: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Resume.countDocuments(query);

    res.json({
      resumes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// GET /api/resumes/:id - Get specific resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(resume);
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// DELETE /api/resumes/:id - Delete resume
router.delete('/:id', async (req, res) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;
