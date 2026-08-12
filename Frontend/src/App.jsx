import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute, { clearAuthVerifyCache } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Notification from './components/Notification';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorTest from './components/ErrorTest';
import Home from './pages/Home';
import AboutPage from './pages/About';
import ReportCrime from './pages/ReportCrime';
import TrackComplaint from './pages/TrackComplaint';
import SafetyTipsPage from './pages/SafetyTips';
import FAQPage from './pages/FAQ';
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import UserDashboard from './pages/UserDashboard';
import Profile from './pages/Profile';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetails from './pages/ComplaintDetails';
import AdminDashboard from './pages/AdminDashboard';
import ManageComplaints from './pages/ManageComplaints';
import ManageUsers from './pages/ManageUsers';
import ManageOfficers from './pages/ManageOfficers';
import ManageCategories from './pages/ManageCategories';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AppContent() {
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // Check for stored authentication data on mount
    const storedToken = localStorage.getItem('cyberAuthToken');
    const storedUser = localStorage.getItem('cyberAuthUser');
    
    if (storedToken && storedUser) {
      setAuthToken(storedToken);
      setAuthUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user, token) => {
    localStorage.setItem('cyberAuthToken', token);
    localStorage.setItem('cyberAuthUser', JSON.stringify(user));
    setAuthToken(token);
    setAuthUser(user);
    setNotice(`Welcome back, ${user.full_name || user.email}`);
  };

  const handleUserVerified = useCallback((user) => {
    setAuthUser(user);
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      if (authToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthVerifyCache();
      // Clear local storage regardless of API call success
      localStorage.removeItem('cyberAuthToken');
      localStorage.removeItem('cyberAuthUser');
      setAuthToken(null);
      setAuthUser(null);
      setNotice('You have been logged out.');
    }
  };

  return (
    <div className="App">
      <Navbar authUser={authUser} onLogout={handleLogout} />
      <Notification message={notice} type="success" onClose={() => setNotice('')} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/report" element={<ProtectedRoute authUser={authUser} authToken={authToken} onUserVerified={handleUserVerified}><ReportCrime /></ProtectedRoute>} />
          <Route path="/track" element={<ProtectedRoute authUser={authUser} authToken={authToken} onUserVerified={handleUserVerified}><TrackComplaint /></ProtectedRoute>} />
          <Route path="/safety" element={<SafetyTipsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onLogout={handleLogout} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<ProtectedRoute authUser={authUser} authToken={authToken} onUserVerified={handleUserVerified}><UserDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute authUser={authUser} authToken={authToken} onUserVerified={handleUserVerified}><Profile /></ProtectedRoute>} />
          <Route path="/my-complaints" element={<ProtectedRoute authUser={authUser} authToken={authToken} onUserVerified={handleUserVerified}><MyComplaints /></ProtectedRoute>} />
          <Route path="/complaint-details" element={<ProtectedRoute authUser={authUser} authToken={authToken} onUserVerified={handleUserVerified}><ComplaintDetails /></ProtectedRoute>} />
          <Route element={
            <ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']} onUserVerified={handleUserVerified}>
              <AdminLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="manage-complaints" element={<ManageComplaints />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="manage-officers" element={<ManageOfficers />} />
            <Route path="manage-categories" element={<ManageCategories />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer authUser={authUser} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
