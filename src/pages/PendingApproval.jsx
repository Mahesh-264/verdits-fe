import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  LogOut,
  RefreshCw,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { logout, setAuth } from '../redux/authSlice';
import api from '../api/axios.jsx';

export default function PendingApproval() {
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [isRejectedOrDeleted, setIsRejectedOrDeleted] = useState(false);
  const [isApprovedState, setIsApprovedState] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isApproved = isApprovedState || (user?.accountStatus === 'active' && user?.lawyerProfile?.isVerified === true);
  const isRejected = isRejectedOrDeleted || user?.accountStatus === 'rejected';
  const barEnrollmentNumber = user?.lawyerProfile?.barId || user?.lawyerProfile?.barEnrollmentNumber || 'N/A';

  // Check live status from backend
  const checkLiveStatus = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setRefreshMessage('');

      const { data } = await api.get('/auth/me');
      const updatedUser = data.user || data;

      if (updatedUser.accountStatus === 'active' && updatedUser.lawyerProfile?.isVerified === true) {
        setIsApprovedState(true);
        setIsRejectedOrDeleted(false);
        dispatch(setAuth(updatedUser));
        if (isManual) setRefreshMessage('Verified / Approved — You can now sign in.');
      } else if (updatedUser.accountStatus === 'rejected') {
        setIsRejectedOrDeleted(true);
        if (isManual) setRefreshMessage('Application Rejected: Your registration was not approved.');
      } else {
        dispatch(setAuth(updatedUser));
        if (isManual) setRefreshMessage('Status checked: Still pending administrator verification.');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        // Account deleted / rejected by admin
        setIsRejectedOrDeleted(true);
        if (isManual) setRefreshMessage('Application Rejected: Your registration record was removed by the administrator.');
      } else if (isManual) {
        setRefreshMessage('Unable to check status right now. Please try again.');
      }
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, [dispatch]);

  // Polling every 4 seconds for dynamic state detection
  useEffect(() => {
    checkLiveStatus(false);
    const interval = setInterval(() => {
      checkLiveStatus(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [checkLiveStatus]);

  const handleManualCheck = () => {
    checkLiveStatus(true);
  };

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/login?role=lawyer');
  };

  const handleRegisterAgain = () => {
    dispatch(logout());
    navigate('/register');
  };

  const handleEnterDashboard = () => {
    navigate('/lawyer-dash', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0b1f44] flex flex-col items-center justify-center p-4 md:p-6 selection:bg-[#f1d15f] selection:text-zinc-950 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-xl">
        {/* VERDiTS Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#f1d15f] to-[#d6a400] text-zinc-950 mb-3 shadow-[0_8px_25px_rgba(241,209,95,0.3)]">
            <ShieldCheck size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0b1f44]">VERDiTS</h1>
          <p className="text-xs font-bold tracking-widest text-[#ad5d12] uppercase mt-1">Lawyer Verification Portal</p>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-[#dbe2ef] rounded-[32px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(11,31,68,0.07)] text-center space-y-6 relative overflow-hidden">
          {/* Top Banner Accent */}
          <div className={`absolute top-0 left-0 right-0 h-2 ${isRejected ? 'bg-red-500' : isApproved ? 'bg-emerald-500' : 'bg-[#f1d15f]'}`}></div>

          {/* Badge & Icon */}
          <div className="flex flex-col items-center gap-3">
            {isRejected ? (
              <>
                <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shadow-inner">
                  <ShieldAlert size={36} />
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
                  <XCircle size={14} />
                  Application Rejected
                </span>
              </>
            ) : isApproved ? (
              <>
                <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Verified / Approved
                </span>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-[#fff8df] text-[#ad5d12] border border-[#f1d15f] flex items-center justify-center shadow-inner">
                  <Clock size={36} className="animate-pulse" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#fff8df] text-[#755617] border border-[#f1d15f] uppercase tracking-wider">
                  Verification Pending
                </span>
              </>
            )}

            <h2 className="text-2xl font-extrabold text-[#0b1f44] mt-1">
              {isRejected
                ? 'Application Rejected'
                : isApproved
                ? 'Verified / Approved'
                : 'Registration Under Verification'}
            </h2>

            <p className="text-sm text-[#5e6c87] max-w-md leading-relaxed">
              Hello Advocate <span className="font-bold text-[#0b1f44]">{user?.firstName || 'Lawyer'}</span>,{' '}
              {isRejected
                ? 'your registration application was not approved by the administrator and has been removed from the system.'
                : isApproved
                ? 'your Bar Council enrollment and lawyer profile have been verified successfully. You can now sign in and enter your dashboard.'
                : 'your account details and Bar Council enrollment credentials have been submitted for manual verification.'}
            </p>
          </div>

          {/* Details Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e2e8f0]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5e6c87]">
                Bar Council Enrollment #
              </span>
              <span className="font-mono font-extrabold text-sm text-[#0b1f44] px-3 py-1 bg-[#fff8df] border border-[#f1d15f] rounded-xl self-start sm:self-auto">
                {barEnrollmentNumber}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#5e6c87] font-semibold">Status Check</span>
              <span className={`font-bold capitalize ${isRejected ? 'text-red-600' : isApproved ? 'text-emerald-600' : 'text-[#ad5d12]'}`}>
                {isRejected ? 'Application Rejected' : isApproved ? 'Approved & Verified' : 'Pending Approval'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5e6c87] font-semibold">Registered Email</span>
              <span className="font-semibold text-[#0b1f44] truncate max-w-[220px]">{user?.email || 'N/A'}</span>
            </div>
          </div>

          {/* Specific Context Banner */}
          {isRejected ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left space-y-2 text-xs text-red-900">
              <p className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertTriangle size={16} />
                Application Rejected Notice
              </p>
              <p className="leading-relaxed text-red-800">
                Your registration application was declined during Bar Council verification. The registration request has been removed. If you have valid Bar Council credentials, you may register again.
              </p>
            </div>
          ) : isApproved ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 size={16} />
                Verified / Approved — You can now sign in
              </p>
              <p className="leading-relaxed">
                Your Bar Council enrollment credentials have been verified by the administrator. Click below to enter your Lawyer Dashboard.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#fff8df] border border-[#f1d15f]/60 text-left space-y-1.5 text-xs text-[#755617]">
              <p className="font-bold flex items-center gap-1.5 text-[#ad5d12]">
                <FileText size={16} />
                Live Status Synchronization
              </p>
              <p className="leading-relaxed">
                Our system checks verification status automatically. Once the administrator approves your request, this page will update dynamically.
              </p>
            </div>
          )}

          {refreshMessage && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
              {refreshMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isApproved ? (
              <button
                type="button"
                onClick={handleEnterDashboard}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99]"
              >
                <span>Enter Lawyer Dashboard</span>
                <ArrowRight size={16} />
              </button>
            ) : isRejected ? (
              <>
                <button
                  type="button"
                  onClick={handleRegisterAgain}
                  className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-extrabold text-xs tracking-wide transition shadow-md flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99]"
                >
                  <UserPlus size={14} />
                  <span>Register Again</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl border border-[#dbe2ef] bg-white hover:bg-red-600 hover:text-white hover:border-red-600 text-[#0b1f44] font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm touch-manipulation active:scale-[0.99]"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={refreshing}
                  className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-extrabold text-xs tracking-wide transition shadow-[0_4px_15px_rgba(241,209,95,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation active:scale-[0.99]"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Checking Status...' : 'Check Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl border border-[#dbe2ef] bg-white hover:bg-red-600 hover:text-white hover:border-red-600 text-[#0b1f44] font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm touch-manipulation active:scale-[0.99]"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
