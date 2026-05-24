import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, setLoading } from '../redux/authSlice';
import api from '../api/axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { setAccessToken, setRefreshToken } from '../utils/authStorage';

export default function Login() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';
    
    // States for All users
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleRedirect = (user) => {
        if (user.role === 'admin') navigate('/admin-dash');
        else if (user.role === 'lawyer') navigate('/lawyer-dash');
        else if (user.role === 'student') navigate('/student-home');
        else navigate('/user-home');
    };

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
            handleRedirect(data.user);
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Login failed. Please try again.');
            setErrorCode(err.response?.data?.code || '');
        } finally {
            dispatch(setLoading(false));
            setIsSubmitting(false);
        }
    };



    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-white">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-3xl font-bold text-center mb-2 capitalize">
                    {role} Login
                </h2>
                <p className="text-zinc-400 text-center mb-8">Access your {role} dashboard</p>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        className="w-full bg-zinc-800 p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
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
                        className="w-full bg-zinc-800 p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
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
                        className={`w-full py-4 rounded-xl font-bold shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${role === 'lawyer' ? 'bg-amber-600 hover:bg-amber-700' : role === 'student' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-zinc-500 text-sm">
                    Don't have an account?
                    <Link to={`/register?role=${role}`} className="text-blue-500 font-semibold hover:text-blue-400 hover:underline ml-1">
                        Register
                    </Link>
                </p>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-zinc-600 hover:text-zinc-400 text-sm transition">
                        &larr; Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}
