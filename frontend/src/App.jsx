import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';
import { Loader } from './components/ui/Feedback';

// Public landing + the route guard stay eager so the first paint is instant
// (no Suspense flash on the entry page).
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';

// Everything behind auth is code-split: each page becomes its own chunk loaded
// on demand, so the initial download (and the heavy charting library several
// pages use) no longer ships to first-time / mobile visitors up front.
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MoodTracker = lazy(() => import('./pages/MoodTracker'));
const HealthChat = lazy(() => import('./pages/HealthChat'));
const Mental = lazy(() => import('./pages/Mental'));
const MedicationTracker = lazy(() => import('./pages/MedicationTracker'));

const SmartHealthRecord = lazy(() => import('./pages/SmartHealthRecord'));
const HealthRecordProfile = lazy(() => import('./pages/HealthRecordProfile'));
const MedicalHistory = lazy(() => import('./pages/MedicalHistory'));
const LabReports = lazy(() => import('./pages/LabReports'));
const DoctorVisits = lazy(() => import('./pages/DoctorVisits'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const VitalSigns = lazy(() => import('./pages/VitalSigns'));

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

// Full-viewport fallback shown while a route's chunk is fetched.
const RouteFallback = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
    <Loader label="Loading…" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <UserProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* Clerk handles password reset within its sign-in flow. */}
                <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

                {/* Core */}
                <Route path="/dashboard" element={guard(<Dashboard />)} />
                <Route path="/mood-tracker" element={guard(<MoodTracker />)} />
                <Route path="/health-chat" element={guard(<HealthChat />)} />
                <Route path="/mental" element={guard(<Mental />)} />
                <Route path="/medication-tracker" element={guard(<MedicationTracker />)} />

                {/* Smart Health Record */}
                <Route path="/smart-health-record" element={guard(<SmartHealthRecord />)} />
                <Route path="/smart-health-record/profile" element={guard(<HealthRecordProfile />)} />
                <Route path="/smart-health-record/medical-history" element={guard(<MedicalHistory />)} />
                <Route path="/smart-health-record/lab-reports" element={guard(<LabReports />)} />
                <Route path="/smart-health-record/doctor-visits" element={guard(<DoctorVisits />)} />
                <Route path="/smart-health-record/prescriptions" element={guard(<Prescriptions />)} />
                <Route path="/smart-health-record/vital-signs" element={guard(<VitalSigns />)} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </UserProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
