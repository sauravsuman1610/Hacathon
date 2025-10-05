const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const nlp = require('compromise');

// Simple text preprocessing
function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract keywords and create simple embeddings
function createEmbeddings(text) {
  const processedText = preprocessText(text);
  const words = processedText.split(' ');
  
  // Create a simple bag-of-words embedding
  const wordFreq = {};
  words.forEach(word => {
    if (word.length > 2) { // Filter short words
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Convert to vector (simplified approach)
  const embedding = new Array(100).fill(0);
  const sortedWords = Object.keys(wordFreq).sort();
  
  sortedWords.forEach((word, index) => {
    if (index < 100) {
      embedding[index] = wordFreq[word];
    }
  });
  
  return embedding;
}

// Parse PDF content
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to parse PDF: ' + error.message);
  }
}

// Parse DOCX content
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to parse DOCX: ' + error.message);
  }
}

// Extract structured data from resume text
function extractResumeData(text) {
  const doc = nlp(text);
  
  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract phone
  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  // Extract skills (common technical skills)
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'mongodb',
    'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'typescript',
    'angular', 'vue', 'express', 'django', 'flask', 'spring', 'mysql',
    'postgresql', 'redis', 'elasticsearch', 'machine learning', 'ai',
    'data science', 'analytics', 'project management', 'agile', 'scrum'
  ];
  
  const skills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Extract experience (simplified)
  const experience = [];
  const expRegex = /(?:experience|work history|employment)[\s\S]*?(?=education|skills|$)/i;
  const expMatch = text.match(expRegex);
  
  if (expMatch) {
    const expText = expMatch[0];
    const companyRegex = /([A-Z][a-zA-Z\s&,.-]+(?:Inc|LLC|Corp|Company|Ltd|Limited)?)/g;
    const companies = expText.match(companyRegex) || [];
    
    companies.forEach(company => {
      if (company.trim().length > 3) {
        experience.push({
          company: company.trim(),
          position: 'Software Developer', // Simplified
          duration: '2+ years',
          description: 'Relevant work experience'
        });
      }
    });
  }
  
  // Extract education
  const education = [];
  const eduRegex = /(?:education|academic)[\s\S]*?(?=experience|skills|$)/i;
  const eduMatch = text.match(eduRegex);
  
  if (eduMatch) {
    const eduText = eduMatch[0];
    const degreeRegex = /(bachelor|master|phd|b\.?s\.?|m\.?s\.?|ph\.?d\.?)/gi;
    const degrees = eduText.match(degreeRegex) || [];
    
    degrees.forEach(degree => {
      education.push({
        institution: 'University',
        degree: degree.trim(),
        year: '2020-2024'
      });
    });
  }
  
  // Extract name (first line usually)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const name = lines[0] || 'Unknown';
  
  return {
    name,
    email,
    phone,
    skills,
    experience,
    education,
    summary: text.substring(0, 500) + '...'
  };
}

// Redact PII from text
function redactPII(text) {
  // Redact email
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Redact phone
  text = text.replace(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, '[PHONE]');
  
  // Redact names (simplified)
  const lines = text.split('\n');
  if (lines.length > 0) {
    lines[0] = '[NAME]';
  }
  text = lines.join('\n');
  
  return text;
}

// Calculate similarity between two embeddings
function calculateSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

module.exports = {
  parsePDF,
  parseDOCX,
  extractResumeData,
  createEmbeddings,
  redactPII,
  calculateSimilarity,
  preprocessText
};
