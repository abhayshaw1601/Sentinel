import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CriticalIndexProvider } from './context/CriticalIndexContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PatientDetail from './pages/PatientDetail';
import PatientDashboard from './pages/PatientDashboard';
import ChangePassword from './pages/ChangePassword';
import AIDemo from './pages/AIDemo';
import Navbar from './components/Navbar';
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
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <ErrorBoundary>
        {isAuthenticated && <Navbar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/patient-dashboard"
            element={<PatientDashboard />}
          />
          <Route
            path="/patient/:id"
            element={
              <PrivateRoute>
                <PatientDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-demo"
            element={
              <PrivateRoute>
                <AIDemo />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
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

