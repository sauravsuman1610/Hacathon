import mongoose, { Schema, Document } from 'mongoose';
import { IIdempotencyKey } from '../types';

interface IdempotencyKeyDocument extends Omit<IIdempotencyKey, '_id'>, Document {}

const idempotencyKeySchema = new Schema<IdempotencyKeyDocument>({
  key: {
    type: String,
    required: true,
    unique: true
  },
  response: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IdempotencyKeyDocument>('IdempotencyKey', idempotencyKeySchema);
