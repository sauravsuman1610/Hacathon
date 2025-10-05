import express, { Response } from 'express';
import Resume from '../models/Resume';
import { authenticate } from '../middleware/auth';
import { generateEmbedding, cosineSimilarity } from '../utils/embedding';
import { AuthRequest, ErrorResponse } from '../types';

const router = express.Router();

interface AskResponse {
  query: string;
  answers: Array<{
    resumeId: string;
    candidateName?: string;
    snippet: string;
    similarity: number;
    relevantSkills: string[];
  }>;
  k: number;
}

// POST /api/ask - Query resumes with RAG
router.post(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response<ErrorResponse | AskResponse>) => {
    try {
      const { query, k } = req.body;

      if (!query) {
        return res.status(400).json({
          error: {
            code: 'FIELD_REQUIRED',
            field: 'query',
            message: 'Query is required'
          }
        });
      }

      const topK = k || 5;

      // Get all resumes
      const resumes = await Resume.find();

      if (resumes.length === 0) {
        return res.json({
          query,
          answers: [],
          k: topK
        });
      }

      // Generate embedding for query
      const corpus = resumes.map(r => r.content);
      const queryEmbedding = generateEmbedding(query, corpus);

      // Calculate similarity scores
      const scoredResumes = resumes.map(resume => {
        const similarity = resume.embedding && resume.embedding.length > 0
          ? cosineSimilarity(queryEmbedding, resume.embedding)
          : 0;

        // Extract relevant snippet
        const queryTerms = query.toLowerCase().split(/\s+/);
        const contentLower = resume.content.toLowerCase();
        let bestSnippet = '';
        let maxMatches = 0;

        const sentences = resume.content.split(/[.!?]\s+/);
        for (const sentence of sentences) {
          const matches = queryTerms.filter((term: string) => 
            sentence.toLowerCase().includes(term)
          ).length;

          if (matches > maxMatches) {
            maxMatches = matches;
            bestSnippet = sentence.trim();
          }
        }

        // If no matching snippet, take first 200 chars
        if (!bestSnippet) {
          bestSnippet = resume.content.substring(0, 200);
        }

        // Extract relevant skills
        const relevantSkills = resume.parsedData.skills.filter(skill =>
          queryTerms.some((term: string) => skill.toLowerCase().includes(term))
        );

        return {
          resumeId: resume._id.toString(),
          candidateName: resume.parsedData.name,
          snippet: bestSnippet,
          similarity,
          relevantSkills
        };
      });

      // Sort by similarity (deterministic)
      scoredResumes.sort((a, b) => {
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        // Tie-breaker: use resumeId for deterministic ordering
        return a.resumeId.localeCompare(b.resumeId);
      });

      // Return top K
      const answers = scoredResumes.slice(0, topK);

      res.json({
        query,
        answers,
        k: topK
      });
    } catch (error) {
      console.error('Ask error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process query'
        }
      });
    }
  }
);

export default router;
