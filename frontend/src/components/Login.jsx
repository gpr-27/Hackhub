import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, UserRound } from 'lucide-react';
import { SignInButton, SignUpButton, useAuth } from '@clerk/react';
import AuthLayout from './AuthLayout';
import { useAppUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';
import { Loader } from './ui/Feedback';

// Sign-in screen. Auth is handled by Clerk's hosted UI (modal); users can also
// continue anonymously as a guest (data persists in MongoDB under a guest id).
const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { loginAsGuest } = useAppUser();
  const { toast } = useToast();
  const [guestLoading, setGuestLoading] = useState(false);
  const from = location.state?.from?.pathname || '/dashboard';

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loader label="Loading…" />
      </div>
    );
  }
  if (isSignedIn) return <Navigate to={from} replace />;

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      navigate(from, { replace: true });
    } catch {
      toast.error('Could not start a guest session. Please try again.');
      setGuestLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your wellness journey."
      footer={<p>New here? <Link to="/register">Create an account</Link></p>}
    >
      <div className="auth-form">
        <SignInButton mode="modal" forceRedirectUrl={from} signUpForceRedirectUrl={from}>
          <Button type="button" size="lg" block><LogIn size={18} /> Sign in</Button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl={from} signInForceRedirectUrl={from}>
          <Button type="button" variant="secondary" size="lg" block><UserPlus size={18} /> Create an account</Button>
        </SignUpButton>

        <div className="auth-divider"><span>or</span></div>

        <Button type="button" variant="ghost" size="lg" block loading={guestLoading} onClick={handleGuest}>
          {!guestLoading && <UserRound size={18} />} Continue as guest
        </Button>
        <p className="auth-guest-note">No account needed — your data is saved and you can create an account later to keep it.</p>
      </div>
    </AuthLayout>
  );
};

export default Login;
