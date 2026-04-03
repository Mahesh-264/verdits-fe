import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, setLoading } from '../redux/authSlice'; // Ensure path matches your folder structure
import api from '../api/axios'; // Ensure path matches your api config
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [loginType, setLoginType] = useState('password');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // OTP States
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 🟢 Helper function to handle redirection based on role
    const handleRedirect = (user) => {
        if (user.role === 'admin') {
            navigate('/admin-dash');
        } else if (user.role === 'lawyer') {
            navigate('/chat');
        } else {
            navigate('/user-home'); // Standard users go here
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        dispatch(setLoading(true));
        try {
            const { data } = await api.post('/auth/login', { phone, password });

            // 1. Update Redux
            dispatch(setAuth(data.user));
            dispatch(setLoading(false));

            // 2. Redirect based on Role
            handleRedirect(data.user);

        } catch (err) {
            alert(err.response?.data?.message || 'Login Failed');
            dispatch(setLoading(false));
        }
    };

    const handleSendOtp = async () => {
        try {
            await api.post('/auth/send-otp', { phone });
            setOtpSent(true);
            alert('OTP sent! (Check server console for code)');
        } catch (err) {
            alert(err.response?.data?.message || "Failed to send OTP");
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        dispatch(setLoading(true));
        try {
            const { data } = await api.post('/auth/verify-otp', { phone, otp });

            // 1. Update Redux
            dispatch(setAuth(data.user));
            dispatch(setLoading(false));

            // 2. Redirect based on Role
            handleRedirect(data.user);

        } catch (err) {
            alert(err.response?.data?.message || "Invalid OTP");
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-3xl font-bold text-white text-center mb-8">Welcome Back</h2>

                {/* Toggle Login Type */}
                <div className="flex bg-zinc-800 p-1 rounded-2xl mb-8">
                    <button
                        onClick={() => setLoginType('password')}
                        className={`flex-1 py-3 rounded-xl transition font-medium ${loginType === 'password' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Password
                    </button>
                    <button
                        onClick={() => setLoginType('otp')}
                        className={`flex-1 py-3 rounded-xl transition font-medium ${loginType === 'otp' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        OTP Login
                    </button>
                </div>

                {/* Password Form */}
                {loginType === 'password' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Phone Number"
                            required
                            className="w-full bg-zinc-800 text-white p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
                            onChange={e => setPhone(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            className="w-full bg-zinc-800 text-white p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-white shadow-lg transition active:scale-95">
                            Sign In
                        </button>
                    </form>
                ) : (
                    /* OTP Form */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Phone Number"
                            required
                            disabled={otpSent}
                            className={`w-full bg-zinc-800 text-white p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 transition ${otpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onChange={e => setPhone(e.target.value)}
                        />

                        {otpSent && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <input
                                    type="text"
                                    placeholder="Enter 6-Digit Code"
                                    required
                                    className="w-full bg-zinc-800 text-white p-4 rounded-xl outline-none border border-blue-500 mb-4 text-center tracking-widest text-xl"
                                    onChange={e => setOtp(e.target.value)}
                                />
                            </div>
                        )}

                        {!otpSent ? (
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                className="w-full bg-zinc-700 hover:bg-zinc-600 py-4 rounded-xl font-bold text-white transition"
                            >
                                Send OTP
                            </button>
                        ) : (
                            <button
                                className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-xl font-bold text-white shadow-lg transition active:scale-95"
                            >
                                Verify & Login
                            </button>
                        )}
                    </form>
                )}

                <p className="mt-8 text-center text-zinc-500 text-sm">
                    Don't have an account?
                    <Link to="/register" className="text-blue-500 font-semibold hover:text-blue-400 hover:underline ml-1">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}