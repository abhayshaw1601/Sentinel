import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CriticalIndexProvider } from './context/CriticalIndexContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import PatientDetail from './pages/PatientDetail';
import PatientDashboard from './pages/PatientDashboard';
import ChangePassword from './pages/ChangePassword';
import AIDemo from './pages/AIDemo';
import Patients from './pages/Patients';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />

          <Route
            element={
              <PrivateRoute>
                <AppShell />
              </PrivateRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              }
            />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/ai-demo" element={<AIDemo />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CriticalIndexProvider>
          <AppContent />
        </CriticalIndexProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

