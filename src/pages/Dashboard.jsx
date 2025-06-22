import React, { useState, useEffect, useCallback } from "react";
import "../styles/Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

const images = [
  'https://blog.apollohomecare.com/uploads/Contributions_of_Doctors_to_Patient_Care_5fe1e0dbcb.png',
  'https://www.inhousemedicare.com/wp-content/uploads/2023/06/Downloader.la-649bebb2e2a45.jpg',
  'https://img.freepik.com/free-vector/flat-smartphone-smart-watch-monitoring-heart-rate_88138-875.jpg',
  'https://static.vecteezy.com/system/resources/previews/008/136/365/large_2x/nurse-female-doctor-with-a-stethoscope-in-her-hands-on-a-medical-blue-background-healthcare-banner-copy-space-photo.jpeg',
  'https://parade.com/.image/c_limit%2Ccs_srgb%2Cq_auto:good%2Cw_700/MTk1NjMwOTc5NzY1Nzc0MjE5/get-well-soon-messages.webp'
];

const flashcards = [
  { title: "Smart Health Record", link: "/smart-health-record", img: "https://media.istockphoto.com/id/1065782564/photo/electronic-medical-record-with-patient-data-and-health-care-information-in-tablet-doctor.jpg?s=612x612&w=0&k=20&c=BeTN2FUR7xHx-dz36BAEIhnojxhGbAGSc5eWmmnfiVo=", icon: "📋" },
  { title: "Medication Tracker", link: "/medication-tracker", img: "https://img.freepik.com/free-vector/online-medicine-composition-with-image-smartphone-with-reminder-app-taking-pills_1284-54425.jpg?semt=ais_hybrid&w=740", icon: "💊" },
  { title: "Health Chat", link: "/health-chat", img: "https://cdn.prod.website-files.com/5d9bdb47e33988bf5815bfed/63887693cb240c4b124653ec_Live-Chat-HIPAA-Compliant-01.png", icon: "💬" },
  { title: "Mood Tracker", link: "/mood-tracker", img: "https://pamojaeducation.com/wp-content/uploads/2020/06/Psych-blog_mood-swings.jpg", icon: "😊" },
  { title: "Mental Lifestyle", link: "/mental", img: "https://i.pinimg.com/736x/24/55/1e/24551e0bff38598e829d45600b38c04f.jpg", icon: "🧘" }
];

