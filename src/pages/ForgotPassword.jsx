import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import { requestPasswordReset } from '../api/authApi.js';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'user';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await requestPasswordReset(email.trim());
      window.sessionStorage.setItem('passwordResetEmail', email.trim());
      navigate(`/reset-password?role=${role}`, { state: { email: email.trim() } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send reset code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f8fb] flex items-center justify-center p-4 text-[#062552]">
      <div className="w-full max-w-md rounded-2xl border border-[#d7e9ef] bg-white p-8 shadow-2xl shadow-[#062552]/10">
        <div className="mb-6 flex justify-center"><BrandLogo className="h-16 max-w-[230px]" /></div>
        <h1 className="text-center text-3xl font-bold">Forgot password</h1>
        <p className="mt-2 text-center text-sm text-[#5f7488]">We will email you a 6-digit reset code.</p>
        <Link to="/role-selection" className="mt-6 inline-flex text-sm font-semibold text-[#15a276] hover:underline">
          &larr; Back to Role Selection
        </Link>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email Address"
            className="w-full rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] p-4 outline-none focus:border-[#15a276]"
          />
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#062552] py-4 font-bold text-white hover:bg-[#0b3b70] disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Send reset code'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to={`/login?role=${role}`} className="text-sm font-semibold text-[#15a276]">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
