import mongoose, { Schema, Document } from 'mongoose';
import { IJob } from '../types';

interface JobDocument extends Omit<IJob, '_id'>, Document {}

const jobSchema = new Schema<JobDocument>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  skills: [String],
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<JobDocument>('Job', jobSchema);
