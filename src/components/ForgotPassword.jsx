import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation
    if (!email) {
      setMessage('Please enter your email address');
      setIsLoading(false);
      return;
    }

    // Check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.some(user => user.email === email);

    // Simulate API call with timeout
    setTimeout(() => {
      if (userExists) {
        setIsSubmitted(true);
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        setMessage('No account found with that email address.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email to receive password reset instructions</p>
        </div>

        {message && (
          <div className={`auth-message ${isSubmitted ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div className="auth-success">
            <p>Check your email for further instructions.</p>
            <p>If you don't receive an email within a few minutes, please check your spam folder.</p>
          </div>
        )}

        <div className="auth-footer">
          <p>Remember your password? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 