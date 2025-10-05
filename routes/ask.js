const express = require('express');
const Resume = require('../models/Resume');
const { createEmbeddings, calculateSimilarity, preprocessText } = require('../utils/documentParser');

const router = express.Router();

// POST /api/ask - Ask questions about resumes
router.post('/', async (req, res) => {
  try {
    const { query, k = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Create embeddings for the query
    const queryEmbeddings = createEmbeddings(query);
    
    // Get all resumes
    const resumes = await Resume.find({});
    
    // Calculate similarity scores
    const results = resumes.map(resume => {
      const similarity = calculateSimilarity(queryEmbeddings, resume.embeddings);
      
      // Find relevant snippets
      const snippets = findRelevantSnippets(resume.content, query);
      
      return {
        resumeId: resume._id,
        candidateName: resume.parsedData.name,
        similarity: similarity,
        snippets: snippets,
        metadata: {
          skills: resume.parsedData.skills,
          experience: resume.parsedData.experience.length,
          education: resume.parsedData.education.length
        }
      };
    });

    // Sort by similarity and return top k results
    const topResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    // Format response according to schema
    const response = {
      query: query,
      results: topResults.map(result => ({
        candidateId: result.resumeId,
        candidateName: result.candidateName,
        relevanceScore: result.similarity,
        evidence: result.snippets.map(snippet => ({
          text: snippet.text,
          source: 'resume',
          confidence: snippet.confidence
        })),
        metadata: result.metadata
      })),
      totalResults: results.length,
      topK: k
    };

    res.json(response);

  } catch (error) {
    console.error('Ask query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Helper function to find relevant snippets
function findRelevantSnippets(content, query) {
  const queryWords = preprocessText(query).split(' ');
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  const snippets = sentences.map(sentence => {
    const sentenceWords = preprocessText(sentence).split(' ');
    const matches = queryWords.filter(word => 
      sentenceWords.some(sWord => sWord.includes(word) || word.includes(sWord))
    );
    
    const confidence = matches.length / queryWords.length;
    
    return {
      text: sentence.trim(),
      confidence: confidence
    };
  });

  // Return top snippets with confidence > 0.1
  return snippets
    .filter(snippet => snippet.confidence > 0.1)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

module.exports = router;
