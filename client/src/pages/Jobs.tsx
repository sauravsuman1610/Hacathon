import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Job } from '../types';
import './Jobs.css';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    skills: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/jobs', {
        params: { limit: 50, offset: 0 }
      });
      setJobs(response.data.items);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
      };

      await api.post('/api/jobs', jobData, {
        headers: {
          'Idempotency-Key': `job-${Date.now()}-${Math.random()}`
        }
      });

      setFormData({ title: '', description: '', requirements: '', skills: '' });
      setShowCreateForm(false);
      loadJobs();
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchCandidates = (jobId: string) => {
    navigate(`/jobs/${jobId}/match`);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Job Listings</h1>
        <p>Browse open positions and match with candidates</p>
      </div>

      {isRecruiter && (
        <div className="card">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Job'}
          </button>

          {showCreateForm && (
            <form onSubmit={handleSubmit} className="job-form">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Senior Full Stack Developer"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="input"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe the role and responsibilities..."
                />
              </div>

              <div className="form-group">
                <label>Requirements (one per line)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="5+ years experience&#10;Bachelor's degree&#10;Strong communication skills"
                />
              </div>

              <div className="form-group">
                <label>Skills (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="React, Node.js, TypeScript, MongoDB"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Job'}
              </button>
            </form>
          )}
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}

      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <h3>{job.title}</h3>
            <p className="job-description">{job.description}</p>

            {job.skills.length > 0 && (
              <div className="job-skills">
                <strong>Skills:</strong>
                {job.skills.map((skill, idx) => (
                  <span key={idx} className="badge badge-primary">{skill}</span>
                ))}
              </div>
            )}

            {job.requirements.length > 0 && (
              <div className="job-requirements">
                <strong>Requirements:</strong>
                <ul>
                  {job.requirements.slice(0, 3).map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                  {job.requirements.length > 3 && (
                    <li>+{job.requirements.length - 3} more...</li>
                  )}
                </ul>
              </div>
            )}

            <p className="job-date">
              Posted: {new Date(job.createdAt).toLocaleDateString()}
            </p>

            {isRecruiter && (
              <button
                onClick={() => handleMatchCandidates(job.id)}
                className="btn btn-primary btn-block"
              >
                Find Matching Candidates
              </button>
            )}
          </div>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            No jobs posted yet. {isRecruiter && 'Create one to get started!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Jobs;

