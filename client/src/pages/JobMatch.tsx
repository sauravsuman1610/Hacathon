import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Job, Match } from '../types';
import './JobMatch.css';

const JobMatch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [topN, setTopN] = useState(10);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const response = await api.get(`/api/jobs/${id}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error loading job:', error);
    }
  };

  const findMatches = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/api/jobs/${id}/match`, { top_n: topN });
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Error finding matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      findMatches();
    }
  }, [id]);

  if (!job) {
    return (
      <div className="container">
        <div className="loading">Loading job information...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/jobs" className="back-link">← Back to Jobs</Link>

      <div className="card job-info">
        <h1>{job.title}</h1>
        <p className="job-description">{job.description}</p>
        
        {job.skills.length > 0 && (
          <div className="required-skills">
            <strong>Required Skills:</strong>
            {job.skills.map((skill, idx) => (
              <span key={idx} className="badge badge-primary">{skill}</span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="match-controls">
          <h2>Candidate Matches</h2>
          <div className="controls-row">
            <label>
              Top N Candidates:
              <input
                type="number"
                min="1"
                max="50"
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                className="input small-input"
              />
            </label>
            <button onClick={findMatches} className="btn btn-primary" disabled={loading}>
              {loading ? 'Matching...' : 'Refresh Matches'}
            </button>
          </div>
        </div>

        {loading && <div className="loading">Finding matching candidates...</div>}

        {matches.length > 0 && (
          <div className="matches-list">
            {matches.map((match, idx) => (
              <div key={idx} className="match-card">
                <div className="match-header">
                  <div>
                    <h3>
                      <Link to={`/candidates/${match.resumeId}`}>
                        {match.candidateName}
                      </Link>
                    </h3>
                    {match.email && <p className="match-email">{match.email}</p>}
                  </div>
                  <div className="match-score">
                    <div className="score-circle" style={{ 
                      background: `conic-gradient(#667eea ${match.score * 360}deg, #e5e7eb 0deg)` 
                    }}>
                      <div className="score-inner">
                        {(match.score * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="match-details">
                  {match.matchedSkills.length > 0 && (
                    <div className="match-section">
                      <strong>✓ Matched Skills ({match.matchedSkills.length}):</strong>
                      <div className="skills-list">
                        {match.matchedSkills.map((skill, i) => (
                          <span key={i} className="badge badge-success">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.missingSkills.length > 0 && (
                    <div className="match-section">
                      <strong>✗ Missing Skills ({match.missingSkills.length}):</strong>
                      <div className="skills-list">
                        {match.missingSkills.map((skill, i) => (
                          <span key={i} className="badge badge-warning">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.evidence.length > 0 && (
                    <div className="match-section">
                      <strong>Evidence:</strong>
                      {match.evidence.map((evidence, i) => (
                        <div key={i} className="evidence-snippet">
                          {evidence}
                        </div>
                      ))}
                    </div>
                  )}

                  {match.missingRequirements.length > 0 && (
                    <div className="match-section">
                      <strong>Missing Requirements:</strong>
                      <ul className="requirements-list">
                        {match.missingRequirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <p className="no-matches">No matching candidates found. Try uploading more resumes.</p>
        )}
      </div>
    </div>
  );
};

export default JobMatch;

