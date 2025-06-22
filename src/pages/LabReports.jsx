import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';

const LabReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    testName: '',
    testDate: '',
    results: '',
    normalRange: '',
    status: 'normal',
    doctor: '',
    notes: ''
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lab-reports`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      // Error loading lab reports
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.testName || !formData.testDate || !formData.results) {
      return;
    }

    setLoading(true);
    try {
      const url = editMode 
        ? `${API_BASE_URL}/api/lab-reports/${editingId}`
        : `${API_BASE_URL}/api/lab-reports`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedReport = await response.json();
        
        if (editMode) {
          setReports(reports.map(report => 
            report._id === editingId ? savedReport : report
          ));
        } else {
          setReports([savedReport, ...reports]);
        }
        
        resetForm();
                    } else {
        // Failed to save lab report
      }
    } catch (error) {
      // Error saving lab report
    } finally {
      setLoading(false);
    }
  };

  const editReport = (report) => {
    setFormData({
      testName: report.testName,
      testDate: report.testDate.split('T')[0],
      results: report.results,
      normalRange: report.normalRange,
      status: report.status,
      doctor: report.doctor,
      notes: report.notes
    });
    setEditMode(true);
    setEditingId(report._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      testName: '',
      testDate: '',
      results: '',
      normalRange: '',
      status: 'normal',
      doctor: '',
      notes: ''
    });
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
  };

  const deleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lab report?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/lab-reports/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setReports(reports.filter(report => report._id !== id));
      } else {
        // Failed to delete lab report
      }
    } catch (error) {
      // Error deleting lab report
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return '#10b981';
      case 'abnormal': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal': return '✅';
      case 'abnormal': return '⚠️';
      case 'pending': return '⏳';
      case 'critical': return '🚨';
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

  // Filter and search reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.results.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
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
          .lab-container {
            min-height: 100vh;
            padding: 20px;
          }
          .lab-card {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .lab-header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .lab-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .lab-header p {
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
          .lab-content {
            padding: 40px;
          }
          .add-report-btn {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            margin-bottom: 30px;
          }
          .add-report-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
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
            border-color: #3b82f6;
            background: white;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
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
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }
          .reports-section {
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
          .reports-grid {
            display: grid;
            gap: 20px;
          }
          .report-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          .report-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 15px;
            flex-wrap: wrap;
          }
          .test-name {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            line-height: 1.3;
          }
          .test-date {
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
          .report-results {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #3b82f6;
          }
          .results-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
          }
          .results-value {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .normal-range {
            font-size: 0.85rem;
            color: #6b7280;
          }
          .report-details {
            margin: 15px 0;
          }
          .detail-row {
            display: flex;
            margin-bottom: 8px;
          }
          .detail-label {
            font-weight: 500;
            color: #374151;
            min-width: 80px;
          }
          .detail-value {
            color: #6b7280;
          }
          .report-actions {
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
            border-color: #3b82f6;
            background: white;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
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
            border-color: #3b82f6;
            background: white;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          }
          .no-reports {
            text-align: center;
            background: white;
            border-radius: 16px;
            padding: 60px 40px;
            color: #6b7280;
          }
          .no-reports-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .no-reports h3 {
            font-size: 1.4rem;
            color: #374151;
            margin-bottom: 10px;
          }
          .reports-section {
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
          .reports-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
          }
          @media (max-width: 768px) {
            .lab-card {
              margin: 0 10px;
            }
            .lab-header {
              padding: 20px;
            }
            .lab-content {
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
            .reports-grid {
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
      
      <div className="lab-container">
        <div className="lab-card">
          <div className="lab-header">
            <button className="back-btn" onClick={() => navigate('/smart-health-record')}>
              ← Back to SHR
            </button>
            <h1>🧪 Lab Reports</h1>
            <p>Track your laboratory test results and analyses</p>
          </div>
          
          <div className="lab-content">
            <button 
              className="add-report-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancel' : '➕ Add Lab Report'}
            </button>

            {showForm && (
              <div className="form-container">
                <div className="form-title">
                  {editMode ? '✏️ Edit Lab Report' : '🧪 Add Lab Report'}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Test Name *</label>
                      <input
                        type="text"
                        name="testName"
                        value={formData.testName}
                        onChange={handleChange}
                        placeholder="e.g., Complete Blood Count, Cholesterol Panel"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Test Date *</label>
                      <input
                        type="date"
                        name="testDate"
                        value={formData.testDate}
                        onChange={handleChange}
                        required
                      />
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
                        <option value="pending">Pending</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Test Results *</label>
                      <input
                        type="text"
                        name="results"
                        value={formData.results}
                        onChange={handleChange}
                        placeholder="e.g., 180 mg/dL, 7.2 g/dL"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Normal Range</label>
                      <input
                        type="text"
                        name="normalRange"
                        value={formData.normalRange}
                        onChange={handleChange}
                        placeholder="e.g., 70-100 mg/dL, 6.8-8.5 g/dL"
                      />
                    </div>
                    <div className="form-group">
                      <label>Ordering Doctor</label>
                      <input
                        type="text"
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleChange}
                        placeholder="Dr. Smith, Internal Medicine"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional observations, follow-up instructions, or notes..."
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
                      {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Report' : 'Add Report')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {reports.length > 0 && (
              <div className="search-filter-container">
                <div className="search-filter-row">
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search test names, results, doctors..."
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
                    <option value="pending">Pending</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            )}

            <div className="reports-section">
              <div className="section-title">
                📊 Your Lab Reports ({filteredReports.length})
              </div>
              
              {reports.length === 0 ? (
                <div className="no-reports">
                  <div className="no-reports-icon">🧪</div>
                  <h3>No Lab Reports Yet</h3>
                  <p>Start tracking your lab results by adding your first report above.</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="no-reports">
                  <div className="no-reports-icon">🔍</div>
                  <h3>No Reports Found</h3>
                  <p>Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                <div className="reports-grid">
                  {filteredReports.map((report) => (
                    <div key={report._id} className="report-card">
                      <div className="report-header">
                        <div>
                          <div className="test-name">{report.testName}</div>
                          <div className="test-date">
                            Test Date: {formatDate(report.testDate)}
                          </div>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(report.status)
                          }}
                        >
                          <span>{getStatusIcon(report.status)}</span>
                          {report.status}
                        </div>
                      </div>
                      
                      <div className="report-results">
                        <div className="results-label">Test Results</div>
                        <div className="results-value">{report.results}</div>
                        {report.normalRange && (
                          <div className="normal-range">
                            Normal Range: {report.normalRange}
                          </div>
                        )}
                      </div>
                      
                      <div className="report-details">
                        {report.doctor && (
                          <div className="detail-row">
                            <span className="detail-label">Doctor:</span>
                            <span className="detail-value">{report.doctor}</span>
                          </div>
                        )}
                        {report.notes && (
                          <div className="detail-row">
                            <span className="detail-label">Notes:</span>
                            <span className="detail-value">{report.notes}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="report-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => editReport(report)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteReport(report._id)}
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

export default LabReports; 