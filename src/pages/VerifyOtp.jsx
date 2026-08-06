import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import BrandLogo from '../components/BrandLogo.jsx';
import { resendRegistrationOtp, verifyRegistrationOtp } from '../api/authApi.js';
import { setAuth } from '../redux/authSlice.jsx';
import { storeAuthSession } from '../utils/authStorage.js';
import { getDashboardPath } from '../utils/authRedirect.js';
import socket from '../utils/socket.jsx';

const readPending = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem('pendingRegistration') || 'null');
  } catch {
    return null;
  }
};

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const pending = readPending();
  const email = searchParams.get('email') || pending?.email || '';
  const role = searchParams.get('role') || pending?.role || 'user';
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  const updateDigit = (index, value) => {
    const nextValue = value.replace(/\D/g, '').slice(-1);
    setDigits((current) => current.map((digit, digitIndex) => digitIndex === index ? nextValue : digit));
    if (nextValue && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] || ''));
    inputs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Enter the complete 6-digit code');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const session = await verifyRegistrationOtp({ email, role, otp });
      storeAuthSession(session, false);
      dispatch(setAuth(session.user));
      window.sessionStorage.removeItem('pendingRegistration');
      window.sessionStorage.removeItem('googleSignup');
      socket.auth.token = session.accessToken;
      if (!socket.connected) socket.connect();
      navigate(getDashboardPath(session.user.role), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await resendRegistrationOtp({ email, role });
      setDigits(Array(6).fill(''));
      setSeconds(30);
      setMessage('A new code was sent to your email.');
      inputs.current[0]?.focus();
    } catch (requestError) {
      const retryAfter = requestError.response?.data?.retryAfter;
      if (retryAfter) setSeconds(retryAfter);
      setError(requestError.response?.data?.message || 'Unable to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f8fb] flex items-center justify-center p-4 text-[#062552]">
      <div className="w-full max-w-md rounded-2xl border border-[#d7e9ef] bg-white p-8 shadow-2xl shadow-[#062552]/10">
        <div className="mb-6 flex justify-center">
          <BrandLogo className="h-16 max-w-[230px]" />
        </div>
        <h1 className="text-center text-3xl font-bold">Verify your email</h1>
        <p className="mt-2 text-center text-sm text-[#5f7488]">
          Enter the 6-digit code sent to <span className="font-semibold text-[#062552]">{email}</span>
        </p>
        <Link to="/role-selection" className="mt-6 inline-flex text-sm font-semibold text-[#15a276] hover:underline">
          &larr; Back to Role Selection
        </Link>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputs.current[index] = element; }}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !digits[index] && index > 0) {
                    inputs.current[index - 1]?.focus();
                  }
                }}
                inputMode="numeric"
                aria-label={`OTP digit ${index + 1}`}
                className="aspect-square min-w-0 rounded-lg border border-[#d7e9ef] bg-[#f7fbfc] text-center text-xl font-bold outline-none focus:border-[#15a276]"
              />
            ))}
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            disabled={submitting || !email}
            className="mt-6 w-full rounded-xl bg-[#062552] py-4 font-bold text-white transition hover:bg-[#0b3b70] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Verifying...' : 'Verify and continue'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={seconds > 0 || !email}
          className="mt-4 w-full text-sm font-semibold text-[#15a276] disabled:text-[#8a95ab]"
        >
          {seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}
        </button>

        <div className="mt-6 text-center">
          <Link to={`/register?role=${role}`} className="text-sm text-[#5f7488] hover:text-[#062552]">
            Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}
