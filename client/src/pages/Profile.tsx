import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Profile.css';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  linkedin?: string;
  website?: string;
}

const Profile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({});
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isOwnProfile = !id || id === user?.id;

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const endpoint = id ? `/api/profile/${id}` : '/api/profile';
      const response = await api.get(endpoint);
      
      setProfileUser(response.data);
      setProfile(response.data.profile || {});
      
      if (response.data.profile?.profileImage) {
        setImagePreview(response.data.profile.profileImage);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Update profile data
      await api.put('/api/profile', profile);

      // Upload image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await api.post('/api/profile/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setImageFile(null);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>{isOwnProfile ? 'My Profile' : `${profileUser?.profile?.firstName || ''} ${profileUser?.profile?.lastName || ''}`.trim() || 'Profile'}</h1>
        <p>{isOwnProfile ? 'Manage your profile information and settings' : 'View profile information'}</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-image-section">
              <div className="profile-image-container">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="profile-image" />
                ) : (
                  <div className="profile-image-placeholder">
                    <span className="profile-icon">👤</span>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <div className="image-upload">
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  <label htmlFor="profile-image" className="btn btn-secondary btn-sm">
                    {imageFile ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              )}
            </div>
            
            <div className="profile-info">
              <h2>
                {profile.firstName || profile.lastName 
                  ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                  : profileUser?.email
                }
              </h2>
              <p className="user-role">{profileUser?.role}</p>
              <p className="user-email">{profileUser?.email}</p>
            </div>
          </div>

          {isOwnProfile ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="input"
                    value={profile.firstName || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="input"
                    value={profile.lastName || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="input"
                  rows={4}
                  value={profile.bio || ''}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <div className="char-count">
                  {(profile.bio || '').length}/500 characters
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="input"
                    value={profile.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    className="input"
                    value={profile.location || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your location"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="linkedin">LinkedIn</label>
                  <input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    className="input"
                    value={profile.linkedin || ''}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    className="input"
                    value={profile.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {message && (
                <div className={message.type === 'success' ? 'success' : 'error'}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-details">
                {profile.bio && (
                  <div className="detail-section">
                    <h3>Bio</h3>
                    <p>{profile.bio}</p>
                  </div>
                )}

                {profile.location && (
                  <div className="detail-section">
                    <h3>Location</h3>
                    <p>{profile.location}</p>
                  </div>
                )}

                {(profile.linkedin || profile.website) && (
                  <div className="detail-section">
                    <h3>Links</h3>
                    <div className="links">
                      {profile.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="link">
                          LinkedIn
                        </a>
                      )}
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="link">
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
