import mongoose, { Schema, Document } from 'mongoose';
import { IResume } from '../types';

interface ResumeDocument extends Omit<IResume, '_id'>, Document {}

const resumeSchema = new Schema<ResumeDocument>({
  userId: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
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
    experience: [String],
    education: [String],
    summary: String
  },
  embedding: [Number],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ResumeDocument>('Resume', resumeSchema);
