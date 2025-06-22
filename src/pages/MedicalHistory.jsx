import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const MedicalHistory = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    condition: '',
    diagnosisDate: '',
    doctor: '',
    treatment: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/medical-history`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      // Error loading medical history
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.condition || !formData.diagnosisDate) {
      return;
    }

    setLoading(true);
    try {
      const url = editMode 
        ? `${API_BASE_URL}/api/medical-history/${editingId}`
        : `${API_BASE_URL}/api/medical-history`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedRecord = await response.json();
        
        if (editMode) {
          setRecords(records.map(record => 
            record._id === editingId ? savedRecord : record
          ));
        } else {
          setRecords([savedRecord, ...records]);
        }
        
        resetForm();
      } else {
        // Failed to save record
      }
    } catch (error) {
      // Error saving record
    } finally {
      setLoading(false);
    }
  };

  const editRecord = (record) => {
    setFormData({
      condition: record.condition,
      diagnosisDate: record.diagnosisDate.split('T')[0],
      doctor: record.doctor,
      treatment: record.treatment,
      status: record.status,
      notes: record.notes
    });
    setEditMode(true);
    setEditingId(record._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      condition: '',
      diagnosisDate: '',
      doctor: '',
      treatment: '',
      status: 'active',
      notes: ''
    });
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/medical-history/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setRecords(records.filter(record => record._id !== id));
      } else {
        // Failed to delete record
      }
    } catch (error) {
      // Error deleting record
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#ef4444';
      case 'resolved': return '#10b981';
      case 'chronic': return '#f59e0b';
      case 'monitoring': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter and search records
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
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
          .medical-container {
            min-height: 100vh;
            padding: 20px;
          }
          .medical-card {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .medical-header {
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .medical-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .medical-header p {
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
          .medical-content {
            padding: 40px;
          }
          .add-record-btn {
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
            margin-bottom: 30px;
          }
          .add-record-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
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
            border-color: #059669;
            background: white;
            box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
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
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }
          .records-section {
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
          .records-grid {
            display: grid;
            gap: 20px;
          }
          .record-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          .record-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          }
          .record-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 15px;
            flex-wrap: wrap;
          }
          .condition-name {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            line-height: 1.3;
          }
          .diagnosis-date {
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
          .record-details {
            margin: 15px 0;
          }
          .detail-row {
            display: flex;
            margin-bottom: 8px;
          }
          .detail-label {
            font-weight: 500;
            color: #374151;
            min-width: 100px;
          }
          .detail-value {
            color: #6b7280;
          }
          .record-actions {
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
            border-color: #10b981;
            background: white;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
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
            border-color: #10b981;
            background: white;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
          }
          .no-records {
            text-align: center;
            background: white;
            border-radius: 16px;
            padding: 60px 40px;
            color: #6b7280;
          }
          .no-records-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .no-records h3 {
            font-size: 1.4rem;
            color: #374151;
            margin-bottom: 10px;
          }
          .records-section {
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
          .records-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
          }
          @media (max-width: 768px) {
            .medical-card {
              margin: 0 10px;
            }
            .medical-header {
              padding: 20px;
            }
            .medical-content {
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
            .records-grid {
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
      
      <div className="medical-container">
        <div className="medical-card">
          <div className="medical-header">
            <button className="back-btn" onClick={() => navigate('/smart-health-record')}>
              ← Back to SHR
            </button>
            <h1>📋 Medical History</h1>
            <p>Track your medical conditions and treatments</p>
          </div>
          
          <div className="medical-content">
            <button 
              className="add-record-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancel' : '➕ Add Medical Record'}
            </button>

            {showForm && (
              <div className="form-container">
                <div className="form-title">
                  {editMode ? '✏️ Edit Medical Record' : '📝 Add Medical Record'}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Medical Condition *</label>
                      <input
                        type="text"
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        placeholder="e.g., Hypertension, Diabetes"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Diagnosis Date *</label>
                      <input
                        type="date"
                        name="diagnosisDate"
                        value={formData.diagnosisDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Doctor/Healthcare Provider</label>
                      <input
                        type="text"
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleChange}
                        placeholder="Dr. Smith, Cardiology"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="chronic">Chronic</option>
                        <option value="monitoring">Monitoring</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Treatment</label>
                      <input
                        type="text"
                        name="treatment"
                        value={formData.treatment}
                        onChange={handleChange}
                        placeholder="Medication, therapy, surgery, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional information, symptoms, or observations..."
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
                      {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Record' : 'Add Record')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {records.length > 0 && (
              <div className="search-filter-container">
                <div className="search-filter-row">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search conditions, doctors, treatments..."
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
                    <option value="resolved">Resolved</option>
                    <option value="chronic">Chronic</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
              </div>
            )}

            <div className="records-section">
              <div className="section-title">
                📚 Your Medical Records ({filteredRecords.length})
              </div>
              
              {records.length === 0 ? (
                <div className="no-records">
                  <div className="no-records-icon">🏥</div>
                  <h3>No Medical Records Yet</h3>
                  <p>Start building your medical history by adding your first record above.</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="no-records">
                  <div className="no-records-icon">🔍</div>
                  <h3>No Records Found</h3>
                  <p>Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                <div className="records-grid">
                  {filteredRecords.map((record) => (
                    <div key={record._id} className="record-card">
                      <div className="record-header">
                        <div>
                          <div className="condition-name">{record.condition}</div>
                          <div className="diagnosis-date">
                            Diagnosed: {formatDate(record.diagnosisDate)}
                          </div>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(record.status)
                          }}
                        >
                          {record.status}
                        </div>
                      </div>
                      
                      <div className="record-details">
                        {record.doctor && (
                          <div className="detail-row">
                            <span className="detail-label">Doctor:</span>
                            <span className="detail-value">{record.doctor}</span>
                          </div>
                        )}
                        {record.treatment && (
                          <div className="detail-row">
                            <span className="detail-label">Treatment:</span>
                            <span className="detail-value">{record.treatment}</span>
                          </div>
                        )}
                        {record.notes && (
                          <div className="detail-row">
                            <span className="detail-label">Notes:</span>
                            <span className="detail-value">{record.notes}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="record-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => editRecord(record)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteRecord(record._id)}
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

export default MedicalHistory; 