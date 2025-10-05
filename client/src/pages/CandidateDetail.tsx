import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Resume } from '../types';
import './CandidateDetail.css';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResume();
  }, [id]);

  const loadResume = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/resumes/${id}`);
      setResume(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading candidate information...</div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error || 'Resume not found'}</div>
          <Link to="/search" className="btn btn-secondary">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/search" className="back-link">← Back to Search</Link>

      <div className="candidate-header card">
        <h1>{resume.parsedData.name || 'Unknown Candidate'}</h1>
        {resume.parsedData.email && (
          <p className="contact-info">📧 {resume.parsedData.email}</p>
        )}
        {resume.parsedData.phone && (
          <p className="contact-info">📱 {resume.parsedData.phone}</p>
        )}
        <p className="filename">File: {resume.filename}</p>
      </div>

      {resume.parsedData.summary && (
        <div className="card">
          <h2>Summary</h2>
          <p className="summary-text">{resume.parsedData.summary}</p>
        </div>
      )}

      {resume.parsedData.skills.length > 0 && (
        <div className="card">
          <h2>Skills</h2>
          <div className="skills-container">
            {resume.parsedData.skills.map((skill, idx) => (
              <span key={idx} className="badge badge-primary skill-badge">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {resume.parsedData.experience.length > 0 && (
        <div className="card">
          <h2>Experience</h2>
          <ul className="detail-list">
            {resume.parsedData.experience.map((exp, idx) => (
              <li key={idx}>{exp}</li>
            ))}
          </ul>
        </div>
      )}

      {resume.parsedData.education.length > 0 && (
        <div className="card">
          <h2>Education</h2>
          <ul className="detail-list">
            {resume.parsedData.education.map((edu, idx) => (
              <li key={idx}>{edu}</li>
            ))}
          </ul>
        </div>
      )}

      {resume.content && (
        <div className="card">
          <h2>Full Resume Content</h2>
          <div className="content-preview">
            {resume.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetail;

