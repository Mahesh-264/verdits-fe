import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth, setLoading } from '../redux/authSlice';
import api from '../api/axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { setAccessToken, setRefreshToken } from '../utils/authStorage';
import socket from '../utils/socket.jsx';
import BrandLogo from '../components/BrandLogo.jsx';

export default function Login() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    
    // States for All users
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleRedirect = (nextUser, options) => {
        if (nextUser.role === 'admin') navigate('/admin-dash', options);
        else if (nextUser.role === 'lawyer') navigate('/lawyer-dash', options);
        else if (nextUser.role === 'student') navigate('/student-home', options);
        else navigate('/user-home', options);
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            handleRedirect(user, { replace: true });
        }
    }, [isAuthenticated, user]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setErrorCode('');
        setIsSubmitting(true);
        dispatch(setLoading(true));

        try {
            const { data } = await api.post('/auth/login', {
                email: email.trim(),
                password,
                role,
            });
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            dispatch(setAuth(data.user));
            
            // 🔌 Connect socket immediately after login
            socket.auth.token = data.accessToken;
            if (!socket.connected) {
                socket.connect();
                console.log('🔌 Socket connected on login');
            }
            
            handleRedirect(data.user, { replace: true });
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Login failed. Please try again.');
            setErrorCode(err.response?.data?.code || '');
        } finally {
            dispatch(setLoading(false));
            setIsSubmitting(false);
        }
    };



    return (
        <div className="min-h-screen bg-[#f3f8fb] flex items-center justify-center p-4 font-sans text-[#062552]">
            <div className="w-full max-w-md bg-white border border-[#d7e9ef] p-8 rounded-3xl shadow-2xl shadow-[#062552]/10">
                <div className="flex justify-center mb-6">
                    <Link to="/" aria-label="Go to role selection">
                        <BrandLogo className="h-24 max-w-[300px]" />
                    </Link>
                </div>
                <h2 className="text-3xl font-bold text-center mb-2 capitalize">
                    {role} Login
                </h2>
                <p className="text-[#5f7488] text-center mb-8">Access your {role} dashboard</p>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        className="w-full bg-[#f7fbfc] p-4 rounded-xl outline-none border border-[#d7e9ef] focus:border-[#15a276] transition"
                        onChange={e => {
                            setEmail(e.target.value);
                            if (errorMessage) {
                                setErrorMessage('');
                                setErrorCode('');
                            }
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        className="w-full bg-[#f7fbfc] p-4 rounded-xl outline-none border border-[#d7e9ef] focus:border-[#15a276] transition"
                        onChange={e => {
                            setPassword(e.target.value);
                            if (errorMessage) {
                                setErrorMessage('');
                                setErrorCode('');
                            }
                        }}
                    />
                    {errorMessage && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            <p>{errorMessage}</p>
                            {errorCode === 'ACCOUNT_NOT_FOUND' && (
                                <p className="mt-2 text-red-100">
                                    New here?{' '}
                                    <Link to={`/register?role=${role}`} className="font-semibold underline underline-offset-2">
                                        Create your account
                                    </Link>
                                </p>
                            )}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl font-bold shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 bg-[#062552] text-white hover:bg-[#0b3b70]"
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-[#5f7488] text-sm">
                    Don't have an account?
                    <Link to={`/register?role=${role}`} className="text-[#15a276] font-semibold hover:text-[#118b66] hover:underline ml-1">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
