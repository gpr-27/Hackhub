import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MTracker from "./pages/MTracker";
import MoodTracker from "./pages/MoodTracker";
// Components
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
// Pages
import HealthChat from './pages/HealthChat';
// Smart Health Record components
import SmartHealthRecord from './pages/SmartHealthRecord';
import HealthRecordProfile from './pages/HealthRecordProfile';
import MedicalHistory from './pages/MedicalHistory';
import LabReports from './pages/LabReports';
import DoctorVisits from './pages/DoctorVisits';
import Prescriptions from './pages/Prescriptions';
import VitalSigns from './pages/VitalSigns';

import Mental from "./pages/mental";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/medication-tracker" element={
          <ProtectedRoute>
            <MTracker />
          </ProtectedRoute>
        } />
        <Route path="/mood-tracker" element={
          <ProtectedRoute>
            <MoodTracker />
          </ProtectedRoute>
        } />
        <Route path="/health-chat" element={
          <ProtectedRoute>
            <HealthChat />
          </ProtectedRoute>
        } />


         <Route path="/mental" element={
          <ProtectedRoute>
            <Mental />
          </ProtectedRoute>
        } />






        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        
        {/* Default dashboard route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Smart Health Record Routes */}
        <Route path="/smart-health-record" element={
          <ProtectedRoute>
            <SmartHealthRecord />
          </ProtectedRoute>
        } />
        <Route path="/smart-health-record/profile" element={
          <ProtectedRoute>
            <HealthRecordProfile />
          </ProtectedRoute>
        } />
        <Route path="/smart-health-record/medical-history" element={
          <ProtectedRoute>
            <MedicalHistory />
          </ProtectedRoute>
        } />
        <Route path="/smart-health-record/lab-reports" element={
          <ProtectedRoute>
            <LabReports />
          </ProtectedRoute>
        } />
        <Route path="/smart-health-record/doctor-visits" element={
          <ProtectedRoute>
            <DoctorVisits />
          </ProtectedRoute>
        } />
        <Route path="/smart-health-record/prescriptions" element={
          <ProtectedRoute>
            <Prescriptions />
          </ProtectedRoute>
        } />
        <Route path="/smart-health-record/vital-signs" element={
          <ProtectedRoute>
            <VitalSigns />
          </ProtectedRoute>
        } />
        


      </Routes>
    </BrowserRouter>
  );
}

export default App;