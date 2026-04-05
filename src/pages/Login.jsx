import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, setLoading } from '../redux/authSlice';
import api from '../api/axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

export default function Login() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';
    
    // States for All users
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
        dispatch(setLoading(true));
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('accessToken', data.accessToken);
            dispatch(setAuth(data.user));
            dispatch(setLoading(false));
            handleRedirect(data.user);
        } catch (err) {
            alert(err.response?.data?.message || 'Login Failed');
            dispatch(setLoading(false));
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
                        className="w-full bg-zinc-800 p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        className="w-full bg-zinc-800 p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button className={`w-full py-4 rounded-xl font-bold shadow-lg transition active:scale-95 ${role === 'lawyer' ? 'bg-amber-600 hover:bg-amber-700' : role === 'student' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        Sign In
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
