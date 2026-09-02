import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute, { clearAuthVerifyCache } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Notification from './components/Notification';
import ErrorBoundary from './components/ErrorBoundary';
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
import { API_URL } from './utils/apiConfig';
import {
  AUTH_SCOPES,
  clearAdminSession,
  clearUserSession,
  getAuthPair,
  migrateLegacyAuth,
  setAdminSession,
  setUserSession,
} from './utils/authStorage';

function AppContent() {
  const [userAuth, setUserAuth] = useState(null);
  const [adminAuth, setAdminAuth] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    migrateLegacyAuth();

    const userSession = getAuthPair(AUTH_SCOPES.USER);
    const adminSession = getAuthPair(AUTH_SCOPES.ADMIN);

    if (userSession) {
      setUserAuth(userSession);
    }

    if (adminSession) {
      setAdminAuth(adminSession);
    }
  }, []);

  const clearNotice = useCallback(() => setNotice(''), []);

  const handleUserLogin = (user, token) => {
    setUserSession(user, token);
    setUserAuth({ user, token });
    setNotice(`Welcome back, ${user.full_name || user.email}`);
  };

  const handleAdminLogin = (user, token) => {
    setAdminSession(user, token);
    setAdminAuth({ user, token });
    setNotice(`Welcome back, ${user.full_name || user.email}`);
  };

  const handleUserVerified = useCallback((user) => {
    setUserAuth((current) => (current ? { ...current, user } : current));
  }, []);

  const handleAdminVerified = useCallback((user) => {
    setAdminAuth((current) => (current ? { ...current, user } : current));
  }, []);

  const logoutScope = async (scope, token, clearState) => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthVerifyCache(scope);
      clearState();
    }
  };

  const handleUserLogout = async () => {
    const token = userAuth?.token;
    await logoutScope(AUTH_SCOPES.USER, token, () => {
      clearUserSession();
      setUserAuth(null);
      setNotice('You have been logged out.');
    });
  };

  const handleAdminLogout = async () => {
    const token = adminAuth?.token;
    await logoutScope(AUTH_SCOPES.ADMIN, token, () => {
      clearAdminSession();
      setAdminAuth(null);
    });
  };

  return (
    <div className="App">
      <Navbar
        authUser={userAuth?.user || adminAuth?.user || null}
        isAdmin={!!adminAuth?.user}
        onLogout={adminAuth?.user ? handleAdminLogout : handleUserLogout}
      />
      <Notification message={notice} type="success" onClose={clearNotice} autoHideMs={5000} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/report"
            element={
              <ProtectedRoute
                authScope={AUTH_SCOPES.USER}
                authUser={userAuth?.user}
                authToken={userAuth?.token}
                onUserVerified={handleUserVerified}
              >
                <ReportCrime />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track"
            element={
              <ProtectedRoute
                authScope={AUTH_SCOPES.USER}
                authUser={userAuth?.user}
                authToken={userAuth?.token}
                onUserVerified={handleUserVerified}
              >
                <TrackComplaint />
              </ProtectedRoute>
            }
          />
          <Route path="/safety" element={<SafetyTipsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/login"
            element={
              <LoginPage
                onUserLogin={handleUserLogin}
                onAdminLogin={handleAdminLogin}
              />
            }
          />
          <Route path="/register" element={<RegisterPage onRegister={handleUserLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                authScope={AUTH_SCOPES.USER}
                authUser={userAuth?.user}
                authToken={userAuth?.token}
                onUserVerified={handleUserVerified}
              >
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute
                authScope={AUTH_SCOPES.USER}
                authUser={userAuth?.user}
                authToken={userAuth?.token}
                onUserVerified={handleUserVerified}
              >
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute
                authScope={AUTH_SCOPES.USER}
                authUser={userAuth?.user}
                authToken={userAuth?.token}
                onUserVerified={handleUserVerified}
              >
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaint-details"
            element={
              <ProtectedRoute
                authScope={AUTH_SCOPES.USER}
                authUser={userAuth?.user}
                authToken={userAuth?.token}
                onUserVerified={handleUserVerified}
              >
                <ComplaintDetails />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute
                authScope={AUTH_SCOPES.ADMIN}
                authUser={adminAuth?.user}
                authToken={adminAuth?.token}
                allowedRoles={['admin']}
                onUserVerified={handleAdminVerified}
              >
                <AdminLayout onLogout={handleAdminLogout} />
              </ProtectedRoute>
            }
          >
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
      <Footer authUser={userAuth?.user || null} />
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
