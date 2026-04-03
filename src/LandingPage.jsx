import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaUserGraduate, FaGavel } from 'react-icons/fa';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleRoleSelect = (role) => {
        navigate(`/login?role=${role}`);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-blue-500/30">
            {/* Header */}
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text mb-4">
                    Welcome to Lawin
                </h1>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                    Select your primary role to continue. Each role provides specialized tools tailored to your precise needs.
                </p>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
                {/* 1. Lawyer Card */}
                <div 
                    onClick={() => handleRoleSelect('lawyer')}
                    className="group flex flex-col items-center p-10 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-3xl cursor-pointer transition-all duration-300 shadow-xl hover:shadow-amber-500/10 hover:-translate-y-2"
                >
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FaGavel className="text-4xl text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Lawyer</h2>
                    <p className="text-zinc-400 text-center text-sm">
                        Offer legal services, manage cases, and connect directly with clients in need of your expertise.
                    </p>
                </div>

                {/* 2. Student Card */}
                <div 
                    onClick={() => handleRoleSelect('student')}
                    className="group flex flex-col items-center p-10 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-3xl cursor-pointer transition-all duration-300 shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-2"
                >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FaUserGraduate className="text-4xl text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Student</h2>
                    <p className="text-zinc-400 text-center text-sm">
                        Learn, research, and collaborate on legal studies and connect with verified legal professionals.
                    </p>
                </div>

                {/* 3. User Card */}
                <div 
                    onClick={() => handleRoleSelect('user')}
                    className="group flex flex-col items-center p-10 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 rounded-3xl cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2"
                >
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FaUser className="text-4xl text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">User</h2>
                    <p className="text-zinc-400 text-center text-sm">
                        Seek consultations, discover certified lawyers, and resolve your legal cases effortlessly.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;