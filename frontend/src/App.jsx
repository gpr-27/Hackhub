import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';

// Auth / public
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Core pages
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import HealthChat from './pages/HealthChat';
import Mental from './pages/Mental';
import MedicationTracker from './pages/MedicationTracker';

// Smart Health Record
import SmartHealthRecord from './pages/SmartHealthRecord';
import HealthRecordProfile from './pages/HealthRecordProfile';
import MedicalHistory from './pages/MedicalHistory';
import LabReports from './pages/LabReports';
import DoctorVisits from './pages/DoctorVisits';
import Prescriptions from './pages/Prescriptions';
import VitalSigns from './pages/VitalSigns';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <UserProvider>
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
          </UserProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
