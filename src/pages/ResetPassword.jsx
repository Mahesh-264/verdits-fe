import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import { resetPassword } from '../api/authApi.js';

export default function ResetPassword() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'user';
  const [form, setForm] = useState({
    email: location.state?.email || window.sessionStorage.getItem('passwordResetEmail') || '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await resetPassword(form);
      window.sessionStorage.removeItem('passwordResetEmail');
      navigate(`/login?role=${role}`, {
        replace: true,
        state: { message: 'Password reset successful. Sign in with your new password.' },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f8fb] flex items-center justify-center p-4 text-[#062552]">
      <div className="w-full max-w-md rounded-2xl border border-[#d7e9ef] bg-white p-8 shadow-2xl shadow-[#062552]/10">
        <div className="mb-6 flex justify-center"><BrandLogo className="h-16 max-w-[230px]" /></div>
        <h1 className="text-center text-3xl font-bold">Reset password</h1>
        <Link to="/role-selection" className="mt-6 inline-flex text-sm font-semibold text-[#15a276] hover:underline">
          &larr; Back to Role Selection
        </Link>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input type="email" required value={form.email} onChange={update('email')} placeholder="Email Address" className="w-full rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] p-4 outline-none focus:border-[#15a276]" />
          <input type="text" inputMode="numeric" maxLength={6} required value={form.otp} onChange={update('otp')} placeholder="6-digit reset code" className="w-full rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] p-4 outline-none focus:border-[#15a276]" />
          <input type="password" minLength={8} required value={form.password} onChange={update('password')} placeholder="New Password" className="w-full rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] p-4 outline-none focus:border-[#15a276]" />
          <input type="password" minLength={8} required value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Confirm New Password" className="w-full rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] p-4 outline-none focus:border-[#15a276]" />
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#062552] py-4 font-bold text-white hover:bg-[#0b3b70] disabled:opacity-60">
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to={`/forgot-password?role=${role}`} className="text-sm font-semibold text-[#15a276]">Request another code</Link>
        </div>
      </div>
    </div>
  );
}
