import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
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
  const location = useLocation();
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [notice, setNotice] = useState('');
  const hideFooter = location.pathname === '/login' || location.pathname === '/register';

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
          <Route path="/report" element={<ReportCrime />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/safety" element={<SafetyTipsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<ProtectedRoute authUser={authUser} authToken={authToken}><UserDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute authUser={authUser} authToken={authToken}><Profile /></ProtectedRoute>} />
          <Route path="/my-complaints" element={<ProtectedRoute authUser={authUser} authToken={authToken}><MyComplaints /></ProtectedRoute>} />
          <Route path="/complaint-details" element={<ProtectedRoute authUser={authUser} authToken={authToken}><ComplaintDetails /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/manage-complaints" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><ManageComplaints /></ProtectedRoute>} />
          <Route path="/manage-users" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/manage-officers" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><ManageOfficers /></ProtectedRoute>} />
          <Route path="/manage-categories" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><ManageCategories /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute authUser={authUser} authToken={authToken} allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
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
