import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MoodTracker.css";
import API_BASE_URL from '../config/api';

const moodOptions = [
    { value: 1, label: "Very Sad", emoji: "😢", color: "#ff4757" },
    { value: 2, label: "Sad", emoji: "😔", color: "#ff6b7a" },
    { value: 3, label: "Neutral", emoji: "😐", color: "#ffa502" },
    { value: 4, label: "Happy", emoji: "😊", color: "#7bed9f" },
    { value: 5, label: "Very Happy", emoji: "😄", color: "#2ed573" }
];

function MoodTracker() {
    const [selectedMood, setSelectedMood] = useState(null);
    const [notes, setNotes] = useState("");
    const [moodEntries, setMoodEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [currentEntryId, setCurrentEntryId] = useState(null);
    const [filterPeriod, setFilterPeriod] = useState("all"); // all, week, month
    const navigate = useNavigate();

    // Load mood entries from backend on mount
    useEffect(() => {
        const fetchMoodEntries = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/moods`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        // User not authenticated
                        navigate('/login');
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch mood entries');
                }
                
                const data = await response.json();
                setMoodEntries(data);
                } catch (error) {
      // Error fetching mood entries
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchMoodEntries();
    }, [navigate]);

    const addMoodEntry = async () => {
        if (selectedMood) {
            try {
                const now = new Date();
                const response = await fetch(`${API_BASE_URL}/api/moods`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        mood: selectedMood,
                        notes: notes.trim(),
                        date: now.toISOString().split('T')[0], // Date for grouping
                        timestamp: now.toISOString() // Full timestamp for uniqueness
                    }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        // Please log in to track your mood
                        navigate('/login');
                        return;
                    }
                    if (response.status === 400) {
                        // Bad request
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add mood entry');
                }
                
                const newEntry = await response.json();
                setMoodEntries([newEntry, ...moodEntries]);
                resetForm();
            } catch (error) {
                // Error adding mood entry
            }
        } else {
            // Please select a mood
        }
    };

    const updateMoodEntry = async () => {
        if (!currentEntryId || !selectedMood) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/moods/${currentEntryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    mood: selectedMood,
                    notes: notes.trim()
                }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to update mood entry');
            }
            
            const updatedEntry = await response.json();
            setMoodEntries(entries => 
                entries.map(entry => entry._id === currentEntryId ? updatedEntry : entry)
            );
            
            resetForm();
            } catch (error) {
      // Error updating mood entry
        }
    };

    const editMoodEntry = (entry) => {
        setSelectedMood(entry.mood);
        setNotes(entry.notes || "");
        setCurrentEntryId(entry._id);
        setEditMode(true);
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const deleteMoodEntry = async (id) => {
        if (!window.confirm("Are you sure you want to delete this mood entry?")) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/moods/${id}`, {
                method: "DELETE",
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to delete mood entry');
            }
            
            setMoodEntries(entries => entries.filter((entry) => entry._id !== id));
            } catch (error) {
      // Error deleting mood entry
        }
    };

    const resetForm = () => {
        setSelectedMood(null);
        setNotes("");
        setEditMode(false);
        setCurrentEntryId(null);
    };

    // Filter mood entries based on selected period
    const filteredEntries = moodEntries.filter(entry => {
        if (filterPeriod === "all") return true;
        
        const entryDate = new Date(entry.date);
        const today = new Date();
        
        if (filterPeriod === "week") {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return entryDate >= weekAgo;
        }
        
        if (filterPeriod === "month") {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return entryDate >= monthAgo;
        }
        
        return true;
    });

    // Calculate mood statistics
    const getMoodStats = () => {
        if (filteredEntries.length === 0) return null;
        
        const moodCounts = {};
        let totalMood = 0;
        
        filteredEntries.forEach(entry => {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
            totalMood += entry.mood;
        });
        
        const averageMood = (totalMood / filteredEntries.length).toFixed(1);
        const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
            moodCounts[a] > moodCounts[b] ? a : b
        );
        
        return {
            average: averageMood,
            mostCommon: parseInt(mostCommonMood),
            total: filteredEntries.length,
            distribution: moodCounts
        };
    };

    const moodStats = getMoodStats();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading mood data...</p>
            </div>
        );
    }

    return (
        <>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div className="mood-tracker-container">
            <div className="mood-tracker-header">
                <button
                    className="dashboard-btn"
                    onClick={() => navigate("/Dashboard")}
                    title="Go to Dashboard"
                >
                    ← Dashboard
                </button>
                <h1>Mood Tracker</h1>
            </div>

            <div className="mood-tracker-banner">
                <div className="banner-content">
                    <h2>TRACK YOUR EMOTIONAL WELLBEING</h2>
                    <p>Monitor your daily moods, identify patterns, and take control of your mental health journey. Every feeling matters!</p>
                </div>
            </div>

            <div className="mood-form-container">
                <h2>{editMode ? 'Edit Mood Entry' : 'How are you feeling today?'}</h2>
                
                <div className="mood-selection">
                    <h3>Select your mood:</h3>
                    <div className="mood-options">
                        {moodOptions.map((mood) => (
                            <div
                                key={mood.value}
                                className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`}
                                onClick={() => setSelectedMood(mood.value)}
                                style={{ borderColor: selectedMood === mood.value ? mood.color : '#ddd' }}
                            >
                                <div className="mood-emoji" style={{ fontSize: '2rem' }}>
                                    {mood.emoji}
                                </div>
                                <div className="mood-label">{mood.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mood-notes">
                    <label htmlFor="mood-notes">Notes (optional):</label>
                    <textarea
                        id="mood-notes"
                        placeholder="What's on your mind? Any thoughts or events that influenced your mood today..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="form-actions">
                    {editMode ? (
                        <>
                            <button className="update-btn" onClick={updateMoodEntry}>Update Entry</button>
                            <button className="cancel-btn" onClick={resetForm}>Cancel</button>
                        </>
                    ) : (
                        <button className="add-btn" onClick={addMoodEntry}>Save Mood</button>
                    )}
                </div>
            </div>

            {/* Mood Statistics */}
            {moodStats && (
                <div className="mood-stats-container">
                    <h2>Mood Insights</h2>
                    <div className="stats-filter">
                        <select 
                            value={filterPeriod} 
                            onChange={(e) => setFilterPeriod(e.target.value)}
                        >
                            <option value="all">All Time</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </div>
                    
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Average Mood</h3>
                            <div className="stat-value">
                                {moodOptions.find(m => Math.round(moodStats.average) === m.value)?.emoji}
                                <span>{moodStats.average}/5</span>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <h3>Most Common</h3>
                            <div className="stat-value">
                                {moodOptions.find(m => m.value === moodStats.mostCommon)?.emoji}
                                <span>{moodOptions.find(m => m.value === moodStats.mostCommon)?.label}</span>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <h3>Total Entries</h3>
                            <div className="stat-value">
                                <span>{moodStats.total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mood-distribution">
                        <h3>Mood Distribution</h3>
                        <div className="distribution-chart">
                            {moodOptions.map((mood) => {
                                const count = moodStats.distribution[mood.value] || 0;
                                const percentage = moodStats.total > 0 ? (count / moodStats.total) * 100 : 0;
                                return (
                                    <div key={mood.value} className="distribution-bar">
                                        <div className="bar-label">
                                            <span>{mood.emoji}</span>
                                            <span>{mood.label}</span>
                                        </div>
                                        <div className="bar-container">
                                            <div 
                                                className="bar-fill"
                                                style={{ 
                                                    width: `${percentage}%`,
                                                    backgroundColor: mood.color 
                                                }}
                                            />
                                        </div>
                                        <span className="bar-count">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Mood History */}
            <div className="mood-history-container">
                <h2>Mood History</h2>
                
                {filteredEntries.length === 0 ? (
                    <div className="no-entries">
                        <p>No mood entries found. Start tracking your mood today!</p>
                    </div>
                ) : (
                    <div className="mood-entries">
                        {filteredEntries.map((entry) => {
                            const mood = moodOptions.find(m => m.value === entry.mood);
                            return (
                                <div key={entry._id} className="mood-entry-card">
                                    <div className="entry-header">
                                        <div className="entry-mood">
                                            <span className="entry-emoji">{mood?.emoji}</span>
                                            <span className="entry-label">{mood?.label}</span>
                                        </div>
                                        <div className="entry-date">
                                            {new Date(entry.date).toLocaleDateString()}
                                            {entry.timestamp && (
                                                <div style={{fontSize: '0.8rem', opacity: 0.7}}>
                                                    {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            )}
                                        </div>
                                        <div className="entry-actions">
                                            <button
                                                className="edit-btn"
                                                onClick={() => editMoodEntry(entry)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteMoodEntry(entry._id)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    {entry.notes && (
                                        <div className="entry-notes">
                                            <p>{entry.notes}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

export default MoodTracker; 