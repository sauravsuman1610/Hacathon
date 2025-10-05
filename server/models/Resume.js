const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    required: true
  },
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: [{
      company: String,
      position: String,
      duration: String,
      description: String
    }],
    education: [{
      institution: String,
      degree: String,
      year: String
    }],
    summary: String
  },
  embeddings: [Number], // Vector embeddings for semantic search
  isRedacted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
