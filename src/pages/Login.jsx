import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, setLoading } from '../redux/authSlice';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { authenticateWithGoogle, loginAccount } from '../api/authApi.js';
import { storeAuthSession } from '../utils/authStorage';
import { getDashboardPath } from '../utils/authRedirect.js';
import socket from '../utils/socket.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const getPasswordErrorMessage = (value) => {
    const passwordStr = String(value || '');
    if (!passwordStr) return '';
    if (passwordStr.length < 8) {
        return 'Password must be Minimum 8';
    }
    const hasUppercase = /[A-Z]/.test(passwordStr);
    const hasLowercase = /[a-z]/.test(passwordStr);
    const hasNumber = /[0-9]/.test(passwordStr);
    const hasSpecial = /[^A-Za-z0-9]/.test(passwordStr);
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        return 'Password must contain at least one uppercase letter, lowercase letter, number, and special character.';
    }
    return '';
};

export default function Login() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';
    
    // States for All users
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [errorField, setErrorField] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const getSafeDestination = (user) => {
        const from = location.state?.from;
        return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
            ? from
            : getDashboardPath(user.role);
    };

    const handleRedirect = (nextUser, options) => {
        navigate(getSafeDestination(nextUser), { replace: true, ...options });
    };

    const connectSocket = (accessToken) => {
        socket.auth.token = accessToken;
        if (!socket.connected) {
            socket.connect();
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setErrorCode('');
        setErrorField('');

        if (!isValidEmail(email)) {
            setErrorMessage('Enter a valid email address.');
            setErrorField('email');
            return;
        }

        const passwordError = getPasswordErrorMessage(password);
        if (passwordError) {
            setErrorMessage(passwordError);
            setErrorField('password');
            return;
        }

        setIsSubmitting(true);
        dispatch(setLoading(true));

        try {
            const data = await loginAccount({
                email: email.trim(),
                password,
                role,
            });
            storeAuthSession(data, remember);
            dispatch(setAuth(data.user));
            connectSocket(data.accessToken);
            handleRedirect(data.user);
        } catch (err) {
            const response = err.response?.data;
            const message = err.code === 'ECONNABORTED'
                ? 'The request timed out. Please try again.'
                : !err.response
                    ? 'The server is unavailable. Please check your connection and try again.'
                    : response?.message || 'Unable to sign in. Please try again.';
            setErrorMessage(message);
            setErrorCode(response?.code || '');
            setErrorField(response?.field || '');
        } finally {
            dispatch(setLoading(false));
            setIsSubmitting(false);
        }
    };

    const handleGoogleSuccess = async ({ credential }) => {
        setErrorMessage('');
        setErrorCode('');
        setIsSubmitting(true);

        try {
            const result = await authenticateWithGoogle({ credential, role });

            if (result.requiresProfile) {
                const googleSignup = {
                    completionToken: result.completionToken,
                    googleProfile: result.googleProfile,
                    role,
                    remember,
                };
                window.sessionStorage.setItem('googleSignup', JSON.stringify(googleSignup));
                navigate(`/register?role=${role}`, {
                    state: { googleSignup },
                });
                return;
            }

            storeAuthSession(result, remember);
            dispatch(setAuth(result.user));
            connectSocket(result.accessToken);
            navigate(getSafeDestination(result.user), { replace: true });
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Google sign-in failed.');
            setErrorCode(err.response?.data?.code || '');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f8fb] flex items-center justify-center p-4 font-sans text-[#062552]">
            <div className="w-full max-w-md bg-white border border-[#d7e9ef] p-8 rounded-3xl shadow-2xl shadow-[#062552]/10">
                <div className="flex justify-center mb-6">
                    <Link to="/role-selection" aria-label="Go to role selection">
                        <BrandLogo className="h-24 max-w-[300px]" />
                    </Link>
                </div>
                <h2 className="text-3xl font-bold text-center mb-2 capitalize">
                    {role} Login
                </h2>
                <p className="text-[#5f7488] text-center mb-8">Access your {role} dashboard</p>
                <Link to="/role-selection" className="mb-6 inline-flex text-sm font-semibold text-[#15a276] hover:underline">
                    &larr; Back to Role Selection
                </Link>

                <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErrorMessage('Google sign-in was cancelled or failed.')}
                    disabled={isSubmitting}
                />

                <div className="my-5 flex items-center gap-3 text-xs uppercase text-[#8a95ab]">
                    <span className="h-px flex-1 bg-[#d7e9ef]" />
                    <span>or sign in with email</span>
                    <span className="h-px flex-1 bg-[#d7e9ef]" />
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        aria-invalid={errorField === 'email'}
                        className={`w-full bg-[#f7fbfc] p-4 rounded-xl outline-none border focus:border-[#15a276] transition ${errorField === 'email' ? 'border-red-500' : 'border-[#d7e9ef]'}`}
                        onChange={e => {
                            setEmail(e.target.value);
                            if (errorMessage) {
                                setErrorMessage('');
                                setErrorCode(''); setErrorField('');
                            }
                        }}
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            required
                            minLength={8}
                            value={password}
                            aria-invalid={errorField === 'password'}
                            className={`w-full bg-[#f7fbfc] p-4 pr-16 rounded-xl outline-none border focus:border-[#15a276] transition ${errorField === 'password' ? 'border-red-500' : 'border-[#d7e9ef]'}`}
                            onChange={e => {
                                setPassword(e.target.value);
                                if (errorMessage) {
                                    setErrorMessage('');
                                    setErrorCode(''); setErrorField('');
                                }
                            }}
                        />
                        {password && (
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-[#15a276] hover:text-[#0f8968]"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? 'Hide' : 'View'}
                            </button>
                        )}
                    </div>
                    {password && getPasswordErrorMessage(password) && (
                        <p className="text-sm text-red-600">{getPasswordErrorMessage(password)}</p>
                    )}

                    <div className="flex items-center justify-between gap-4 text-sm">
                        <label className="flex items-center gap-2 text-[#5f7488]">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(event) => setRemember(event.target.checked)}
                                className="h-4 w-4 accent-[#15a276]"
                            />
                            Remember me
                        </label>
                        <Link to={`/forgot-password?role=${role}`} className="font-semibold text-[#15a276] hover:underline">
                            Forgot Password
                        </Link>
                    </div>

                    {errorMessage && (
                        <div
                            data-error-code={errorCode || undefined}
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                                errorCode === 'ACCOUNT_PENDING_APPROVAL'
                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                    : 'border-red-300 bg-red-50 text-red-900'
                            }`}
                        >
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-2xl bg-[#15a276] px-6 py-4 text-white font-semibold transition hover:bg-[#0f8968] disabled:cursor-not-allowed disabled:bg-[#8dc7b7]"
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </button>

                    <p className="text-center text-sm text-[#5f7488]">
                        Don&apos;t have an account?{' '}
                        <Link to={`/register?role=${role}`} className="text-[#15a276] hover:underline font-medium">
                            Create your account
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
