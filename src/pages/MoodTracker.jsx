import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "../styles/MoodTracker.css";
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';

// Modern emoji mood system with intensity
const moodEmojis = [
  { emoji: "😰", label: "Anxious", value: 1 },
  { emoji: "😔", label: "Sad", value: 2 },
  { emoji: "😐", label: "Neutral", value: 3 },
  { emoji: "🙂", label: "Content", value: 4 },
  { emoji: "😊", label: "Happy", value: 5 },
  { emoji: "😄", label: "Joyful", value: 6 },
  { emoji: "🥰", label: "Loved", value: 7 },
  { emoji: "🌟", label: "Excited", value: 8 },
  { emoji: "😍", label: "Euphoric", value: 9 },
  { emoji: "🤩", label: "Blissful", value: 10 }
];

// Enhanced quick emotion words with more variety
const emotionWords = [
  "motivated", "creative", "energetic", "accomplished", "confident",
  "relaxed", "optimistic", "inspired", "balanced", "focused",
  "overwhelmed", "restless", "uncertain", "disappointed", "worried",
  "exhausted", "irritable", "vulnerable", "disconnected", "unfulfilled",
  "grateful", "proud", "serene", "playful", "determined"
];

function MoodTracker() {
  const navigate = useNavigate();
  
  // UI State
  const [selectedMood, setSelectedMood] = useState(8); // Default to excited
  const [intensity, setIntensity] = useState(9);
  const [description, setDescription] = useState("");
  const [selectedWords, setSelectedWords] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  
  // Data State
  const [recentEntries, setRecentEntries] = useState([]);
  const [aiInsights, setAiInsights] = useState("");
  const [trends, setTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayEntries, setTodayEntries] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // AI Setup
  const [genAI, setGenAI] = useState(null);

  const calculateStreaks = useCallback((entries) => {
    if (entries.length === 0) return { current: 0, longest: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp));
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const mood = sortedEntries[i].mood || sortedEntries[i].intensity || 5;
      if (mood >= 6) { // Positive mood
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Calculate current streak from recent entries
    for (let i = sortedEntries.length - 1; i >= 0; i--) {
      const mood = sortedEntries[i].mood || sortedEntries[i].intensity || 5;
      if (mood >= 6) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return { current: currentStreak, longest: longestStreak };
  }, []);

  const calculateTrends = useCallback((entries) => {
    if (entries.length === 0) return;

    const last7Days = [];
    const last30Days = [];
    const today = new Date();
    
    // Calculate 7-day trends
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = entries.filter(entry => 
        entry.date === dateStr || 
        (entry.timestamp && entry.timestamp.split('T')[0] === dateStr)
      );
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const avgMood = dayEntries.length > 0 
        ? (dayEntries.reduce((sum, entry) => sum + (entry.mood || entry.intensity || 5), 0) / dayEntries.length)
        : 0;
      
      last7Days.push({
        date: dayName,
        entries: dayEntries.length,
        avgMood: avgMood.toFixed(1),
        emoji: dayEntries.length > 0 ? getEmojiForMood(Math.round(avgMood)) : "😐",
        moodLevel: avgMood >= 7 ? 'high' : avgMood >= 4 ? 'medium' : avgMood > 0 ? 'low' : 'none',
        details: dayEntries
      });
    }

    // Calculate 30-day patterns
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = entries.filter(entry => 
        entry.date === dateStr || 
        (entry.timestamp && entry.timestamp.split('T')[0] === dateStr)
      );
      
      if (dayEntries.length > 0) {
        const avgMood = dayEntries.reduce((sum, entry) => sum + (entry.mood || entry.intensity || 5), 0) / dayEntries.length;
        last30Days.push({
          date: dateStr,
          avgMood: avgMood,
          entries: dayEntries.length
        });
      }
    }

    const totalEntries = entries.length;
    const positiveDays = entries.filter(entry => (entry.mood || entry.intensity || 5) >= 6).length;
    const avgOverallMood = entries.length > 0 
      ? (entries.reduce((sum, entry) => sum + (entry.mood || entry.intensity || 5), 0) / entries.length).toFixed(1)
      : 0;

    // Calculate mood patterns
    const moodDistribution = {};
    entries.forEach(entry => {
      const mood = entry.mood || entry.intensity || 5;
      const range = mood >= 8 ? 'excellent' : mood >= 6 ? 'good' : mood >= 4 ? 'neutral' : 'challenging';
      moodDistribution[range] = (moodDistribution[range] || 0) + 1;
    });
    
    setTrends({
      last7Days,
      last30Days,
      totalEntries,
      positiveDays: Math.round((positiveDays / totalEntries) * 100) || 0,
      avgOverallMood,
      moodDistribution,
      streaks: calculateStreaks(entries)
    });
  }, [calculateStreaks]);

  const fetchMoodData = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch mood data');
      }
      
      const data = await response.json();
      const sorted = [...data].sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        setRecentEntries(sorted.slice(0, 8)); // Most recent 8 entries
