import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Upload.css';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': `upload-${Date.now()}-${Math.random()}`
        }
      });

      setMessage({
        type: 'success',
        text: response.data.message || 'Resume uploaded successfully!'
      });
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Upload Resume</h1>
        <p>Upload your resume or multiple resumes in a ZIP file</p>
      </div>

      <div className="card upload-card">
        <form onSubmit={handleUpload}>
          <div className="upload-area">
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.zip"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              <div className="upload-icon">📄</div>
              <div className="upload-text">
                {file ? (
                  <>
                    <strong>{file.name}</strong>
                    <span>Click to change file</span>
                  </>
                ) : (
                  <>
                    <strong>Click to upload</strong>
                    <span>PDF, DOCX, DOC, TXT or ZIP</span>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="upload-info">
            <p><strong>Supported formats:</strong></p>
            <ul>
              <li>PDF (.pdf)</li>
              <li>Word Documents (.docx, .doc)</li>
              <li>Text Files (.txt)</li>
              <li>ZIP archives containing multiple resumes</li>
            </ul>
            <p className="upload-note">Maximum file size: 10MB</p>
          </div>

          {message && (
            <div className={message.type === 'success' ? 'success' : 'error'}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;

