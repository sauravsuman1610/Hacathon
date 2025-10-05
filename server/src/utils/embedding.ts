import natural from 'natural';

const TfIdf = natural.TfIdf;

// Simple embedding using TF-IDF (for production, consider OpenAI embeddings)
export const generateEmbedding = (text: string, corpus: string[] = []): number[] => {
  const tfidf = new TfIdf();
  
  // Add corpus documents
  corpus.forEach(doc => tfidf.addDocument(doc));
  
  // Add current document
  tfidf.addDocument(text);
  
  // Generate embedding vector (simplified)
  const vector: number[] = [];
  const terms = text.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const uniqueTerms = [...new Set(terms)].slice(0, 100);
  
  uniqueTerms.forEach(term => {
    tfidf.tfidfs(term, (i, measure) => {
      if (i === corpus.length) {
        vector.push(measure);
      }
    });
  });
  
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
};

// Cosine similarity for comparing embeddings
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Simple text similarity calculation
export const calculateTextSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};
