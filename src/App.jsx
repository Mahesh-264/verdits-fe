import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // 🟢 Added Navigate
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth, logout, setInitialized } from './redux/authSlice';
import { getAccessToken } from './utils/authStorage';
import api from './api/axios.jsx';
import socket from './utils/socket.jsx';

// Auth Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import PendingApproval from './pages/PendingApproval.jsx';

// Existing Pages
import Chat from './pages/Chat.jsx';

import LandingPage from './LandingPage.jsx';
import MarketingSite from './landing/MarketingSite.jsx';
import UserHome from './Screens/UserHome.jsx';
import CaseSelection from './Screens/CaseSelection.jsx';
import LawyerList from './Screens/LawyerList.jsx';
import LawyerProfile from './Screens/LawyerProfile.jsx';
import UserProfile from './Screens/UserProfile.jsx';
import LawyerDashboard from './Screens/LawyerDashboard.jsx';
import InstantConsult from './Screens/InstantConsult.jsx';
import StudentHome from './Screens/StudentHome.jsx';
import StudentProfile from './Screens/StudentProfile.jsx';
import StudentExplore from './Screens/StudentExplore.jsx';
import StudentNetwork from './Screens/StudentNetwork.jsx';
import StudentJamSessions from './Screens/StudentJamSessions.jsx';
import StudentApplications from './Screens/StudentApplications.jsx';

// --- ROLE-BASED HUB ---
const DashboardHub = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'admin') return <Navigate to="/admin-dash" />;

  if (user.role === 'lawyer') {
    const isApproved = user.accountStatus === 'active' && user.lawyerProfile?.isVerified === true;
    if (!isApproved) {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/lawyer-dash" />;
  }
  if (user.role === 'student') return <Navigate to="/student-home" />;

  return <Navigate to="/user-home" />;
};

// --- SECURITY GATEKEEPER ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) return <div className="min-h-screen" aria-busy="true" />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  
  if (
    user?.role === 'lawyer' &&
    location.pathname !== '/pending-approval' &&
    (user?.accountStatus !== 'active' || user?.lawyerProfile?.isVerified === false)
  ) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        dispatch(setInitialized(true));
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        dispatch(setAuth(data));
        
        // 🔌 Connect socket immediately after successful authentication
        if (!socket.connected) {
          socket.auth.token = token; // Update token
          socket.connect();
        }
      } catch {
        dispatch(logout());
      } finally {
        dispatch(setInitialized(true));
      }
    };

    if (!isAuthenticated || getAccessToken()) {
      initializeAuth();
    } else {
      dispatch(setInitialized(true));
      // 🔌 Also connect socket if already authenticated (page refresh)
      if (!socket.connected) {
        const token = getAccessToken();
        if (token) {
          socket.auth.token = token;
          socket.connect();
        }
      }
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === 'auth:logout') {
        socket.disconnect();
        dispatch(logout());
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.replace('/role-selection');
      }
    };
    window.addEventListener('storage', syncLogout);
    return () => window.removeEventListener('storage', syncLogout);
  }, [dispatch]);

  return (
    <div className="min-h-screen lawyer-theme">
      <BrowserRouter>
        <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* --- Intelligent Redirector --- */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute allowedRoles={['user', 'lawyer', 'student', 'admin']}><DashboardHub /></ProtectedRoute>}
        />

        {/* 🟢 NEW USER FLOW ROUTES (Only for Users) */}
        <Route path="/user-home" element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserHome />
          </ProtectedRoute>
        } />

        <Route path="/book-lawyer" element={
          <ProtectedRoute allowedRoles={['user']}>
            <CaseSelection />
          </ProtectedRoute>
        } />

        <Route path="/instant-consult" element={
          <ProtectedRoute allowedRoles={['user']}>
            <InstantConsult />
          </ProtectedRoute>
        } />

        <Route path="/lawyers/:category" element={
          <ProtectedRoute allowedRoles={['user']}>
            <LawyerList />
          </ProtectedRoute>
        } />

        <Route path="/lawyer-profile/:id" element={
          <ProtectedRoute allowedRoles={['user', 'student']}>
            <LawyerProfile />
          </ProtectedRoute>
        } />

        {/* 🟢 Profile Route (Accessible by User & Lawyer) */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['user', 'lawyer']}>
            <UserProfile />
          </ProtectedRoute>
        } />

        {/* --- Shared / Lawyer Routes --- */}
        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={['user', 'lawyer']}>
            <Chat />
          </ProtectedRoute>
        } />

        <Route path="/lawyer-dash" element={
          <ProtectedRoute allowedRoles={['lawyer']}>
            <LawyerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/lawyer-dashboard" element={
          <ProtectedRoute allowedRoles={['lawyer']}>
            <LawyerDashboard />
          </ProtectedRoute>
        } />

        {/* --- Admin Dashboard --- */}
        <Route path="/admin-dash" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen p-8">
              <div className="max-w-5xl mx-auto rounded-3xl border border-[var(--verdicts-line)] bg-[var(--verdicts-panel)] p-8 shadow-xl shadow-[rgba(85,65,0,0.12)]">
                <h1 className="text-3xl font-bold text-[var(--verdicts-ink)]">Admin Panel</h1>
                <p className="mt-2 text-[var(--verdicts-muted)]">Lawyer verification and platform stats.</p>
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* --- Student Dashboard --- */}
        <Route path="/student-home" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentHome />
          </ProtectedRoute>
        } />

        <Route path="/student-profile" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfile />
          </ProtectedRoute>
        } />

        <Route path="/student-profile/:id" element={
          <ProtectedRoute allowedRoles={['student', 'lawyer']}>
            <StudentProfile />
          </ProtectedRoute>
        } />

        <Route path="/student-explore" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExplore />
          </ProtectedRoute>
        } />

        <Route path="/student-network" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentNetwork />
          </ProtectedRoute>
        } />

        <Route path="/student-jam" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentJamSessions />
          </ProtectedRoute>
        } />

        <Route path="/student-applications" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentApplications />
          </ProtectedRoute>
        } />

        <Route path="/role-selection" element={<LandingPage />} />
        {/* --- Global Redirects --- */}
        <Route path="/*" element={<MarketingSite />} />
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
