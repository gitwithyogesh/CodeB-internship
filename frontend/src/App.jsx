import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import Login from './views/Login';
import Register from './views/Register';
import ForgotPassword from './views/ForgotPassword';
import ResetPassword from './views/ResetPassword';
import Verify from './views/Verify';
import DashboardPlaceholder from './views/DashboardPlaceholder';

// Session Timeout Monitor Wrapper
function SessionTimeoutWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 seconds warning

  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    // Set initial activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString());

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Listen to user interactions
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Dynamic inactivity check
    // Total inactivity allowed = 15 minutes (900,000 ms)
    // Show warning after 14 minutes (840,000 ms)
    const timeoutThreshold = 14 * 60 * 1000; 
    const forceLogoutThreshold = 15 * 60 * 1000;

    const interval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      const timeElapsed = Date.now() - lastActivity;

      if (timeElapsed >= forceLogoutThreshold) {
        // Logout user
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setShowWarning(false);
        navigate('/login?sessionExpired=true');
      } else if (timeElapsed >= timeoutThreshold) {
        // Show remaining seconds warning
        const remainingSeconds = Math.max(0, Math.round((forceLogoutThreshold - timeElapsed) / 1000));
        setCountdown(remainingSeconds);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated, navigate, location.pathname]);

  const keepSessionAlive = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
    setShowWarning(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowWarning(false);
    navigate('/login');
  };

  return (
    <>
      {children}
      
      {showWarning && (
        <div className="inactivity-overlay">
          <div className="inactivity-modal glass animate-fade">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <AlertTriangle size={48} color="var(--warning)" style={{ animation: 'pulse 1.5s infinite' }} />
            </div>
            <h3>Inactivity Warning</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              You have been inactive for a while. For security reasons, your session will expire in{' '}
              <strong style={{ color: 'var(--warning)', fontSize: '16px' }}>{countdown}</strong> seconds.
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
              <button onClick={keepSessionAlive} className="btn btn-primary" style={{ flex: 1 }}>
                Stay Signed In
              </button>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ flex: 1 }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Protected Route Guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <SessionTimeoutWrapper>{children}</SessionTimeoutWrapper>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify" element={<Verify />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPlaceholder />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
