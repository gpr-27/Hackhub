import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';

const DoctorVisits = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    doctorName: '',
    specialty: '',
    visitDate: '',
    visitType: 'routine',
    status: 'completed',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    nextAppointment: '',
    notes: ''
  });

  useEffect(() => {
    const fetchDoctorVisits = async () => {
      try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/doctor-visits`, {
          method: 'GET'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch doctor visits');
        }
        
        const data = await response.json();
        setVisits(data);
      } catch (error) {
        console.error('Error fetching doctor visits:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorVisits();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorName || !formData.visitDate) {
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editMode) {
        response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/doctor-visits/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/doctor-visits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (response.ok) {
        const visitData = await response.json();
        if (editMode) {
          setVisits(visits.map(visit => 
            visit._id === editingId ? visitData : visit
          ));
        } else {
          setVisits([visitData, ...visits]);
        }
        resetForm();
      } else {
        // Failed to save visit record
      }
    } catch (error) {
      // Error saving visit record
    } finally {
      setLoading(false);
    }
  };

  const editVisit = (visit) => {
    setFormData({
      doctorName: visit.doctorName,
      specialty: visit.specialty || '',
      visitDate: visit.visitDate ? visit.visitDate.split('T')[0] : '',
      visitType: visit.visitType,
      status: visit.status,
      symptoms: visit.symptoms || '',
      diagnosis: visit.diagnosis || '',
      treatment: visit.treatment || '',
      nextAppointment: visit.nextAppointment ? visit.nextAppointment.split('T')[0] : '',
      notes: visit.notes || ''
    });
    setEditMode(true);
    setEditingId(visit._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      doctorName: '',
      specialty: '',
      visitDate: '',
      visitType: 'routine',
      status: 'completed',
      symptoms: '',
      diagnosis: '',
      treatment: '',
      nextAppointment: '',
      notes: ''
    });
    setEditMode(false);
    setEditingId(null);
    setShowForm(false);
  };

  const deleteVisit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visit record?')) return;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/doctor-visits/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVisits(visits.filter(visit => visit._id !== id));
      } else {
        // Failed to delete visit record
      }
    } catch (error) {
      // Error deleting visit
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getVisitTypeColor = (type) => {
    switch (type) {
      case 'routine': return '#10b981';
      case 'emergency': return '#ef4444';
      case 'follow-up': return '#3b82f6';
      case 'consultation': return '#8b5cf6';
      case 'specialist': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getVisitTypeIcon = (type) => {
    switch (type) {
      case 'routine': return '📅';
      case 'emergency': return '🚨';
      case 'follow-up': return '🔄';
      case 'consultation': return '💬';
      case 'specialist': return '👨‍⚕️';
      default: return '🏥';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'scheduled': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'rescheduled': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'scheduled': return '📅';
      case 'cancelled': return '❌';
      case 'rescheduled': return '🔄';
      default: return '📊';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter visits based on search term and status
  const filteredVisits = visits.filter(visit => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      visit.doctorName.toLowerCase().includes(searchLower) ||
      (visit.specialty && visit.specialty.toLowerCase().includes(searchLower)) ||
      (visit.symptoms && visit.symptoms.toLowerCase().includes(searchLower)) ||
      (visit.diagnosis && visit.diagnosis.toLowerCase().includes(searchLower)) ||
      (visit.treatment && visit.treatment.toLowerCase().includes(searchLower)) ||
      (visit.notes && visit.notes.toLowerCase().includes(searchLower))
    );
    
    const matchesStatus = filterStatus === 'all' || visit.status === filterStatus;
    
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
          .visits-container {
            min-height: 100vh;
            padding: 20px;
          }
          .visits-card {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .visits-header {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .visits-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .visits-header p {
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
          .visits-content {
            padding: 40px;
          }
          .add-visit-btn {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            margin-bottom: 30px;
          }
          .add-visit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
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
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
          .form-group select,
          .form-group textarea {
            padding: 14px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #f9fafb;
          }
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #8b5cf6;
            background: white;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          }
          .form-group textarea {
            resize: vertical;
            min-height: 100px;
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
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }
          .visits-section {
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
          .visits-grid {
            display: grid;
            gap: 20px;
          }
          .visit-card {
            background: linear-gradient(135deg, #ffffff, #f8fafc);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(139, 92, 246, 0.1);
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
          }
          .visit-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc);
            border-radius: 20px 20px 0 0;
          }
          .visit-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 48px rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.2);
          }
          .visit-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 15px;
            flex-wrap: wrap;
          }
          .doctor-info {
            flex: 1;
            min-width: 200px;
          }
          .doctor-name {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            line-height: 1.3;
          }
          .doctor-specialty {
            color: #8b5cf6;
            font-weight: 600;
            font-size: 0.95rem;
            padding: 4px 12px;
            background: rgba(139, 92, 246, 0.1);
            border-radius: 12px;
            display: inline-block;
            margin-bottom: 8px;
          }
          .visit-date {
            color: #6b7280;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .visit-date::before {
            content: '📅';
            font-size: 1rem;
          }
          .visit-badges {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
          }
          .visit-type-badge {
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
          .visit-details {
            margin: 15px 0;
          }
          .detail-section {
            margin-bottom: 18px;
            padding: 15px;
            background: rgba(139, 92, 246, 0.03);
            border-radius: 12px;
            border-left: 4px solid #8b5cf6;
          }
          .detail-label {
            font-weight: 700;
            color: #374151;
            margin-bottom: 8px;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .detail-label::before {
            content: '▶';
            color: #8b5cf6;
            font-size: 0.8rem;
          }
          .detail-value {
            color: #4b5563;
            line-height: 1.6;
            font-size: 0.95rem;
            padding-left: 16px;
            border-left: 2px solid rgba(139, 92, 246, 0.2);
          }
          .next-appointment {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 2px solid #3b82f6;
            border-radius: 16px;
            padding: 20px;
            margin-top: 20px;
            position: relative;
            overflow: hidden;
          }
          .next-appointment::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8, #1e40af);
          }
          .next-appointment-label {
            font-weight: 700;
            color: #1e40af;
            font-size: 1rem;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .next-appointment-date {
            color: #1e40af;
            font-size: 1.1rem;
            font-weight: 600;
            margin-left: 8px;
          }
          .visit-actions {
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
            border-color: #8b5cf6;
            background: white;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
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
            border-color: #8b5cf6;
            background: white;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          }
          .no-visits {
            text-align: center;
            background: white;
            border-radius: 16px;
            padding: 60px 40px;
            color: #6b7280;
          }
          .no-visits-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .no-visits h3 {
            font-size: 1.4rem;
            color: #374151;
            margin-bottom: 10px;
          }
          .visits-section {
            margin-top: 0;
          }
          .section-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .visits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
          }
          @media (max-width: 768px) {
            .visits-card {
              margin: 0 10px;
            }
            .visits-header {
              padding: 20px;
            }
            .visits-content {
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
            .visits-grid {
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
      
      <div className="visits-container">
        <div className="visits-card">
          <div className="visits-header">
            <button className="back-btn" onClick={() => navigate('/smart-health-record')}>
              ← Back to SHR
            </button>
            <h1>🩺 Doctor Visits</h1>
            <p>Keep track of your medical appointments and consultations</p>
          </div>
          
          <div className="visits-content">
            <button 
              className="add-visit-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancel' : '➕ Add Doctor Visit'}
            </button>

            {showForm && (
              <div className="form-container">
                <div className="form-title">
                  🩺 {editMode ? 'Edit Doctor Visit' : 'Add Doctor Visit'}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Doctor Name *</label>
                      <input
                        type="text"
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleChange}
                        placeholder="Dr. Smith"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Specialty</label>
                      <input
                        type="text"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleChange}
                        placeholder="e.g., Cardiology, Internal Medicine"
                      />
                    </div>
                    <div className="form-group">
                      <label>Visit Date *</label>
                      <input
                        type="date"
                        name="visitDate"
                        value={formData.visitDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Visit Type</label>
                      <select
                        name="visitType"
                        value={formData.visitType}
                        onChange={handleChange}
                      >
                        <option value="routine">Routine Checkup</option>
                        <option value="emergency">Emergency</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="consultation">Consultation</option>
                        <option value="specialist">Specialist Visit</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="completed">Completed</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Next Appointment</label>
                      <input
                        type="date"
                        name="nextAppointment"
                        value={formData.nextAppointment}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Symptoms/Reason for Visit</label>
                    <textarea
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleChange}
                      placeholder="Describe symptoms or reason for the visit..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Diagnosis</label>
                    <textarea
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleChange}
                      placeholder="Doctor's diagnosis or findings..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Treatment/Recommendations</label>
                    <textarea
                      name="treatment"
                      value={formData.treatment}
                      onChange={handleChange}
                      placeholder="Prescribed treatments, medications, or recommendations..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional notes or observations..."
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
                      {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Visit' : 'Add Visit')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {visits.length > 0 && (
              <div className="search-filter-container">
                <div className="search-filter-row">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search doctor visits, symptoms, diagnosis..."
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
                    <option value="completed">Completed</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>
            )}

            <div className="visits-section">
              <div className="section-title">
                📋 Your Doctor Visits ({filteredVisits.length})
              </div>
              
              {visits.length === 0 ? (
                <div className="no-visits">
                  <div className="no-visits-icon">🩺</div>
                  <h3>No Doctor Visits Recorded</h3>
                  <p>Start tracking your medical appointments by adding your first visit above.</p>
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="no-visits">
                  <div className="no-visits-icon">🔍</div>
                  <h3>No Visits Found</h3>
                  <p>Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="visits-grid">
                  {filteredVisits.map((visit) => (
                    <div key={visit._id} className="visit-card">
                      <div className="visit-header">
                        <div className="doctor-info">
                          <div className="doctor-name">{visit.doctorName}</div>
                          {visit.specialty && (
                            <div className="doctor-specialty">{visit.specialty}</div>
                          )}
                          <div className="visit-date">
                            Visit Date: {formatDate(visit.visitDate)}
                          </div>
                        </div>
                        <div className="visit-badges">
                          <div 
                            className="visit-type-badge"
                            style={{ 
                              backgroundColor: getVisitTypeColor(visit.visitType)
                            }}
                          >
                            <span>{getVisitTypeIcon(visit.visitType)}</span>
                            {visit.visitType}
                          </div>
                          <div 
                            className="status-badge"
                            style={{ 
                              backgroundColor: getStatusColor(visit.status)
                            }}
                          >
                            <span>{getStatusIcon(visit.status)}</span>
                            {visit.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="visit-details">
                        {visit.symptoms && (
                          <div className="detail-section">
                            <div className="detail-label">Symptoms/Reason</div>
                            <div className="detail-value">{visit.symptoms}</div>
                          </div>
                        )}
                        
                        {visit.diagnosis && (
                          <div className="detail-section">
                            <div className="detail-label">Diagnosis</div>
                            <div className="detail-value">{visit.diagnosis}</div>
                          </div>
                        )}
                        
                        {visit.treatment && (
                          <div className="detail-section">
                            <div className="detail-label">Treatment/Recommendations</div>
                            <div className="detail-value">{visit.treatment}</div>
                          </div>
                        )}
                        
                        {visit.notes && (
                          <div className="detail-section">
                            <div className="detail-label">Additional Notes</div>
                            <div className="detail-value">{visit.notes}</div>
                          </div>
                        )}
                        
                        {visit.nextAppointment && (
                          <div className="next-appointment">
                            <div className="next-appointment-label">📅 Next Appointment</div>
                            <div className="next-appointment-date">
                              {formatDate(visit.nextAppointment)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="visit-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => editVisit(visit)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteVisit(visit._id)}
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

export default DoctorVisits; 