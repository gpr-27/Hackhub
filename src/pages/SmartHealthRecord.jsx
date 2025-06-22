import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config/api';

const SmartHealthRecord = () => {
  const navigate = useNavigate();
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: "",
    type: "family"
  });

  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emergency-contacts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setEmergencyContacts(data);
      }
    } catch (error) {
      // Error loading emergency contacts
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editMode) {
        response = await fetch(`${API_BASE_URL}/api/emergency-contacts/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newContact)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/emergency-contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newContact)
        });
      }

      if (response.ok) {
        const savedContact = await response.json();
        if (editMode) {
          setEmergencyContacts(emergencyContacts.map(contact => 
            contact._id === editingId ? savedContact : contact
          ));
        } else {
          setEmergencyContacts([...emergencyContacts, savedContact]);
        }
        resetForm();
      } else {
        // Failed to save emergency contact
      }
    } catch (error) {
      // Error saving emergency contact
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewContact({ name: "", relationship: "", phone: "", type: "family" });
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
  };

  const editContact = (contact) => {
    setNewContact({
      name: contact.name,
      relationship: contact.relationship || "",
      phone: contact.phone,
      type: contact.type
    });
    setEditMode(true);
    setEditingId(contact._id);
    setShowForm(true);
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/emergency-contacts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setEmergencyContacts(emergencyContacts.filter(contact => contact._id !== id));
      } else {
        // Failed to delete emergency contact
      }
    } catch (error) {
      // Error deleting emergency contact
    }
  };

  const handleChange = (e) => {
    setNewContact({ ...newContact, [e.target.name]: e.target.value });
  };

  const getContactTypeIcon = (type) => {
    switch (type) {
      case 'family': return '👨‍👩‍👧‍👦';
      case 'medical': return '🏥';
      case 'friend': return '👥';
      case 'work': return '💼';
      default: return '📞';
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .shr-container {
            min-height: 100vh;
            padding: 20px;
          }
          .shr-card {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .shr-header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
          }
          .shr-header h1 {
            margin: 0;
            font-size: 3rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            margin-bottom: 10px;
          }
          .shr-header p {
            margin: 0;
            font-size: 1.2rem;
            opacity: 0.9;
          }
          .back-btn {
            position: absolute;
            left: 40px;
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
          .shr-content {
            padding: 40px;
          }
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
          }
          .feature-card {
            background: var(--bg-gradient, #ffffff) !important;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            transition: transform 0.15s ease;
            cursor: pointer;
            text-decoration: none;
            will-change: transform;
          }
          .feature-card:hover {
            transform: translateY(-2px);
            background: var(--bg-gradient, #ffffff) !important;
          }
          .feature-card:active {
            transform: translateY(0);
            background: var(--bg-gradient, #ffffff) !important;
          }
          .feature-card:focus {
            background: var(--bg-gradient, #ffffff) !important;
            outline: 2px solid rgba(255, 255, 255, 0.5);
          }
          .feature-card:visited {
            background: var(--bg-gradient, #ffffff) !important;
          }
          .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
            display: block;
          }
          .feature-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #ffffff !important;
            margin-bottom: 8px;
          }
          .feature-description {
            color: #f0f0f0 !important;
            font-size: 0.9rem;
            font-weight: 400;
            line-height: 1.4;
          }
          .feature-card .feature-title,
          .feature-card:hover .feature-title,
          .feature-card:active .feature-title,
          .feature-card:focus .feature-title,
          .feature-card:visited .feature-title {
            color: #ffffff !important;
          }
          .feature-card .feature-description,
          .feature-card:hover .feature-description,
          .feature-card:active .feature-description,
          .feature-card:focus .feature-description,
          .feature-card:visited .feature-description {
            color: #f0f0f0 !important;
          }
          .emergency-section {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 16px;
            padding: 30px;
            margin-top: 30px;
          }
          .emergency-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
          }
          .emergency-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #dc2626;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .add-contact-btn {
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.15s ease;
          }
          .add-contact-btn:hover {
            background: #b91c1c;
          }
          .form-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }
          .form-title {
            font-size: 1.3rem;
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
            gap: 15px;
            margin-bottom: 15px;
          }
          .form-group {
            display: flex;
            flex-direction: column;
          }
          .form-group label {
            font-weight: 500;
            color: #374151;
            margin-bottom: 5px;
            font-size: 0.9rem;
          }
          .form-group input,
          .form-group select {
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.15s ease;
            background: white;
          }
          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #dc2626;
          }
          .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 20px;
          }
          .cancel-btn {
            background: #f3f4f6;
            color: #374151;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
          }
          .cancel-btn:hover {
            background: #e5e7eb;
          }
          .submit-btn {
            background: #dc2626;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.15s ease;
          }
          .submit-btn:hover {
            background: #b91c1c;
          }
          .contacts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          .contact-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          .contact-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          }
          .contact-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .contact-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 1.1rem;
          }
          .contact-type {
            font-size: 1.5rem;
          }
          .contact-details {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 8px;
          }
          .contact-phone {
            color: #dc2626;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 15px;
          }
          .contact-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
          .edit-btn {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.3s;
          }
          .edit-btn:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
            transform: translateY(-1px);
          }
          .delete-btn {
            background: #ef4444;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.3s;
          }
          .delete-btn:hover {
            background: #dc2626;
            transform: translateY(-1px);
          }
          .no-contacts {
            text-align: center;
            background: white;
            border-radius: 12px;
            padding: 40px;
            color: #6b7280;
          }
          .no-contacts-icon {
            font-size: 3rem;
            margin-bottom: 15px;
          }
          .no-contacts h3 {
            font-size: 1.2rem;
            color: #374151;
            margin-bottom: 8px;
          }
          @media (max-width: 768px) {
            .features-grid {
              grid-template-columns: 1fr;
            }
            .back-btn {
              position: static;
              transform: none;
              margin-bottom: 20px;
            }
            .shr-header {
              text-align: left;
              padding: 30px 20px;
            }
            .emergency-header {
              flex-direction: column;
              gap: 15px;
              align-items: flex-start;
            }
          }
        `}
      </style>
      
      <div className="shr-container">
        <div className="shr-card">
          <div className="shr-header">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              ← Dashboard
            </button>
            <h1>🏥 Smart Health Record</h1>
            <p>Your comprehensive digital health management system</p>
          </div>
          
          <div className="shr-content">
            <div className="features-grid">
              <div 
                className="feature-card health-profile" 
                style={{'--accent-color': '#10b981', '--bg-gradient': 'linear-gradient(135deg, #047857, #065f46)'}}
                onClick={() => navigate('/smart-health-record/profile')}
              >
                <span className="feature-icon">👤</span>
                <h3 className="feature-title">Health Profile</h3>
                <p className="feature-description">
                  Manage your personal health information, allergies, chronic conditions, and insurance details.
                </p>
              </div>

              <div 
                className="feature-card medical-history" 
                style={{'--accent-color': '#0891b2', '--bg-gradient': 'linear-gradient(135deg, #0e7490, #155e75)'}}
                onClick={() => navigate('/smart-health-record/medical-history')}
              >
                <span className="feature-icon">📋</span>
                <h3 className="feature-title">Medical History</h3>
                <p className="feature-description">
                  Track your medical conditions, diagnoses, treatments, and healthcare provider visits.
                </p>
              </div>

              <div 
                className="feature-card lab-reports" 
                style={{'--accent-color': '#3b82f6', '--bg-gradient': 'linear-gradient(135deg, #1e40af, #1e3a8a)'}}
                onClick={() => navigate('/smart-health-record/lab-reports')}
              >
                <span className="feature-icon">🧪</span>
                <h3 className="feature-title">Lab Reports</h3>
                <p className="feature-description">
                  Store and monitor your laboratory test results, blood work, and diagnostic reports.
                </p>
              </div>

              <div 
                className="feature-card doctor-visits" 
                style={{'--accent-color': '#8b5cf6', '--bg-gradient': 'linear-gradient(135deg, #7c3aed, #6d28d9)'}}
                onClick={() => navigate('/smart-health-record/doctor-visits')}
              >
                <span className="feature-icon">🩺</span>
                <h3 className="feature-title">Doctor Visits</h3>
                <p className="feature-description">
                  Keep detailed records of your medical appointments, consultations, and follow-ups.
                </p>
              </div>

              <div 
                className="feature-card prescriptions" 
                style={{'--accent-color': '#f59e0b', '--bg-gradient': 'linear-gradient(135deg, #d97706, #b45309)'}}
                onClick={() => navigate('/smart-health-record/prescriptions')}
              >
                <span className="feature-icon">💊</span>
                <h3 className="feature-title">Prescriptions</h3>
                <p className="feature-description">
                  Manage your medications, dosages, schedules, and prescription history.
                </p>
              </div>

              <div 
                className="feature-card vital-signs" 
                style={{'--accent-color': '#ef4444', '--bg-gradient': 'linear-gradient(135deg, #dc2626, #b91c1c)'}}
                onClick={() => navigate('/smart-health-record/vital-signs')}
              >
                <span className="feature-icon">📈</span>
                <h3 className="feature-title">Vital Signs</h3>
                <p className="feature-description">
                  Record and track your vital signs including blood pressure, heart rate, and temperature.
                </p>
              </div>
            </div>

            <div className="emergency-section">
              <div className="emergency-header">
                <h2 className="emergency-title">
                  🚨 Emergency Contacts
                </h2>
                <button 
                  className="add-contact-btn"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? '❌ Cancel' : '➕ Add Contact'}
                </button>
              </div>

              {showForm && (
                <div className="form-container">
                  <div className="form-title">
                    {editMode ? '✏️ Edit Emergency Contact' : '📞 Add Emergency Contact'}
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={newContact.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Relationship</label>
                        <input
                          type="text"
                          name="relationship"
                          value={newContact.relationship}
                          onChange={handleChange}
                          placeholder="Spouse, Parent, Friend"
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={newContact.phone}
                          onChange={handleChange}
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Contact Type</label>
                        <select
                          name="type"
                          value={newContact.type}
                          onChange={handleChange}
                        >
                          <option value="family">Family</option>
                          <option value="medical">Medical</option>
                          <option value="friend">Friend</option>
                          <option value="work">Work</option>
                        </select>
                      </div>
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
                        {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Contact' : 'Add Contact')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {emergencyContacts.length === 0 ? (
                <div className="no-contacts">
                  <div className="no-contacts-icon">📞</div>
                  <h3>No Emergency Contacts</h3>
                  <p>Add your emergency contacts for quick access during emergencies.</p>
                </div>
              ) : (
                <div className="contacts-grid">
                  {emergencyContacts.map((contact) => (
                    <div key={contact._id} className="contact-card">
                      <div className="contact-header">
                        <div className="contact-name">{contact.name}</div>
                        <div className="contact-type">{getContactTypeIcon(contact.type)}</div>
                      </div>
                      
                      {contact.relationship && (
                        <div className="contact-details">{contact.relationship}</div>
                      )}
                      
                      <div className="contact-phone">{contact.phone}</div>
                      
                      <div className="contact-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => editContact(contact)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteContact(contact._id)}
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

export default SmartHealthRecord; 