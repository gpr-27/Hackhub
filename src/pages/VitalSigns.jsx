import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const VitalSigns = () => {
  const navigate = useNavigate();
  const [vitals, setVitals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    date: '',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    status: 'normal',
    notes: ''
  });

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vital-signs`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setVitals(data);
      }
    } catch (error) {
      // Error loading vital signs
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      return;
    }

    setLoading(true);
    try {
      const url = editMode 
        ? `${API_BASE_URL}/api/vital-signs/${editingId}`
        : `${API_BASE_URL}/api/vital-signs`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedVital = await response.json();
        
        if (editMode) {
          setVitals(vitals.map(vital => 
            vital._id === editingId ? savedVital : vital
          ));
        } else {
          setVitals([savedVital, ...vitals]);
        }
        
        resetForm();
      }
    } catch (error) {
      // Error saving vital signs
    } finally {
      setLoading(false);
    }
  };

  const editVital = (vital) => {
    // Convert date to datetime-local format (YYYY-MM-DDTHH:MM)
    let dateValue = '';
    if (vital.date) {
      if (vital.date.includes('T')) {
        // Already in datetime format, just take first 16 characters (YYYY-MM-DDTHH:MM)
        dateValue = vital.date.substring(0, 16);
      } else {
        // Just a date, add default time
        dateValue = vital.date + 'T12:00';
      }
    }
    
    setFormData({
      date: dateValue,
      heartRate: vital.heartRate || '',
      systolicBP: vital.systolicBP || '',
      diastolicBP: vital.diastolicBP || '',
      temperature: vital.temperature || '',
      weight: vital.weight || '',
      height: vital.height || '',
      oxygenSaturation: vital.oxygenSaturation || '',
      respiratoryRate: vital.respiratoryRate || '',
      status: vital.status || 'normal',
      notes: vital.notes || ''
    });
    setEditMode(true);
    setEditingId(vital._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: '',
      heartRate: '',
      systolicBP: '',
      diastolicBP: '',
      temperature: '',
      weight: '',
      height: '',
      oxygenSaturation: '',
      respiratoryRate: '',
      status: 'normal',
      notes: ''
    });
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
  };

  const deleteVital = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vital signs record?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/vital-signs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setVitals(vitals.filter(vital => vital._id !== id));
      } else {
        // Failed to delete vital signs record
      }
    } catch (error) {
      // Error deleting vital signs
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getVitalColor = (type, value) => {
    if (!value) return '#6b7280';
    
    const numValue = parseFloat(value);
    switch (type) {
      case 'heartRate':
        if (numValue < 60 || numValue > 100) return '#ef4444';
        return '#10b981';
      case 'systolicBP':
        if (numValue < 90 || numValue > 140) return '#ef4444';
        if (numValue > 120) return '#f59e0b';
        return '#10b981';
      case 'diastolicBP':
        if (numValue < 60 || numValue > 90) return '#ef4444';
        if (numValue > 80) return '#f59e0b';
        return '#10b981';
      case 'temperature':
        if (numValue < 97 || numValue > 99.5) return '#ef4444';
        return '#10b981';
      case 'oxygenSaturation':
        if (numValue < 95) return '#ef4444';
        if (numValue < 98) return '#f59e0b';
        return '#10b981';
      case 'respiratoryRate':
        if (numValue < 12 || numValue > 20) return '#ef4444';
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return '#10b981';
      case 'abnormal': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal': return '✅';
      case 'abnormal': return '⚠️';
      default: return '📊';
    }
  };

  // Filter and search vitals
  const filteredVitals = vitals.filter(vital => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (vital.notes && vital.notes.toLowerCase().includes(searchLower)) ||
                         (vital.heartRate && vital.heartRate.toString().includes(searchLower)) ||
                         (vital.systolicBP && vital.systolicBP.toString().includes(searchLower)) ||
                         (vital.diastolicBP && vital.diastolicBP.toString().includes(searchLower)) ||
                         (vital.temperature && vital.temperature.toString().includes(searchLower));
    
    const matchesStatus = filterStatus === 'all' || vital.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .vitals-container {
            min-height: 100vh;
            padding: 20px;
          }
          .vitals-card {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .vitals-header {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .vitals-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .vitals-header p {
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
          .vitals-content {
            padding: 40px;
          }
          .add-vital-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
            margin-bottom: 30px;
          }
          .add-vital-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
          }
          .form-container {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          .form-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .form-group {
            display: flex;
            flex-direction: column;
          }
          .form-group label {
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;
            font-size: 0.95rem;
          }
          .form-group input,
          .form-group textarea {
            padding: 14px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #f9fafb;
          }
          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #ef4444;
            background: white;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
          }
          .form-group textarea {
            resize: vertical;
            min-height: 100px;
          }
          .vital-input {
            position: relative;
          }
          .unit-label {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #6b7280;
            font-size: 0.9rem;
            pointer-events: none;
          }
          .form-actions {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 25px;
          }
          .cancel-btn {
            background: #f3f4f6;
            color: #374151;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
          }
          .cancel-btn:hover {
            background: #e5e7eb;
          }
          .submit-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }
          .vitals-section {
            margin-top: 40px;
          }
          .section-title {
            font-size: 1.6rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .vitals-grid {
            display: grid;
            gap: 20px;
          }
          .vital-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          .vital-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          }
          .vital-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 15px;
            flex-wrap: wrap;
          }
          .status-badge {
            padding: 8px 14px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: white;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
            min-width: fit-content;
          }
          .vital-date {
            font-size: 1.2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .vital-time {
            color: #6b7280;
            font-size: 0.9rem;
            font-weight: 500;
          }
          .vital-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .metric {
            background: #f8fafc;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            border-left: 4px solid transparent;
          }
          .metric-label {
            font-size: 0.85rem;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 3px;
          }
          .metric-unit {
            font-size: 0.8rem;
            color: #6b7280;
          }
          .blood-pressure {
            grid-column: 1 / -1;
            background: #fef2f2;
            border-left-color: #ef4444;
          }
          .vital-notes {
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 12px;
            margin-top: 15px;
          }
          .notes-label {
            font-weight: 600;
            color: #1e40af;
            font-size: 0.9rem;
            margin-bottom: 5px;
          }
          .notes-content {
            color: #1e40af;
            line-height: 1.5;
          }
          .vital-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #f3f4f6;
          }
          .delete-btn {
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s;
          }
          .delete-btn:hover {
            background: #dc2626;
            transform: translateY(-1px);
          }
          .edit-btn {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            margin-right: 10px;
          }
          .edit-btn:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
            transform: translateY(-1px);
          }
          .search-filter-container {
            background: white;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          .search-filter-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            align-items: center;
          }
          .search-box {
            position: relative;
            width: 100%;
          }
          .search-box input {
            width: 100%;
            padding: 14px 16px 14px 45px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            background: #f9fafb;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }
          .search-box input:focus {
            outline: none;
            border-color: #ef4444;
            background: white;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
          }
                      .search-icon {
              position: absolute;
              left: 15px;
              top: 50%;
              transform: translateY(-50%);
              color: #6b7280;
              font-size: 1.1rem;
              z-index: 1;
            }
            .filter-select {
              padding: 12px 16px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              font-size: 1rem;
              background: #f9fafb;
              cursor: pointer;
              transition: all 0.3s ease;
              min-width: 150px;
              box-sizing: border-box;
            }
            .filter-select:focus {
              outline: none;
              border-color: #ef4444;
              background: white;
              box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
            }
          .no-vitals {
            text-align: center;
            background: white;
            border-radius: 16px;
            padding: 60px 40px;
            color: #6b7280;
          }
          .no-vitals-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .no-vitals h3 {
            font-size: 1.4rem;
            color: #374151;
            margin-bottom: 10px;
          }
          @media (max-width: 768px) {
            .vitals-card {
              margin: 0 10px;
            }
            .vitals-header {
              padding: 20px;
            }
            .vitals-content {
              padding: 20px;
            }
            .search-filter-container {
              padding: 20px;
              margin-bottom: 20px;
            }
            .search-filter-row {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            .filter-select {
              min-width: 100%;
              padding: 12px 14px;
            }
            .search-box input {
              padding: 12px 14px 12px 40px;
              font-size: 0.95rem;
            }
            .search-icon {
              left: 12px;
              font-size: 1rem;
            }
            .vitals-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            .back-btn {
              position: static;
              transform: none;
              margin-bottom: 15px;
            }
            .form-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      
      <div className="vitals-container">
        <div className="vitals-card">
          <div className="vitals-header">
            <button className="back-btn" onClick={() => navigate('/smart-health-record')}>
              ← Back to SHR
            </button>
            <h1>📈 Vital Signs</h1>
            <p>Track your health metrics and vital signs over time</p>
          </div>
          
          <div className="vitals-content">
            <button 
              className="add-vital-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancel' : '➕ Record Vital Signs'}
            </button>

            {showForm && (
              <div className="form-container">
                <div className="form-title">
                  {editMode ? '✏️ Edit Vital Signs' : '📈 Record Vital Signs'}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date & Time *</label>
                      <input
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Heart Rate</label>
                      <div className="vital-input">
                        <input
                          type="number"
                          name="heartRate"
                          value={formData.heartRate}
                          onChange={handleChange}
                          placeholder="72"
                          min="30"
                          max="220"
                        />
                        <span className="unit-label">bpm</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Systolic BP</label>
                      <div className="vital-input">
                        <input
                          type="number"
                          name="systolicBP"
                          value={formData.systolicBP}
                          onChange={handleChange}
                          placeholder="120"
                          min="60"
                          max="250"
                        />
                        <span className="unit-label">mmHg</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Diastolic BP</label>
                      <div className="vital-input">
                        <input
                          type="number"
                          name="diastolicBP"
                          value={formData.diastolicBP}
                          onChange={handleChange}
                          placeholder="80"
                          min="40"
                          max="150"
                        />
                        <span className="unit-label">mmHg</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Temperature</label>
                      <div className="vital-input">
                        <input
                          type="number"
                          name="temperature"
                          value={formData.temperature}
                          onChange={handleChange}
                          placeholder="98.6"
                          step="0.1"
                          min="90"
                          max="110"
                        />
                        <span className="unit-label">°F</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Oxygen Saturation</label>
                      <div className="vital-input">
                        <input
                          type="number"
                          name="oxygenSaturation"
                          value={formData.oxygenSaturation}
                          onChange={handleChange}
                          placeholder="98"
                          min="70"
                          max="100"
                        />
                        <span className="unit-label">%</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Respiratory Rate</label>
                      <div className="vital-input">
                        <input
                          type="number"
                          name="respiratoryRate"
                          value={formData.respiratoryRate}
                          onChange={handleChange}
                          placeholder="16"
                          min="5"
                          max="60"
                        />
                        <span className="unit-label">breaths/min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Weight</label>
                      <div className="vital-input">
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="150"
                          step="0.1"
                          min="50"
                          max="500"
                        />
                        <span className="unit-label">lbs</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Height</label>
                      <div className="vital-input">
                        <input
                          type="text"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          placeholder="5'8&quot;"
                        />
                        <span className="unit-label">ft/in</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="normal">Normal</option>
                      <option value="abnormal">Abnormal</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional observations, symptoms, or context..."
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={loading}
                    >
                      {loading ? (editMode ? 'Updating...' : 'Recording...') : (editMode ? 'Update Vitals' : 'Record Vitals')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {vitals.length > 0 && (
              <div className="search-filter-container">
                <div className="search-filter-row">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search vital signs, notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="normal">Normal</option>
                    <option value="abnormal">Abnormal</option>
                  </select>
                </div>
              </div>
            )}

            <div className="vitals-section">
              <div className="section-title">
                📊 Your Vital Signs History ({filteredVitals.length})
              </div>
              
              {vitals.length === 0 ? (
                <div className="no-vitals">
                  <div className="no-vitals-icon">📈</div>
                  <h3>No Vital Signs Recorded</h3>
                  <p>Start tracking your health by recording your first vital signs above.</p>
                </div>
              ) : filteredVitals.length === 0 ? (
                <div className="no-vitals">
                  <div className="no-vitals-icon">🔍</div>
                  <h3>No Vital Signs Found</h3>
                  <p>Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="vitals-grid">
                  {filteredVitals.map((vital) => (
                    <div key={vital._id} className="vital-card">
                      <div className="vital-header">
                        <div>
                          <div className="vital-date">{formatDate(vital.date)}</div>
                          <div className="vital-time">{formatTime(vital.date)}</div>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(vital.status)
                          }}
                        >
                          <span>{getStatusIcon(vital.status)}</span>
                          {vital.status}
                        </div>
                      </div>
                      
                      <div className="vital-metrics">
                        {vital.heartRate && (
                          <div className="metric" style={{ borderLeftColor: getVitalColor('heartRate', vital.heartRate) }}>
                            <div className="metric-label">Heart Rate</div>
                            <div className="metric-value" style={{ color: getVitalColor('heartRate', vital.heartRate) }}>
                              {vital.heartRate}
                            </div>
                            <div className="metric-unit">bpm</div>
                          </div>
                        )}
                        
                        {(vital.systolicBP || vital.diastolicBP) && (
                          <div className="blood-pressure">
                            <div className="metric-label">Blood Pressure</div>
                            <div className="metric-value" style={{ color: '#ef4444' }}>
                              {vital.systolicBP || '--'}/{vital.diastolicBP || '--'}
                            </div>
                            <div className="metric-unit">mmHg</div>
                          </div>
                        )}
                        
                        {vital.temperature && (
                          <div className="metric" style={{ borderLeftColor: getVitalColor('temperature', vital.temperature) }}>
                            <div className="metric-label">Temperature</div>
                            <div className="metric-value" style={{ color: getVitalColor('temperature', vital.temperature) }}>
                              {vital.temperature}
                            </div>
                            <div className="metric-unit">°F</div>
                          </div>
                        )}
                        
                        {vital.oxygenSaturation && (
                          <div className="metric" style={{ borderLeftColor: getVitalColor('oxygenSaturation', vital.oxygenSaturation) }}>
                            <div className="metric-label">Oxygen Sat</div>
                            <div className="metric-value" style={{ color: getVitalColor('oxygenSaturation', vital.oxygenSaturation) }}>
                              {vital.oxygenSaturation}
                            </div>
                            <div className="metric-unit">%</div>
                          </div>
                        )}
                        
                        {vital.respiratoryRate && (
                          <div className="metric" style={{ borderLeftColor: getVitalColor('respiratoryRate', vital.respiratoryRate) }}>
                            <div className="metric-label">Respiratory Rate</div>
                            <div className="metric-value" style={{ color: getVitalColor('respiratoryRate', vital.respiratoryRate) }}>
                              {vital.respiratoryRate}
                            </div>
                            <div className="metric-unit">breaths/min</div>
                          </div>
                        )}
                        
                        {vital.weight && (
                          <div className="metric">
                            <div className="metric-label">Weight</div>
                            <div className="metric-value">{vital.weight}</div>
                            <div className="metric-unit">lbs</div>
                          </div>
                        )}
                        
                        {vital.height && (
                          <div className="metric">
                            <div className="metric-label">Height</div>
                            <div className="metric-value">{vital.height}</div>
                            <div className="metric-unit">ft/in</div>
                          </div>
                        )}
                      </div>
                      
                      {vital.notes && (
                        <div className="vital-notes">
                          <div className="notes-label">📝 Notes</div>
                          <div className="notes-content">{vital.notes}</div>
                        </div>
                      )}
                      
                      <div className="vital-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => editVital(vital)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteVital(vital._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VitalSigns; 