// Last 8 entries
      
      // Count today's entries
      const today = new Date().toISOString().split('T')[0];
      const todayCount = data.filter(entry => 
        entry.date === today || 
        (entry.timestamp && entry.timestamp.split('T')[0] === today)
      ).length;
      setTodayEntries(todayCount);
      
      calculateTrends(data);
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, calculateTrends]);

  useEffect(() => {
    // Initialize Gemini AI
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAhkAIgUf1lP4OI8HFzNy1vK6xV9yJ8-A8';
    if (apiKey) {
      setGenAI(new GoogleGenerativeAI(apiKey));
    }
    
    fetchMoodData();
  }, [fetchMoodData]);

  const getEmojiForMood = (moodValue) => {
    const mood = moodEmojis.find(m => m.value === moodValue);
    return mood ? mood.emoji : "😐";
  };

  const toggleEmotionWord = (word) => {
    setSelectedWords(prev => 
      prev.includes(word) 
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  const generateAIInsights = useCallback(async () => {
    if (!genAI) return;

    setIsAnalyzing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const moodLabel = moodEmojis.find(m => m.value === selectedMood)?.label || 'Neutral';
      
      const prompt = `Analyze this mood entry briefly:

MOOD: ${moodLabel} (${selectedMood}/10), Intensity: ${intensity}/10
NOTES: "${description || 'No details'}"
EMOTIONS: ${selectedWords.length > 0 ? selectedWords.join(', ') : 'None'}
ENTRY: #${todayEntries + 1} today

Respond in exactly 5 sections, each maximum 2 lines:

1. Acknowledge their emotional state (2 lines max) with side heading "💙 Mood Validation"
2. Insight about their mood pattern (2 lines max) with side heading "🔍 Pattern Recognition"  
3. Personal understanding (2 lines max) with side heading "💡 Personal Understanding"
4. One practical recommendation (2 lines max) with side heading "🌟 Recommendations"
5. Encouraging message (2 lines max) with side heading "🌟 Encouragement"

No formatting like ** or *. Plain text only. Be warm and supportive.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiInsights(response.text());
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setAiInsights("");
    } finally {
      setIsAnalyzing(false);
    }
  }, [genAI, selectedMood, intensity, description, selectedWords, todayEntries]);

  const saveMoodEntry = async () => {
    if (isSaving) return; // Prevent multiple simultaneous saves
    
    setIsSaving(true);
    try {
      const now = new Date();
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods`, {
        method: "POST",
        body: JSON.stringify({ 
          mood: selectedMood,
          intensity: intensity,
          notes: description.trim(),
          emotionWords: selectedWords,
          aiInsights: aiInsights,
          date: now.toISOString().split('T')[0],
          timestamp: now.toISOString(),
          entryNumber: todayEntries + 1
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        const errorData = await response.text();
        console.error('Save error response:', errorData);
        throw new Error(`Failed to save mood entry: ${response.status}`);
      }

      const savedEntry = await response.json();
      console.log('Entry saved successfully:', savedEntry);
  
      // Immediately increment today's entry count
      setTodayEntries(prev => prev + 1);
  
      // Refresh mood entries and trends with proper await
      await fetchMoodData();
  
      // Reset UI only after successful save
      setDescription("");
      setSelectedWords([]);
      setAiInsights("");
      setSelectedMood(8); // Reset to default mood
      setIntensity(9);    // Reset to default intensity

      // Optional: Show success feedback
      console.log('Mood entry saved successfully!');
  
    } catch (error) {
      console.error('Error saving mood entry:', error);
      // Optional: Show error feedback to user
      alert(`Failed to save mood entry: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMoodEntry = async (entryId) => {
    if (!entryId || isDeleting === entryId) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this mood entry?');
    if (!confirmDelete) return;
    
    setIsDeleting(entryId);
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/moods/${entryId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(`Failed to delete mood entry: ${response.status}`);
      }

      console.log('Entry deleted successfully:', entryId);
      
      // Refresh mood entries and trends
      await fetchMoodData();
      
      // Update today's entry count if it was today's entry
      const today = new Date().toISOString().split('T')[0];
      const deletedEntry = recentEntries.find(entry => entry._id === entryId);
      if (deletedEntry && (deletedEntry.date === today || 
          (deletedEntry.timestamp && deletedEntry.timestamp.split('T')[0] === today))) {
        setTodayEntries(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      alert(`Failed to delete mood entry: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Auto-generate insights when user inputs change (with meaningful input)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (description.trim() || selectedWords.length > 0) {
        generateAIInsights();
      }
    }, 1500);
  
    return () => clearTimeout(timeoutId);
  }, [description, selectedWords, intensity, selectedMood, generateAIInsights]);
  

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading mood analysis...</p>
      </div>
    );
  }

  return (
    <div className="mood-analysis-app">
      <nav className="mood-nav">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
      </nav>

      <div className="mood-analysis-panel">
        <header className="panel-header">
          <div className="header-icon">🧠</div>
          <div className="header-content">
            <h1>Mood Analysis Panel</h1>
            <p>AI-powered mood tracking and insights • Today: {todayEntries} entries</p>
          </div>
          <div className="header-actions">
            <button 
              className={`trends-btn ${showTrends ? 'active' : ''}`}
              onClick={() => {setShowTrends(true);}}
            >
              📊 Trends
            </button>
            <button className="close-btn" onClick={() => navigate("/dashboard")}>×</button>
          </div>
        </header>

        <div className="panel-content">
          <div className="main-content">
            <div className="mood-input-section">
              <div className="section-header">
                <h2>💬 How are you feeling?</h2>
              </div>

              <div className="mood-selection">
                <h3>Select your mood:</h3>
                <div className="mood-grid">
                  {moodEmojis.map((mood) => (
                    <button
                      key={mood.value}
                      className={`mood-button ${selectedMood === mood.value ? 'selected' : ''}`}
                      onClick={() => setSelectedMood(mood.value)}
                      title={`${mood.label} (${mood.value}/10)`}
                    >
                      <span className="mood-emoji-large">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="intensity-section">
                <h3>Intensity: {intensity}/10</h3>
                <div className="intensity-slider-container">
                  <span className="intensity-label">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="intensity-slider"
                  />
                  <span className="intensity-label">High</span>
                </div>
              </div>

              <div className="description-section">
                <h3>Describe your feelings (optional):</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's on your mind? Any specific thoughts, events, or triggers that influenced your mood today..."
                  className="description-input"
                  rows={4}
                />
              </div>

              <div className="quick-words-section">
                <h3>Quick words:</h3>
                <div className="emotion-words">
                  {emotionWords.map((word) => (
                    <button
                      key={word}
                      className={`emotion-word ${selectedWords.includes(word) ? 'selected' : ''}`}
                      onClick={() => toggleEmotionWord(word)}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>

              <div className="save-note">
                <p>💡 <strong>Tip:</strong> Wait a sec after typing to generate AI insights before saving!</p>
              </div>

              <button 
                className="analyze-btn"
                onClick={saveMoodEntry}
                disabled={isAnalyzing || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="analyzing-icon">🔄</span>
                    Saving...
                  </>
                ) : isAnalyzing ? (
                  <>
                    <span className="analyzing-icon">🔄</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="save-icon">💾</span>
                    Save Entry
                  </>
                )}
              </button>

              {aiInsights && (
                <div className="ai-insights">
                  <h4>🤖 AI Insights & Analysis</h4>
                  <div className="insights-content">
                    <div className="ai-text-response">
                      {aiInsights}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            {showTrends && trends ? (
              <div className="trends-section">
                <div className="trends-header">
                  <h3>📈 Mood Analytics Dashboard</h3>
                  <button 
                    className="back-to-recent-btn"
                    onClick={() => setShowTrends(false)}
                    title="Back to Recent Insights"
                  >
                    ← Recent Insights
                  </button>
                </div>
                
                {/* Overall Stats Cards */}
                <div className="trend-stats-grid">
                  <div className="stat-card primary">
                    <div className="stat-icon">📊</div>
                    <div className="stat-number">{trends.totalEntries}</div>
                    <div className="stat-label">Total Entries</div>
                  </div>
                  <div className="stat-card success">
                    <div className="stat-icon">✨</div>
                    <div className="stat-number">{trends.positiveDays}%</div>
                    <div className="stat-label">Positive Days</div>
                  </div>
                  <div className="stat-card info">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-number">{trends.avgOverallMood}</div>
                    <div className="stat-label">Avg Mood</div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-number">{trends.streaks?.current || 0}</div>
                    <div className="stat-label">Current Streak</div>
                  </div>
                </div>

                {/* 7-Day Visual Timeline */}
                <div className="weekly-timeline">
                  <h4>📅 7-Day Mood Timeline</h4>
                  <div className="timeline-container">
                    {trends.last7Days.map((day, index) => (
                      <div key={index} className={`timeline-day ${day.moodLevel}`}>
                        <div className="day-emoji">{day.emoji}</div>
                        <div className="day-name">{day.date.split(' ')[0]}</div>
                        <div className="day-indicator">
                          <div 
                            className="mood-bar" 
                            style={{ height: `${day.avgMood * 10}%` }}
                          />
                        </div>
                        <div className="day-entries">{day.entries}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mood Distribution */}
                <div className="mood-distribution">
                  <h4>🎨 Mood Distribution</h4>
                  <div className="distribution-bars">
                    {Object.entries(trends.moodDistribution || {}).map(([range, count]) => (
                      <div key={range} className="dist-bar">
                        <span className="dist-label">{range}</span>
                        <div className="dist-container">
                          <div 
                            className={`dist-fill ${range}`}
                            style={{ width: `${(count / trends.totalEntries) * 100}%` }}
                          />
                        </div>
                        <span className="dist-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="recent-entries-section">
                <h3>📅 Recent Entries</h3>
                {recentEntries.length === 0 ? (
                  <div className="no-entries">
                    <div className="empty-brain">🧠</div>
                    <p>No mood entries yet</p>
                    <small>Start tracking your mood to see insights!</small>
                  </div>
                ) : (
                  <div className="recent-entries">
                    {recentEntries.map((entry, index) => (
                      <div key={entry._id || index} className="recent-entry">
                        <div className="entry-header">
                          <div className="entry-mood">
                            <span className="entry-emoji">
                              {getEmojiForMood(entry.mood || entry.intensity || 5)}
                            </span>
                            <div className="entry-details">
                              <div className="entry-intensity">
                                {moodEmojis.find(m => m.value === (entry.mood || entry.intensity || 5))?.label} • {entry.mood || entry.intensity || 5}/10
                              </div>
                              <div className="entry-date">
                                {new Date(entry.timestamp || entry.date).toLocaleDateString()} • {new Date(entry.timestamp || entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="entry-actions">
                            <div className={`entry-badge ${(entry.mood || entry.intensity || 5) >= 6 ? 'positive' : 'negative'}`}>
                              {(entry.mood || entry.intensity || 5) >= 6 ? 'POSITIVE' : 'NEGATIVE'}
                            </div>
                            <button 
                              className="delete-btn small"
                              onClick={() => deleteMoodEntry(entry._id)}
                              disabled={isDeleting === entry._id}
                              title="Delete this entry"
                            >
                              {isDeleting === entry._id ? '🔄' : '🗑️'}
                            </button>
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="entry-preview">
                            "{entry.notes.slice(0, 80)}..."
                          </div>
                        )}
                        {entry.emotionWords && entry.emotionWords.length > 0 && (
                          <div className="entry-emotions">
                            {entry.emotionWords.slice(0, 4).map((word, i) => (
                              <span key={i} className="emotion-tag">{word}</span>
                            ))}
                            {entry.emotionWords.length > 4 && (
                              <span className="emotion-tag more">+{entry.emotionWords.length - 4} more</span>
                            )}
                          </div>
                        )}
                        {entry.aiInsights && entry.aiInsights.trim() && (
                          <div className="ai-insights-hover">
                            <div className="ai-insights-content">
                              <div className="ai-text-response">
                                {entry.aiInsights}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodTracker;