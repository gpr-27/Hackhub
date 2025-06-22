import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from 'react-router-dom';
import "../styles/HealthChat.css";
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';

function HealthChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMode, setChatMode] = useState('therapy'); // therapy, meditation, crisis, wellness
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Mental Health Tips that auto-rotate
  const mentalHealthTips = [
    {
      id: 1,
      category: 'breathing',
      icon: '🌬️',
      title: 'Deep Breathing',
      tip: 'Try the 4-7-8 technique: Inhale for 4, hold for 7, exhale for 8. Repeat 3-4 times to reduce anxiety.'
    },
    {
      id: 2,
      category: 'mindfulness',
      icon: '🧘',
      title: 'Mindful Moment',
      tip: 'Take 5 minutes to notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.'
    },
    {
      id: 3,
      category: 'exercise',
      icon: '🏃',
      title: 'Movement Therapy',
      tip: 'Even 10 minutes of walking can boost your mood. Physical activity releases endorphins naturally.'
    },
    {
      id: 4,
      category: 'sleep',
      icon: '😴',
      title: 'Sleep Hygiene',
      tip: 'Create a bedtime routine: dim lights 1 hour before sleep, avoid screens, and keep your room cool.'
    },
    {
      id: 5,
      category: 'social',
      icon: '❤️',
      title: 'Connection',
      tip: 'Reach out to one person today. Social connections are vital for mental health and wellbeing.'
    },
    {
      id: 6,
      category: 'mindfulness',
      icon: '🎯',
      title: 'Gratitude Practice',
      tip: 'Write down 3 things you\'re grateful for today. Gratitude rewires your brain for positivity.'
    },
    {
      id: 7,
      category: 'breathing',
      icon: '💨',
      title: 'Box Breathing',
      tip: 'Breathe in for 4, hold for 4, out for 4, hold for 4. This Navy SEAL technique calms your nervous system.'
    },
    {
      id: 8,
      category: 'exercise',
      icon: '🧘‍♀️',
      title: 'Gentle Stretching',
      tip: 'Stretch your neck, shoulders, and back. Physical tension often mirrors emotional stress.'
    }
  ];

  // Quick action prompts
  const quickActions = [
    "I'm feeling anxious right now",
    "Help me with stress management",
    "I need meditation guidance",
    "I'm having trouble sleeping",
    "I feel overwhelmed",
    "I need motivation today"
  ];

  // Quick message options for input area
  const quickMessageOptions = [
    "How are you feeling?",
    "Need help with anxiety?",
    "Breathing exercises",
    "Sleep better tips",
    "Stress relief",
    "Mood boost"
  ];

  // Chat modes with different AI personalities
  const chatModes = [
    { id: 'therapy', name: 'Therapy Chat', icon: '💬', description: 'Supportive therapeutic conversation' },
    { id: 'meditation', name: 'Mindfulness Guide', icon: '🧘', description: 'Meditation and mindfulness assistance' },
    { id: 'crisis', name: 'Crisis Support', icon: '🆘', description: 'Immediate emotional support' },
    { id: 'wellness', name: 'Wellness Coach', icon: '🌟', description: 'Daily wellness and motivation' }
  ];

  // Auto-rotate tips every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % mentalHealthTips.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [mentalHealthTips.length]);

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/auth/check`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to check authentication');
      }

      const data = await response.json();
      
      return data.isAuthenticated;
    } catch (err) {
      // Error checking authentication - show connection issue
      return false;
    }
  };

  // Function to fetch chat history from MongoDB
  const fetchChatHistory = useCallback(async () => {
    try {
      await checkAuth();
      
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/chat/messages`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      setMessages(data);
          } catch (err) {
        // Error fetching chat history
      setMessages([]);
    }
  }, []);

  // Function to save a message to MongoDB
  const saveMessage = async (message, sender) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, sender })
      });

      if (!response.ok) {
        throw new Error('Failed to save message');
      }

      return await response.json();
          } catch (err) {
        // Error saving message
      return { message, sender, timestamp: new Date() };
    }
  };

  // Enhanced AI prompts based on chat mode
  const getAIPrompt = (userMessage, mode) => {
    const basePrompt = `You are MediBot, a warm, caring mental health assistant. Speak naturally and calmly, like you're having a real one-on-one conversation with someone who trusts you. 

IMPORTANT FORMATTING RULES:
- Always use bullet points for tips and suggestions
- Keep paragraphs short (1-2 sentences max)
- Use line breaks between different ideas
- Structure your response clearly with bullet points

Stay focused on the user's mental and emotional well-being based on their message. Use a soft, friendly tone — short, clear, and empathetic.

If helpful, share simple suggestions as bullet points. Ask only one gentle follow-up question if it fits. Do not include disclaimers like "I'm just an AI." But always encourage seeing a therapist if needed.`;
    
    const modePrompts = {
      therapy: `${basePrompt} Provide empathetic, brief therapeutic responses. Focus on emotional support and 2-3 practical coping strategies.`,
      meditation: `${basePrompt} Guide users through specific meditation or breathing exercises. Keep instructions clear and concise.`,
      crisis: `${basePrompt} Provide immediate, compassionate support. If crisis situation, emphasize professional help and crisis hotlines.`,
      wellness: `${basePrompt} Give motivational wellness tips. Provide 2-3 actionable lifestyle suggestions.`
    };

    return `${modePrompts[mode]}

RESPONSE GUIDELINES:
- Keep responses under 250 words
- ALWAYS use bullet points for tips and suggestions
- Use short paragraphs (2-3 sentences maximum)
- Ask ONE follow-up question maximum
- Be warm but concise
- For serious concerns, recommend professional help
- Stay focused on mental wellness topics
- Format responses with clear bullet points and line breaks
- Focus only on mental health topics
- Be warm, non-judgmental, and helpful
- Politely redirect if the topic is not related to mental health

RESPONSE FORMAT EXAMPLE:
Here's a short intro paragraph.

• Bullet point tip 1
• Bullet point tip 2  
• Bullet point tip 3

Short closing paragraph with follow-up question?


User message: "${userMessage}"

Provide a helpful, concise response:`;
  };

  // Initialize Gemini API
  const initializeGemini = () => {
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!API_KEY) {
      setError('AI service configuration error. Please contact support.');
      return null;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch (err) {
      setError('Failed to initialize AI. Please try again later.');
      return null;
    }
  };

  // Function to get response from Gemini API
  const getGeminiResponse = async (userMessage) => {
    try {
      const model = initializeGemini();
      if (!model) return null;

      const prompt = getAIPrompt(userMessage, chatMode);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (err) {
      setError('Failed to get AI response. Please try again later.');
      return "I'm here to support you, but I'm having trouble connecting right now. Please try again in a moment.";
    }
  };

  // Function to handle sending a message
  const handleSendMessage = async (messageText = null) => {
    const userMessage = messageText || input.trim();
    if (!userMessage) return;
    
    setInput('');
    setLoading(true);
    setError(null);
    
    // Add user message to UI immediately
    const newUserMessage = { sender: 'user', message: userMessage, timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Save user message to MongoDB
    await saveMessage(userMessage, 'user');
    
    try {
      // Get response from Gemini API
      const botResponse = await getGeminiResponse(userMessage);
      
      if (botResponse) {
        // Add bot response to UI
        const newBotMessage = { sender: 'bot', message: botResponse, timestamp: new Date() };
        setMessages(prevMessages => [...prevMessages, newBotMessage]);
        
        // Save bot response to MongoDB
        await saveMessage(botResponse, 'bot');
      }
    } catch (err) {
      // Error in chat flow
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Handle quick action click
  const handleQuickAction = (action) => {
    handleSendMessage(action);
  };

  // Handle scroll detection for scroll-to-bottom button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollToBottom(!isScrolledToBottom && messages.length > 5);
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat history on component mount
  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  // Add/remove health-chat-active class to body when component mounts/unmounts
  useEffect(() => {
    document.body.classList.add('health-chat-active');
    document.documentElement.classList.add('health-chat-active');
    
    return () => {
      document.body.classList.remove('health-chat-active');
      document.documentElement.classList.remove('health-chat-active');
    };
  }, []);

  return (
    <div className="health-chat-container">
      <div className="chat-header">
        <div className="header-left">
          <h2>🧠 MediBot - Your Mental Wellness Companion</h2>
          <p>Advanced AI support for your mental health journey</p>
        </div>
        
        <div className="header-right">
          {/* Back Button */}
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            ← Dashboard
          </button>
          
          {/* Chat Mode Selector */}
          <div className="chat-mode-selector">
            {chatModes.map(mode => (
              <button
                key={mode.id}
                className={`mode-button ${chatMode === mode.id ? 'active' : ''}`}
                onClick={() => setChatMode(mode.id)}
                title={mode.description}
              >
                {mode.icon} {mode.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="chat-content">
        {/* Mental Health Tips Sidebar */}
        <div className="mental-health-tips">
          <div className="tips-header">
            <h3>💡 Daily Wellness Tips</h3>
          </div>
          
          {mentalHealthTips.slice(currentTipIndex, currentTipIndex + 3).map((tip, index) => (
            <div key={tip.id} className={`tip-card ${tip.category}`}>
              <h4>{tip.icon} {tip.title}</h4>
              <p>{tip.tip}</p>
            </div>
          ))}
          
          <div className="tip-navigation">
            <small style={{ color: '#64748b', textAlign: 'center', display: 'block', marginTop: '1rem' }}>
              Tips refresh automatically
            </small>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
          {messages.length === 0 && !loading && !error && (
            <div className="welcome-screen">
              <h3>Welcome to Your Mental Wellness Space</h3>
              <p>I'm here to support you with personalized mental health guidance. Choose a chat mode above and let's begin your wellness journey.</p>
              
              <div className="welcome-features">
                <div className="feature-card">
                  <div className="feature-icon">💬</div>
                  <h4>Therapy Chat</h4>
                  <p>Supportive conversations and coping strategies</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🧘</div>
                  <h4>Mindfulness Guide</h4>
                  <p>Meditation and breathing exercises</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🆘</div>
                  <h4>Crisis Support</h4>
                  <p>Immediate emotional support when needed</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🌟</div>
                  <h4>Wellness Coach</h4>
                  <p>Daily motivation and lifestyle guidance</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="quick-action"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-content">
                <div className="message-avatar">
                  {msg.sender === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-text">
                  {msg.message}
                </div>
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message bot-message">
              <div className="message-content">
                <div className="message-avatar">🤖</div>
                <div className="message-text">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>MediBot is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
          
          {/* Scroll to Bottom Button */}
          {showScrollToBottom && (
            <button className="scroll-to-bottom" onClick={scrollToBottom}>
              ↓ New messages
            </button>
          )}
        </div>
      </div>
      
      {/* Enhanced Chat Input */}
      <form className="chat-input" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          {/* Quick Message Options */}
          <div className="quick-message-options">
            {quickMessageOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                className="quick-option-btn"
                onClick={() => setInput(option)}
              >
                {option}
              </button>
            ))}
          </div>
          
          {/* Message Input Row */}
          <div className="message-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Share what's on your mind... (${chatModes.find(m => m.id === chatMode)?.name} mode)`}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={loading || !input.trim()}
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default HealthChat; 