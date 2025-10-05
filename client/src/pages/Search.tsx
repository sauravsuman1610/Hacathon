import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Resume } from '../types';
import './Search.css';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [askQuery, setAskQuery] = useState('');
  const [askResults, setAskResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const limit = 10;

  const loadResumes = async (searchQuery: string = '', newOffset: number = 0) => {
    setLoading(true);
    try {
      const response = await api.get('/api/resumes', {
        params: { q: searchQuery, limit, offset: newOffset }
      });
      setResumes(response.data.items);
      setHasMore(response.data.next_offset !== undefined);
      setOffset(newOffset);
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadResumes(query, 0);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/api/ask', {
        query: askQuery,
        k: 5
      });
      setAskResults(response.data.answers);
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Search Resumes</h1>
        <p>Search through uploaded resumes or ask questions</p>
      </div>

      <div className="card">
        <h2>Browse Resumes</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="input"
            placeholder="Search by skills, name, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {loading && <div className="loading">Loading...</div>}

        <div className="resumes-grid">
          {resumes.map((resume) => (
            <div key={resume.id} className="resume-card">
              <div className="resume-header">
                <div className="candidate-info">
                  <h3>
                    <Link to={`/profile/${resume.userId}`} className="candidate-name-link">
                      {resume.candidateName || resume.parsedData.name || 'Unknown'}
                    </Link>
                  </h3>
                  {resume.candidateEmail && (
                    <p className="candidate-email">{resume.candidateEmail}</p>
                  )}
                </div>
                <Link to={`/candidates/${resume.id}`} className="btn btn-secondary btn-sm">
                  View Resume
                </Link>
              </div>
              
              <p className="resume-filename">{resume.filename}</p>
              
              {resume.parsedData.summary && (
                <p className="resume-summary">{resume.parsedData.summary}</p>
              )}

              {resume.parsedData.skills.length > 0 && (
                <div className="resume-skills">
                  {resume.parsedData.skills.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="badge badge-primary">{skill}</span>
                  ))}
                  {resume.parsedData.skills.length > 5 && (
                    <span className="badge badge-secondary">+{resume.parsedData.skills.length - 5} more</span>
                  )}
                </div>
              )}

              <p className="resume-date">
                Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => loadResumes(query, offset + limit)}
            className="btn btn-secondary"
            disabled={loading}
          >
            Load More
          </button>
        )}
      </div>

      <div className="card">
        <h2>Ask a Question</h2>
        <p className="section-description">
          Ask natural language questions to find relevant resumes
        </p>
        
        <form onSubmit={handleAsk} className="search-form">
          <input
            type="text"
            className="input"
            placeholder="e.g., 'Who has React and Node.js experience?'"
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Ask
          </button>
        </form>

        {askResults.length > 0 && (
          <div className="ask-results">
            <h3>Results for: "{askQuery}"</h3>
            {askResults.map((result, idx) => (
              <div key={idx} className="ask-result-card">
                <div className="ask-result-header">
                  <h4>
                    <Link to={`/candidates/${result.resumeId}`}>
                      {result.candidateName || 'Unknown Candidate'}
                    </Link>
                  </h4>
                  <span className="similarity-score">
                    Match: {(result.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                
                <p className="snippet">{result.snippet}</p>

                {result.relevantSkills.length > 0 && (
                  <div className="relevant-skills">
                    <strong>Relevant Skills:</strong>
                    {result.relevantSkills.map((skill: string, i: number) => (
                      <span key={i} className="badge badge-success">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

