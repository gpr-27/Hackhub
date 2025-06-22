import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config/api';

const HealthRecordProfile = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
    bloodType: "",
    height: "",
    weight: "",
    allergies: "",
    chronicConditions: "",
    emergencyContact: "",
    insurance: {
      provider: "",
      policyNumber: "",
      groupNumber: ""
    }
  });

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health-profile`, {
        credentials: 'include'
      });
      if (response.ok) {
        const profile = await response.json();
        if (profile && Object.keys(profile).length > 0) {
          setFormData({
            dateOfBirth: profile.dateOfBirth || "",
            gender: profile.gender || "",
            bloodType: profile.bloodType || "",
            height: profile.height || "",
            weight: profile.weight || "",
            allergies: profile.allergies?.join(", ") || "",
            chronicConditions: profile.chronicConditions?.join(", ") || "",
            emergencyContact: profile.emergencyContact || "",
            insurance: {
              provider: profile.insurance?.provider || "",
              policyNumber: profile.insurance?.policyNumber || "",
              groupNumber: profile.insurance?.groupNumber || ""
            }
          });
        }
      }
    } catch (error) {
      // Error loading health profile
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('insurance.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        insurance: { ...formData.insurance, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      const profileData = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(',').map(item => item.trim()) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map(item => item.trim()) : []
      };

      const response = await fetch(`${API_BASE_URL}/api/health-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        // Failed to save profile
      }
    } catch (error) {
      // Error saving profile
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          .profile-container {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .profile-card {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .profile-header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .profile-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .profile-header p {
            margin: 10px 0 0 0;
            font-size: 1.1rem;
            opacity: 0.9;
          }
          .back-btn {
            position: absolute;
            left: 30px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            font-size: 0.95rem;
          }
          .back-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-50%) translateY(-2px);
          }
          .profile-content {
            padding: 40px;
          }
          .section {
            margin-bottom: 40px;
            background: #ffffff;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 2px solid #e5e7eb;
            position: relative;
          }
          .section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            border-radius: 16px 16px 0 0;
          }
          .section-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #000000;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .form-group {
            display: flex;
            flex-direction: column;
          }
          .form-group label {
            font-weight: 700;
            color: #000000;
            margin-bottom: 8px;
            font-size: 1.05rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          .form-group input,
          .form-group select,
          .form-group textarea {
            padding: 14px 16px;
            border: 2px solid #d1d5db;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 500;
            color: #111827;
            transition: all 0.3s ease;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #4f46e5;
            background: white;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .form-group input::placeholder,
          .form-group textarea::placeholder {
            color: #6b7280;
            font-weight: 400;
          }
          .form-group textarea {
            resize: vertical;
            min-height: 100px;
          }
          .save-btn {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
            display: block;
            margin: 30px auto 0;
                         opacity: 1;
             pointer-events: auto;
          }
          .save-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
          }
          .success-message {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            animation: slideIn 0.3s ease-out;
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .insurance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }
          @media (max-width: 768px) {
            .insurance-grid {
              grid-template-columns: 1fr;
            }
            .form-row {
              grid-template-columns: 1fr;
            }
            .back-btn {
              position: static;
              transform: none;
              margin-bottom: 20px;
            }
            .profile-header {
              text-align: left;
            }
          }
        `}
      </style>
      
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <button className="back-btn" onClick={() => navigate('/smart-health-record')}>
              ← Back to SHR
            </button>
            <h1>👤 Health Profile</h1>
            <p>Manage your personal health information</p>
          </div>
          
          <div className="profile-content">
            {saveSuccess && (
              <div className="success-message">
                ✅ Health profile saved successfully!
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="section">
                <div className="section-title">
                  📋 Basic Information
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Type</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Height (ft/in or cm)</label>
                    <input
                      type="text"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="e.g., 5'8&quot; or 173 cm"
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (lbs or kg)</label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g., 150 lbs or 68 kg"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="section">
                <div className="section-title">
                  🏥 Medical Information
                </div>
                <div className="form-group">
                  <label>Known Allergies</label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="List any allergies (medications, foods, environmental, etc.) separated by commas"
                  />
                </div>
                <div className="form-group">
                  <label>Chronic Conditions</label>
                  <textarea
                    name="chronicConditions"
                    value={formData.chronicConditions}
                    onChange={handleChange}
                    placeholder="List any chronic conditions or ongoing health issues separated by commas"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="section">
                <div className="section-title">
                  🚨 Emergency Contact
                </div>
                <div className="form-group">
                  <label>Primary Emergency Contact</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Name and phone number of emergency contact"
                  />
                </div>
              </div>

              {/* Insurance Information */}
              <div className="section">
                <div className="section-title">
                  🏥 Insurance Information
                </div>
                <div className="insurance-grid">
                  <div className="form-group">
                    <label>Insurance Provider</label>
                    <input
                      type="text"
                      name="insurance.provider"
                      value={formData.insurance.provider}
                      onChange={handleChange}
                      placeholder="e.g., Blue Cross Blue Shield"
                    />
                  </div>
                  <div className="form-group">
                    <label>Policy Number</label>
                    <input
                      type="text"
                      name="insurance.policyNumber"
                      value={formData.insurance.policyNumber}
                      onChange={handleChange}
                      placeholder="Your policy number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Group Number</label>
                    <input
                      type="text"
                      name="insurance.groupNumber"
                      value={formData.insurance.groupNumber}
                      onChange={handleChange}
                      placeholder="Group number (if applicable)"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "💾 Saving..." : "💾 Save Profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default HealthRecordProfile; 