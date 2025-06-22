import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const Prescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    prescribedBy: '',
    prescriptionDate: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prescriptions`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      }
    } catch (error) {
      // Error loading prescriptions
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicationName || !formData.dosage || !formData.frequency) {
      return;
    }

    setLoading(true);
    try {
      const url = editMode 
        ? `${API_BASE_URL}/api/prescriptions/${editingId}`
        : `${API_BASE_URL}/api/prescriptions`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedPrescription = await response.json();
        
        if (editMode) {
          setPrescriptions(prescriptions.map(prescription => 
            prescription._id === editingId ? savedPrescription : prescription
          ));
        } else {
          setPrescriptions([savedPrescription, ...prescriptions]);
        }
        
        resetForm();
                    } else {
        // Failed to save prescription
      }
    } catch (error) {
      // Error saving prescription
    } finally {
      setLoading(false);
    }
  };

  const editPrescription = (prescription) => {
    setFormData({
      medicationName: prescription.medicationName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      prescribedBy: prescription.prescribedBy,
      prescriptionDate: prescription.prescriptionDate ? prescription.prescriptionDate.split('T')[0] : '',
      status: prescription.status,
      notes: prescription.notes
    });
    setEditMode(true);
    setEditingId(prescription._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      prescribedBy: '',
      prescriptionDate: '',
      status: 'active',
      notes: ''
    });
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
  };

  const deletePrescription = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setPrescriptions(prescriptions.filter(prescription => prescription._id !== id));
      } else {
        // Failed to delete prescription
      }
    } catch (error) {
      // Error deleting prescription
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'discontinued': return '#ef4444';
      case 'paused': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'completed': return '✔️';
      case 'discontinued': return '❌';
      case 'paused': return '⏸️';
      default: return '📊';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter and search prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.prescribedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    
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
          .prescriptions-container {
            min-height: 100vh;
            padding: 20px;
          }
          .prescriptions-card {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .prescriptions-header {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .prescriptions-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .prescriptions-header p {
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
          .prescriptions-content {
            padding: 40px;
          }
          .add-prescription-btn {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            margin-bottom: 30px;
          }
          .add-prescription-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
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
            border-color: #f59e0b;
            background: white;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
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
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }
          .prescriptions-section {
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
          .prescriptions-grid {
            display: grid;
            gap: 20px;
          }
          .prescription-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          .prescription-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          }
          .prescription-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 15px;
            flex-wrap: wrap;
          }
          .medication-info {
            flex: 1;
            min-width: 200px;
          }
          .medication-name {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            line-height: 1.3;
          }
          .dosage-info {
            color: #f59e0b;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 4px;
          }
          .frequency-info {
            color: #6b7280;
            font-size: 0.9rem;
            font-weight: 500;
          }
          .status-badge {
            padding: 10px 18px;
            border-radius: 25px;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: white;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
            min-width: fit-content;
          }
          .prescription-details {
            margin: 15px 0;
          }
          .detail-row {
            display: flex;
            margin-bottom: 8px;
          }
          .detail-label {
            font-weight: 500;
            color: #374151;
            min-width: 120px;
          }
          .detail-value {
            color: #6b7280;
          }
          .duration-info {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 12px;
            margin-top: 15px;
          }
          .duration-label {
            font-weight: 600;
            color: #92400e;
            font-size: 0.9rem;
            margin-bottom: 3px;
          }
          .duration-value {
            color: #92400e;
          }
          .prescription-actions {
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
            border-color: #f59e0b;
            background: white;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
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
            border-color: #f59e0b;
            background: white;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
          }
          .no-prescriptions {
            text-align: center;
            background: white;
            border-radius: 16px;
            padding: 60px 40px;
            color: #6b7280;
          }
          .no-prescriptions-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .no-prescriptions h3 {
            font-size: 1.4rem;
            color: #374151;
            margin-bottom: 10px;
          }
          .prescriptions-section {
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
          .prescriptions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
          }
          @media (max-width: 768px) {
            .prescriptions-card {
              margin: 0 10px;
            }
            .prescriptions-header {
              padding: 20px;
            }
            .prescriptions-content {
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
            .search-box input {
              padding: 12px 14px 12px 40px;
              font-size: 0.95rem;
            }
            .search-icon {
              left: 12px;
              font-size: 1rem;
            }
            .filter-select {
              min-width: 100%;
              padding: 12px 14px;
            }
            .prescriptions-grid {
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
      
      <div className="prescriptions-container">
        <div className="prescriptions-card">
          <div className="prescriptions-header">
            <button className="back-btn" onClick={() => navigate('/smart-health-record')}>
              ← Back to SHR
            </button>
            <h1>💊 Prescriptions</h1>
            <p>Manage your medications and prescription history</p>
          </div>
          
          <div className="prescriptions-content">
            <button 
              className="add-prescription-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancel' : '➕ Add Prescription'}
            </button>

            {showForm && (
              <div className="form-container">
                <div className="form-title">
                  {editMode ? '✏️ Edit Prescription' : '💊 Add Prescription'}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Medication Name *</label>
                      <input
                        type="text"
                        name="medicationName"
                        value={formData.medicationName}
                        onChange={handleChange}
                        placeholder="e.g., Lisinopril, Metformin"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Dosage *</label>
                      <input
                        type="text"
                        name="dosage"
                        value={formData.dosage}
                        onChange={handleChange}
                        placeholder="e.g., 10mg, 500mg"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Frequency *</label>
                      <input
                        type="text"
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        placeholder="e.g., Once daily, Twice daily"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration</label>
                      <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="e.g., 30 days, 3 months, Ongoing"
                      />
                    </div>
                    <div className="form-group">
                      <label>Prescribing Doctor</label>
                      <input
                        type="text"
                        name="prescribedBy"
                        value={formData.prescribedBy}
                        onChange={handleChange}
                        placeholder="Dr. Smith"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="discontinued">Discontinued</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date Issued</label>
                      <input
                        type="date"
                        name="prescriptionDate"
                        value={formData.prescriptionDate}
                        onChange={handleChange}
                      />
                    </div>

                  </div>
                  
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Special instructions, side effects, or other notes..."
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
                      {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Prescription' : 'Add Prescription')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {prescriptions.length > 0 && (
              <div className="search-filter-container">
                <div className="search-filter-row">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search medications, dosages, doctors..."
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
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
            )}

            <div className="prescriptions-section">
              <div className="section-title">
                💊 Your Prescriptions ({filteredPrescriptions.length})
              </div>
              
              {prescriptions.length === 0 ? (
                <div className="no-prescriptions">
                  <div className="no-prescriptions-icon">💊</div>
                  <h3>No Prescriptions Yet</h3>
                  <p>Start managing your medications by adding your first prescription above.</p>
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="no-prescriptions">
                  <div className="no-prescriptions-icon">🔍</div>
                  <h3>No Prescriptions Found</h3>
                  <p>Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                <div className="prescriptions-grid">
                  {filteredPrescriptions.map((prescription) => (
                    <div key={prescription._id} className="prescription-card">
                      <div className="prescription-header">
                        <div className="medication-info">
                          <div className="medication-name">{prescription.medicationName}</div>
                          <div className="dosage-info">{prescription.dosage}</div>
                          <div className="frequency-info">{prescription.frequency}</div>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(prescription.status)
                          }}
                        >
                          <span>{getStatusIcon(prescription.status)}</span>
                          {prescription.status}
                        </div>
                      </div>
                      
                      <div className="prescription-details">
                        {prescription.prescribedBy && (
                          <div className="detail-row">
                            <span className="detail-label">Prescribed by:</span>
                            <span className="detail-value">{prescription.prescribedBy}</span>
                          </div>
                        )}
                        {prescription.prescriptionDate && (
                          <div className="detail-row">
                            <span className="detail-label">Date Issued:</span>
                            <span className="detail-value">{formatDate(prescription.prescriptionDate)}</span>
                          </div>
                        )}

                        {prescription.notes && (
                          <div className="detail-row">
                            <span className="detail-label">Notes:</span>
                            <span className="detail-value">{prescription.notes}</span>
                          </div>
                        )}
                        
                        {prescription.duration && (
                          <div className="duration-info">
                            <div className="duration-label">⏱️ Duration</div>
                            <div className="duration-value">{prescription.duration}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="prescription-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => editPrescription(prescription)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deletePrescription(prescription._id)}
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

export default Prescriptions; 