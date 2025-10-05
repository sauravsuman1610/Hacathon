import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero">
        <h1 className="hero-title">Welcome to ResumeRAG</h1>
        <p className="hero-subtitle">
          Smart Resume Search & Job Matching powered by AI
        </p>
        
        <div className="features-grid">
          {user?.role === 'candidate' && (
            <div className="feature-card">
              <div className="feature-icon">📤</div>
              <h3>Upload Resumes</h3>
              <p>Upload single or multiple resumes in PDF, DOCX, or ZIP format</p>
              <Link to="/upload" className="btn btn-primary">Upload Now</Link>
            </div>
          )}

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Smart Search</h3>
            <p>Search through resumes with natural language queries</p>
            {user && <Link to="/search" className="btn btn-primary">Search Resumes</Link>}
          </div>

          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>Job Matching</h3>
            <p>Match candidates with job requirements automatically</p>
            {user && <Link to="/jobs" className="btn btn-primary">View Jobs</Link>}
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="container">
          <h2>Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <div>
                <h4>Document Parsing</h4>
                <p>Automatically extract skills, experience, and education from resumes</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <div>
                <h4>Semantic Search</h4>
                <p>Find resumes using natural language questions and get relevant snippets</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <div>
                <h4>Candidate Matching</h4>
                <p>Match candidates to job descriptions with skill analysis and evidence</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <div>
                <h4>Role-Based Access</h4>
                <p>Different permissions for candidates and recruiters with PII protection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="cta-section">
          <h2>Get Started Today</h2>
          <p>Create an account to start uploading and searching resumes</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-large">Sign Up</Link>
            <Link to="/login" className="btn btn-secondary btn-large">Sign In</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

