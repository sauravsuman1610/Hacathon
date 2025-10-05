import { Request, Response, NextFunction } from 'express';
import IdempotencyKey from '../models/IdempotencyKey';
import { AuthRequest } from '../types';

export const handleIdempotency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const idempotencyKey = req.header('Idempotency-Key');

  if (!idempotencyKey) {
    return next();
  }

  try {
    // Check if we have a cached response
    const cachedResponse = await IdempotencyKey.findOne({ key: idempotencyKey });

    if (cachedResponse) {
      return res.json(cachedResponse.response);
    }

    // Store the idempotency key for later use
    req.idempotencyKey = idempotencyKey;
    next();
  } catch (error) {
    console.error('Idempotency error:', error);
    next();
  }
};

export const saveIdempotencyResponse = async (key: string, response: any) => {
  try {
    await IdempotencyKey.create({
      key,
      response,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error saving idempotency response:', error);
  }
};
