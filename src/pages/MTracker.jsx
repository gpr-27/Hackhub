import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, makeAuthenticatedRequest } from "../config/api";
import "./../styles/MTracker.css";

function MTracker() {
    const [medicine, setMedicine] = useState("");
    const [time, setTime] = useState("");
    const [dosage, setDosage] = useState("");
    const [tillDate, setTillDate] = useState("");
    const [medications, setMedications] = useState([]);
    const [notifiedIndices, setNotifiedIndices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [currentMedId, setCurrentMedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, active, expired
    const audioRef = useRef(null);
    const navigate = useNavigate();

    // Load medications from backend on mount
    useEffect(() => {
        const fetchMedications = async () => {
            try {
                const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/medications`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate('/login');
                        return;
                    }
                    throw new Error('Failed to fetch medications');
                }
                
                const data = await response.json();
                setMedications(data);
            } catch (error) {
                console.error('Error fetching medications:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchMedications();
    }, [navigate]);

    const addMedication = async () => {
        if (medicine && time && dosage && tillDate) {
            try {
                const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/medications`, {
                    method: "POST",
                    body: JSON.stringify({ 
                        name: medicine, 
                        time, 
                        dosage, 
                        tillDate
                    })
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate('/login');
                        return;
                    }
                    throw new Error('Failed to add medication');
                }
                
                const newMed = await response.json();
                setMedications([...medications, newMed]);
                
                resetForm();
            } catch (error) {
                console.error('Error adding medication:', error);
            }
        } else {
            // Please fill in all fields
        }
    };

    const updateMedication = async () => {
        if (!currentMedId || !medicine || !time || !dosage || !tillDate) {
            return;
        }

        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/medications/${currentMedId}`, {
                method: "PUT",
                body: JSON.stringify({ 
                    name: medicine, 
                    time, 
                    dosage, 
                    tillDate
                })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to update medication');
            }
            
            const updatedMed = await response.json();
            setMedications(meds => 
                meds.map(med => med._id === currentMedId ? updatedMed : med)
            );
            
            resetForm();
        } catch (error) {
            console.error('Error updating medication:', error);
        }
    };

    const editMedication = (med) => {
        setMedicine(med.name);
        setTime(med.time);
        setDosage(med.dosage);
        setTillDate(med.tillDate);
        setCurrentMedId(med._id);
        setEditMode(true);
        
        // Scroll to form
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const deleteMedication = async (id) => {
        if (window.confirm("Are you sure you want to delete this medication?")) {
            try {
                const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/medications/${id}`, {
                    method: "DELETE"
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate('/login');
                        return;
                    }
                    throw new Error('Failed to delete medication');
                }
                
                setMedications(medications.filter((med) => med._id !== id));
            } catch (error) {
                console.error('Error deleting medication:', error);
            }
        }
    };

    const resetForm = () => {
        setMedicine("");
        setTime("");
        setDosage("");
        setTillDate("");
        setEditMode(false);
        setCurrentMedId(null);
    };

    // Filter and search medications
    const filteredMedications = medications.filter(med => {
        // Search filter
        const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             med.dosage.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const today = new Date().toISOString().slice(0, 10);
        if (filterStatus === "active" && med.tillDate < today) {
            return false;
        }
        if (filterStatus === "expired" && med.tillDate >= today) {
            return false;
        }
        
        return matchesSearch;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            medications.forEach((med, idx) => {
                const [h, m] = med.time.split(":");
                const today = new Date().toISOString().slice(0, 10);
                // Only notify if today is before or equal to tillDate
                if (
                    now.getHours() === parseInt(h, 10) &&
                    now.getMinutes() === parseInt(m, 10) &&
                    !notifiedIndices.includes(idx) &&
                    today <= med.tillDate
                ) {
                    // Play alarm sound
                    if (audioRef.current) audioRef.current.play();
                    // Show notification
                    if (window.Notification && Notification.permission === "granted") {
                        new Notification("Medication Reminder", {
                            body: `Time to take: ${med.name} (${med.dosage}), Till: ${med.tillDate}`,
                        });
                    }
                    // Mark this medication as notified for this minute
                    setNotifiedIndices(prev => [...prev, idx]);
                }
                // Reset notifiedIndices if time has passed for this medication
                if (
                    (now.getHours() !== parseInt(h, 10) ||
                        now.getMinutes() !== parseInt(m, 10)) &&
                    notifiedIndices.includes(idx)
                ) {
                    setNotifiedIndices(prev => prev.filter(i => i !== idx));
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [medications, notifiedIndices]);

    useEffect(() => {
        if (window.Notification && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading medications...</p>
            </div>
        );
    }

    return (
        <>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div className="mtracker-container">
            <div className="mtracker-header">
                <button
                    className="dashboard-btn"
                    onClick={() => navigate("/Dashboard")}
                    title="Go to Dashboard"
                >
                    &#8592; Dashboard
                </button>
                <h1>Medication Tracker</h1>
            </div>

            <div className="mtracker-banner">
                <div className="banner-content">
                    <h2>YOUR HEALTH, OUR PRIORITY</h2>
                    <p>Effortlessly manage your medications: schedule doses, set reminders, and receive timely alarms. Stay on track with your treatment and never miss a dose!</p>
                </div>
            </div>

            <div className="mtracker-form-container">
                <h2>{editMode ? 'Edit Medication' : 'Add New Medication'}</h2>
                <div className="mtracker-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="medicine-name">Medicine Name</label>
                            <input
                                id="medicine-name"
                                type="text"
                                placeholder="Medicine Name"
                                value={medicine}
                                onChange={e => setMedicine(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="medicine-dosage">Dosage</label>
                            <input
                                id="medicine-dosage"
                                type="text"
                                placeholder="e.g. 1 tablet"
                                value={dosage}
                                onChange={e => setDosage(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="medicine-time">Time</label>
                            <input
                                id="medicine-time"
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="medicine-till">Until Date</label>
                            <input
                                id="medicine-till"
                                type="date"
                                value={tillDate}
                                onChange={e => setTillDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        {editMode ? (
                            <>
                                <button className="update-btn" onClick={updateMedication}>Update Medication</button>
                                <button className="cancel-btn" onClick={resetForm}>Cancel</button>
                            </>
                        ) : (
                            <button className="add-btn" onClick={addMedication}>Add Medication</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mtracker-list-container">
                <div className="list-header">
                    <h2>Your Medications</h2>
                    <div className="list-controls">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search medications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-container">
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Medications</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                    </div>
                </div>

                {filteredMedications.length === 0 ? (
                    <div className="no-medications">
                        <p>No medications found. Add some medications to get started!</p>
                    </div>
                ) : (
                    <div className="medications-grid">
                        {filteredMedications.map((med) => {
                            const isExpired = new Date(med.tillDate) < new Date();
                            return (
                                <div 
                                    key={med._id} 
                                    className={`medication-card ${isExpired ? 'expired' : ''}`}
                                >
                                    <div className="medication-header">
                                        <h3>{med.name}</h3>
                                        <div className="medication-actions">
                                            <button
                                                className="edit-btn"
                                                onClick={() => editMedication(med)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteMedication(med._id)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="medication-details">
                                        <p><strong>Time:</strong> {med.time}</p>
                                        <p><strong>Dosage:</strong> {med.dosage}</p>
                                        <p><strong>Until:</strong> {med.tillDate}</p>
                                        {isExpired && <span className="expired-tag">Expired</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <audio
                ref={audioRef}
                src="/bedside-clock-alarm-95792.mp3"
                preload="auto"
            />
        </div>
        </>
    );
}

export default MTracker;