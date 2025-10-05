export interface User {
  id: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'admin';
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    phone?: string;
    location?: string;
    profileImage?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Resume {
  id: string;
  filename: string;
  uploadedAt: string;
  userId?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateProfile?: {
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    location?: string;
  };
  parsedData: {
    name?: string;
    email?: string;
    phone?: string;
    skills: string[];
    experience: string[];
    education: string[];
    summary?: string;
  };
  content?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  createdAt: string;
}

export interface Match {
  resumeId: string;
  candidateName: string;
  email?: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedRequirements: string[];
  missingRequirements: string[];
  evidence: string[];
}

export interface AskAnswer {
  resumeId: string;
  candidateName?: string;
  snippet: string;
  similarity: number;
  relevantSkills: string[];
}

