import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { IResume } from '../types';

export const parseDocument = async (buffer: Buffer, mimetype: string): Promise<string> => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
};

export const extractResumeData = (content: string): IResume['parsedData'] => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  // Extract email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emailMatch = content.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : undefined;

  // Extract phone
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatch = content.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  // Extract name (usually first non-empty line)
  const name = lines[0] || undefined;

  // Extract skills (look for common skill keywords)
  const skillKeywords = ['skills', 'technical skills', 'technologies', 'expertise'];
  const skills: string[] = [];
  let inSkillsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (skillKeywords.some(keyword => line.includes(keyword))) {
      inSkillsSection = true;
      continue;
    }
    
    if (inSkillsSection) {
      if (line.match(/^[a-z\s]+:/i)) {
        inSkillsSection = false;
      } else {
        const lineSkills = lines[i].split(/[,;|]/).map(s => s.trim()).filter(s => s);
        skills.push(...lineSkills);
        if (skills.length > 20) break;
      }
    }
  }

  // Extract experience and education sections
  const experience: string[] = [];
  const education: string[] = [];
  let currentSection = '';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('experience') || lowerLine.includes('work history')) {
      currentSection = 'experience';
      continue;
    } else if (lowerLine.includes('education')) {
      currentSection = 'education';
      continue;
    } else if (lowerLine.match(/^[a-z\s]+:/i) && !lowerLine.includes(':')) {
      currentSection = '';
    }

    if (currentSection === 'experience' && line.length > 10) {
      experience.push(line);
      if (experience.length > 10) currentSection = '';
    } else if (currentSection === 'education' && line.length > 10) {
      education.push(line);
      if (education.length > 5) currentSection = '';
    }
  }

  // Create summary (first few lines of content)
  const summary = lines.slice(0, 3).join(' ').substring(0, 200);

  return {
    name,
    email,
    phone,
    skills: skills.slice(0, 20),
    experience: experience.slice(0, 10),
    education: education.slice(0, 5),
    summary
  };
};

export const redactPII = (parsedData: IResume['parsedData']): IResume['parsedData'] => {
  return {
    ...parsedData,
    email: undefined,
    phone: undefined
  };
};