function Dashboard() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userInfo, setUserInfo] = useState({ 
    name: 'Loading...', 
    email: 'Loading...', 
    avatar: null,
    isLoading: true 
  });
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const checkAuthAndFetchUser = useCallback(async () => {
    try {
      // First check if user is authenticated
      const authResponse = await fetch(`${API_BASE_URL}/api/auth/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!authResponse.ok) {
        throw new Error('Not authenticated');
      }

      const authData = await authResponse.json();
      
      if (!authData.isAuthenticated) {
        navigate('/login');
        return;
      }

      // If authenticated, fetch user profile
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserInfo({
          name: userData.name || userData.username || 'User',
          email: userData.email || 'No email provided',
          avatar: userData.avatar || null,
          id: userData.id || userData._id,
          isLoading: false
        });
      } else {
        // Fallback to auth data if profile fetch fails
        setUserInfo({
          name: authData.user?.name || authData.user?.username || 'User',
          email: authData.user?.email || 'No email provided',
          avatar: authData.user?.avatar || null,
          id: authData.user?.id || authData.user?._id,
          isLoading: false
        });
      }
    } catch (error) {
      setAuthError('Failed to load user data');
      setUserInfo({
        name: 'Guest User',
        email: 'Please login',
        avatar: null,
        isLoading: false
      });
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [navigate]);

  // Fetch user info on component mount and check authentication
  useEffect(() => {
    checkAuthAndFetchUser();
  }, [checkAuthAndFetchUser]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // Clear JWT token from localStorage
      localStorage.removeItem('authToken');
      console.log('🔑 JWT token removed from localStorage');

      if (response.ok) {
        navigate('/login');
      }
    } catch (error) {
      // Force logout even if request fails
      localStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-bg">
      {/* Modern Navigation Bar */}
      <nav className="modern-navbar">
        <div className="navbar-left">
          <div className="logo-section">
            <img
              src="https://as2.ftcdn.net/v2/jpg/01/14/25/89/1000_F_114258941_xSOzsHQcmPORjc9IdrzZLTC3LpHXRK4F.jpg"
              alt="Logo"
              className="navbar-logo"
            />
            <span className="brand-name">HealthCare+</span>
          </div>
        </div>

        <div className="navbar-center">
          <div className="nav-links">
            <Link to="/dashboard" className="nav-link active">
              <span className="nav-icon">🏠</span>
              Dashboard
            </Link>
            <Link to="/smart-health-record" className="nav-link">
              <span className="nav-icon">📋</span>
              Health Records
            </Link>
            <Link to="/health-chat" className="nav-link">
              <span className="nav-icon">💬</span>
              Mental Health Chat
            </Link>
          </div>
        </div>

        <div className="navbar-right">
          {authError && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {authError}
            </div>
          )}
          
          <div className="profile-section">
            <button 
              className="profile-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              disabled={userInfo.isLoading}
            >
              <div className="profile-avatar">
                {userInfo.avatar ? (
                  <img 
                    src={userInfo.avatar} 
                    alt="Profile" 
                    className="avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="avatar-icon" style={{ display: userInfo.avatar ? 'none' : 'flex' }}>
                  {userInfo.isLoading ? '⏳' : '👤'}
                </span>
              </div>
              <div className="profile-info">
                <span className="profile-name">
                  {userInfo.isLoading ? 'Loading...' : userInfo.name}
                </span>
                <span className="profile-email">
                  {userInfo.isLoading ? 'Loading...' : userInfo.email}
                </span>
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfileDropdown && !userInfo.isLoading && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {userInfo.avatar ? (
                        <img src={userInfo.avatar} alt="Profile" className="dropdown-avatar-img" />
                      ) : (
                        <span className="dropdown-avatar-icon">👤</span>
                      )}
                    </div>
                    <div className="dropdown-user-details">
                      <span className="dropdown-user-name">{userInfo.name}</span>
                      <span className="dropdown-user-email">{userInfo.email}</span>
                      {userInfo.id && (
                        <span className="dropdown-user-id">ID: {userInfo.id.slice(-8)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => navigate('/profile-settings')}>
                  <span className="dropdown-icon">👤</span>
                  Profile Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Photo Slider */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Your Health, Our Priority</h1>
            <p className="hero-subtitle">
              Comprehensive healthcare management at your fingertips. 
              Track, monitor, and improve your health journey with our advanced tools.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Secure</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">AI</span>
                <span className="stat-label">Powered</span>
              </div>
            </div>
          </div>
          
          <div className="hero-slider">
            <div className="slider-container">
              {images.map((src, idx) => (
                <div
                  key={idx}
                  className={`slide ${current === idx ? 'active' : ''}`}
                >
                  <img
                    src={src}
                    alt={`Healthcare ${idx + 1}`}
                    className="slide-image"
                  />
                </div>
              ))}
            </div>
            <div className="slider-dots">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={`dot ${current === idx ? 'active' : ''}`}
                  onClick={() => setCurrent(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Your Health Dashboard</h2>
          <p className="section-subtitle">
            Access all your health management tools in one place
          </p>
        </div>

        <div className="features-grid">
          {flashcards.map((card, index) => (
            <Link to={card.link} className="feature-card" key={card.title}>
              <div className="card-header">
                <div className="card-icon">{card.icon}</div>
                <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
              </div>
              <div className="card-image">
                <img src={card.img} alt={card.title} />
                <div className="card-overlay"></div>
              </div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">
                  {card.title === "Smart Health Record" && "Manage your complete medical history and records"}
                  {card.title === "Medication Tracker" && "Track your medications and never miss a dose"}
                  {card.title === "Health Chat" && "Get instant AI-powered health assistance"}
                  {card.title === "Mood Tracker" && "Monitor your mental health and mood patterns"}
                  {card.title === "Mental Lifestyle" && "Improve your mental wellness and lifestyle"}
                </p>
                <div className="card-arrow">→</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>HealthCare+</h4>
            <p>Your trusted partner in health management. Secure, reliable, and always available.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/smart-health-record">Health Records</Link></li>
              <li><Link to="/medication-tracker">Medications</Link></li>
              <li><Link to="/health-chat">Mental Health Chat</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} HealthCare+. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;