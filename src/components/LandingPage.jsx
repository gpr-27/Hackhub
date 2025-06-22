import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">HealthApp</div>
        <div className="auth-links">
          <Link to="/login" className="login-btn">Sign In</Link>
          <Link to="/register" className="register-btn">Sign Up</Link>
        </div>
      </header>

      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-content">
            <h1>Take control of your health journey</h1>
            <p>Track your mood, manage medications, practice mindfulness, and more with our comprehensive health toolkit.</p>
            <div className="hero-buttons">
              <Link to="/register" className="get-started-btn">Get Started</Link>
              <Link to="/login" className="learn-more-btn">Learn More</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="image-placeholder">
              <span className="emoji-group">
                <span className="emoji">😊</span>
                <span className="emoji">🧘</span>
                <span className="emoji">💊</span>
                <span className="emoji">📈</span>
              </span>
            </div>
          </div>
        </div>

        <div className="features-overview">
          <h2>All-in-one health companion</h2>
          <div className="feature-cards">
            <div className="feature-item">
              <div className="feature-icon">😊</div>
              <h3>Mood Tracking</h3>
              <p>Track your emotions and identify patterns to improve your mental wellbeing.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <h3>AI Support</h3>
              <p>Get personalized recommendations and support from our AI companion.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🧘</div>
              <h3>Mindfulness</h3>
              <p>Access guided meditations and relaxation techniques for stress relief.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <h3>Health Records</h3>
              <p>Keep all your important health information organized in one place.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} HealthApp. All rights reserved.</p>
        <div className="footer-links">
          <button type="button" className="footer-link">Privacy Policy</button>
          <button type="button" className="footer-link">Terms of Service</button>
          <button type="button" className="footer-link">Contact Us</button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 