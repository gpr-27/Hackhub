import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import '../styles/ProfileSettings.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    avatar: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/auth/profile`, {
          method: 'GET'
        });

        if (response.ok) {
          const userData = await response.json();
          setUserInfo({
            name: userData.name || '',
            email: userData.email || '',
            avatar: userData.avatar || '',
            phone: userData.phone || '',
            dateOfBirth: userData.dateOfBirth || '',
            gender: userData.gender || '',
            address: userData.address || ''
          });
        } else if (response.status === 401) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (retryCount = 0) => {
    if (!userInfo.name.trim() || !userInfo.email.trim()) {
      setError('Name and email are required');
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      console.log('🔄 Attempting to save profile, attempt:', retryCount + 1);
      
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(userInfo)
      });

      console.log('📡 Profile update response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Profile updated successfully:', responseData);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else if (response.status === 401 && retryCount === 0) {
        console.log('🔄 Authentication failed, retrying once...');
        // Authentication failed, retry once (this fixes the double-click issue)
        setTimeout(() => {
          handleSaveProfile(1);
        }, 500);
        return;
      } else {
        const errorData = await response.json();
        console.error('❌ Profile update failed:', errorData);
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      if (retryCount === 0) {
        console.log('🔄 Network error, retrying once...');
        setTimeout(() => {
          handleSaveProfile(1);
        }, 500);
        return;
      }
      setError('Failed to update profile. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear any previous errors and set loading state
    setError('');
    setIsUploadingPhoto(true);
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      setIsUploadingPhoto(false);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      setIsUploadingPhoto(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Create an image element to resize if needed
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set maximum dimensions
            const maxWidth = 400;
            const maxHeight = 400;
            
            let { width, height } = img;
            
            // Calculate new dimensions
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            setUserInfo(prev => ({
              ...prev,
              avatar: compressedDataUrl
            }));
            
            setMessage('Photo updated! Remember to save changes.');
            setTimeout(() => setMessage(''), 3000);
            setIsUploadingPhoto(false);
          } catch (err) {
            setError('Error processing image');
            setIsUploadingPhoto(false);
          }
        };
        
        img.onerror = () => {
          setError('Error loading image');
          setIsUploadingPhoto(false);
        };
        
        img.src = event.target.result;
      } catch (err) {
        setError('Error reading file');
        setIsUploadingPhoto(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsUploadingPhoto(false);
    };
    
    reader.readAsDataURL(file);
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setUserInfo(prev => ({
      ...prev,
      avatar: ''
    }));
    setMessage('Photo removed! Remember to save changes.');
    setTimeout(() => setMessage(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="profile-settings-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-settings-container">
      <div className="profile-settings-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Profile Settings</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="profile-settings-content">
        <div className="profile-avatar-section">
          <div className="avatar-display">
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                <span className="avatar-icon">👤</span>
              </div>
            )}
          </div>
          <div className="avatar-controls">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            <div className="avatar-buttons">
              <button 
                type="button"
                className="upload-btn"
                onClick={() => document.getElementById('avatar-upload').click()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? '⏳ Processing...' : '📷 Change Photo'}
              </button>
              {userInfo.avatar && (
                <button 
                  type="button"
                  className="remove-btn"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                >
                  🗑️ Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={userInfo.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userInfo.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={userInfo.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={userInfo.dateOfBirth}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={userInfo.gender}
                onChange={handleInputChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={userInfo.address}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter your full address"
              />
            </div>
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings; 