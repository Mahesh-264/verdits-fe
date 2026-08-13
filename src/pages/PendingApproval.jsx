import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import api from '../api/axios.jsx';

const VERIFICATION_TOKEN_KEY = 'lawyerVerificationToken';

export default function PendingApproval() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [details, setDetails] = useState({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const checkStatus = useCallback(async (manual = false) => {
    const verificationToken = window.sessionStorage.getItem(VERIFICATION_TOKEN_KEY);
    if (!verificationToken) {
      setMessage('Verification request could not be found. Please contact support.');
      return;
    }

    try {
      if (manual) setRefreshing(true);
      setMessage('');
      const { data } = await api.get('/auth/lawyer-verification-status', {
        headers: { Authorization: `Bearer ${verificationToken}` },
      });
      setStatus(data.status);
      setDetails(data);
      setRejectionReason(data.rejectionReason || 'Your lawyer registration could not be approved.');
      if (manual && data.status === 'pending') setMessage('Status checked: Pending Approval.');
    } catch (error) {
      setMessage(error.response?.status === 404
        ? 'Verification request could not be found. Please contact support.'
        : 'Unable to check verification status. Please try again.');
    } finally {
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (status !== 'approved') return undefined;
    const redirectTimer = window.setTimeout(() => {
      window.sessionStorage.removeItem(VERIFICATION_TOKEN_KEY);
      navigate('/login?role=lawyer', { replace: true });
    }, 1500);
    return () => window.clearTimeout(redirectTimer);
  }, [navigate, status]);

  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const name = [details.firstName, details.lastName].filter(Boolean).join(' ') || 'Lawyer';
  const barEnrollmentNumber = details.barEnrollmentNumber || 'N/A';

  const signOut = () => {
    window.sessionStorage.removeItem(VERIFICATION_TOKEN_KEY);
    navigate('/login?role=lawyer');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0b1f44] flex items-center justify-center p-4 md:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#f1d15f] to-[#d6a400] text-zinc-950 mb-3 shadow-[0_8px_25px_rgba(241,209,95,0.3)]"><ShieldCheck size={36} strokeWidth={2.5} /></div>
          <h1 className="text-3xl font-extrabold tracking-tight">VERDiTS</h1>
          <p className="text-xs font-bold tracking-widest text-[#ad5d12] uppercase mt-1">Lawyer Verification Portal</p>
        </div>

        <div className="bg-white border border-[#dbe2ef] rounded-[32px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(11,31,68,0.07)] text-center space-y-6 relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-2 ${isRejected ? 'bg-red-500' : isApproved ? 'bg-emerald-500' : 'bg-[#f1d15f]'}`} />
          <div className="flex flex-col items-center gap-3">
            <div className={`h-16 w-16 rounded-full border flex items-center justify-center shadow-inner ${isRejected ? 'bg-red-100 text-red-600 border-red-200' : isApproved ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-[#fff8df] text-[#ad5d12] border-[#f1d15f]'}`}>
              {isRejected ? <ShieldAlert size={36} /> : isApproved ? <CheckCircle2 size={36} /> : <Clock size={36} />}
            </div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${isRejected ? 'bg-red-50 text-red-700 border-red-200' : isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#fff8df] text-[#755617] border-[#f1d15f]'}`}>
              {isRejected ? <XCircle size={14} /> : isApproved ? <CheckCircle2 size={14} /> : <Clock size={14} />}
              {isRejected ? 'Verification Rejected' : isApproved ? 'Verification Approved' : 'Verification Pending'}
            </span>
            <h2 className="text-2xl font-extrabold mt-1">{isRejected ? 'Registration Verification Unsuccessful' : isApproved ? 'Your lawyer account has been successfully verified.' : 'Registration Under Verification'}</h2>
            <p className="text-sm text-[#5e6c87] max-w-md leading-relaxed">
              {isRejected ? 'Your lawyer registration could not be approved.' : isApproved ? 'Redirecting you to login...' : <>Hello Advocate <span className="font-bold text-[#0b1f44]">{name}</span>, your account details and Bar Council enrollment credentials have been submitted for manual verification.</>}
            </p>
          </div>

          {!isApproved && <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-left space-y-3">
            <div className="flex justify-between gap-2 pb-3 border-b border-[#e2e8f0]"><span className="text-xs font-bold uppercase tracking-wider text-[#5e6c87]">Bar Council Enrollment #</span><span className="font-mono font-extrabold text-sm px-3 py-1 bg-[#fff8df] border border-[#f1d15f] rounded-xl">{barEnrollmentNumber}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#5e6c87] font-semibold">Status Check</span><span className={`font-bold ${isRejected ? 'text-red-600' : 'text-[#ad5d12]'}`}>{isRejected ? 'Rejected' : 'Pending Approval'}</span></div>
            <div className="flex justify-between gap-4 text-xs"><span className="text-[#5e6c87] font-semibold">Registered Email</span><span className="font-semibold truncate">{details.email || 'N/A'}</span></div>
          </div>}

          {isRejected ? <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left text-xs text-red-900"><p className="font-bold flex gap-1.5 text-red-700"><AlertTriangle size={16} />Reason</p><p className="mt-2 leading-relaxed">{rejectionReason}</p></div>
            : !isApproved && <div className="p-4 rounded-2xl bg-[#fff8df] border border-[#f1d15f]/60 text-left text-xs text-[#755617]"><p className="font-bold flex gap-1.5 text-[#ad5d12]"><FileText size={16} />Status Check</p><p className="mt-1.5 leading-relaxed">Use Check Status to retrieve the latest verification result.</p></div>}
          {message && <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">{message}</div>}

          {!isApproved && <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button type="button" onClick={() => checkStatus(true)} disabled={refreshing} className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-extrabold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Checking Status...' : 'Check Status'}</button>
            <button type="button" onClick={signOut} className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl border border-[#dbe2ef] bg-white hover:bg-red-600 hover:text-white hover:border-red-600 font-bold text-xs transition flex items-center justify-center gap-2"><LogOut size={14} />Sign Out</button>
          </div>}
        </div>
      </div>
    </div>
  );
}
