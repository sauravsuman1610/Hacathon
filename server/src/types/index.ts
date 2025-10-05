import { Request } from 'express';

export interface IUser {
  _id: string;
  email: string;
  password: string;
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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IResume {
  _id: string;
  userId: string;
  filename: string;
  originalName: string;
  content: string;
  parsedData: {
    name?: string;
    email?: string;
    phone?: string;
    skills: string[];
    experience: string[];
    education: string[];
    summary?: string;
  };
  embedding?: number[];
  uploadedAt: Date;
}

export interface IJob {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  createdBy: string;
  createdAt: Date;
}

export interface IIdempotencyKey {
  key: string;
  response: any;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  idempotencyKey?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  next_offset?: number;
  total?: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    field?: string;
    message: string;
  };
}
