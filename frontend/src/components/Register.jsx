import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { UserPlus, LogIn } from 'lucide-react';
import { SignUpButton, SignInButton, useAuth } from '@clerk/react';
import AuthLayout from './AuthLayout';
import { Button } from './ui/Button';
import { Loader } from './ui/Feedback';

// Sign-up screen. Account creation is handled by Clerk's hosted UI (modal).
const Register = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loader label="Loading…" />
      </div>
    );
  }
  if (isSignedIn) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your wellness journey in seconds."
      footer={<p>Already have an account? <Link to="/login">Sign in</Link></p>}
    >
      <div className="auth-form">
        <SignUpButton mode="modal" forceRedirectUrl="/dashboard" signInForceRedirectUrl="/dashboard">
          <Button type="button" size="lg" block><UserPlus size={18} /> Create account</Button>
        </SignUpButton>
        <SignInButton mode="modal" forceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard">
          <Button type="button" variant="secondary" size="lg" block><LogIn size={18} /> I already have an account</Button>
        </SignInButton>
      </div>
    </AuthLayout>
  );
};

export default Register;
