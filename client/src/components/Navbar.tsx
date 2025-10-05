import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          ResumeRAG
        </Link>

        {user && (
          <div className="navbar-menu">
            {user.role === 'candidate' && (
              <Link to="/upload" className="navbar-link">Upload</Link>
            )}
            <Link to="/search" className="navbar-link">Search</Link>
            <Link to="/jobs" className="navbar-link">Jobs</Link>
            
            <div className="navbar-user">
              <Link to="/profile" className="navbar-link">Profile</Link>
              <span className="user-email">{user.email}</span>
              <span className="user-role badge badge-primary">{user.role}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

