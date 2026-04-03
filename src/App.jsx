import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // 🟢 Added Navigate
import { useSelector } from 'react-redux';

// Auth Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Existing Pages
import Chat from './pages/Chat.jsx';

// 🟢 NEW User Flow Pages (from Screens folder)
import UserHome from './Screens/UserHome.jsx';
import CaseSelection from './Screens/CaseSelection.jsx';
import LawyerList from './Screens/LawyerList.jsx';
import LawyerProfile from './Screens/LawyerProfile.jsx';
import UserProfile from './Screens/UserProfile.jsx';

// --- ROLE-BASED HUB ---
const DashboardHub = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin-dash" />;

  // 🟢 LOGIC UPDATE: 
  // If role is 'lawyer', they go to Chat (to receive requests).
  // If role is 'user', they go to the new UserHome (to book lawyers).
  if (user.role === 'lawyer') return <Navigate to="/chat" />;

  return <Navigate to="/user-home" />;
};

// --- SECURITY GATEKEEPER ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <DashboardHub />;

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- Intelligent Redirector --- */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute allowedRoles={['user', 'lawyer', 'admin']}><DashboardHub /></ProtectedRoute>}
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

        <Route path="/lawyers/:category" element={
          <ProtectedRoute allowedRoles={['user']}>
            <LawyerList />
          </ProtectedRoute>
        } />

        <Route path="/lawyer-profile/:id" element={
          <ProtectedRoute allowedRoles={['user']}>
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

        {/* --- Admin Dashboard --- */}
        <Route path="/admin-dash" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-zinc-950 text-white p-8">
              <h1 className="text-3xl font-bold text-red-500">Admin Panel</h1>
              <p className="text-zinc-400 mt-2">Lawyer verification and platform stats.</p>
            </div>
          </ProtectedRoute>
        } />

        {/* --- Global Redirects --- */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}