import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaUser, FaUserGraduate, FaGavel } from 'react-icons/fa';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    const handleRoleSelect = (role) => {
        navigate(`/login?role=${role}`);
    };

    // The landing page is only for signed-out visitors. This prevents browser
    // back navigation from taking an active dashboard session back to it.
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(255,255,221,0.92)_0,rgba(255,255,221,0)_34%),linear-gradient(90deg,#fffdb7_0%,#fffcc8_42%,#fffde8_100%)] flex flex-col items-center justify-center p-6 text-[#062552] font-sans selection:bg-[#15a276]/20">
            {/* Header */}
            <div className="text-center mb-14 flex flex-col items-center">
                <img
                    src="/verdits-logo.png"
                    alt="VERDITS Justice Simplified"
                    className="mb-6 h-32 w-32 object-contain md:h-40 md:w-40"
                />
                <h1 className="text-4xl md:text-5xl font-bold text-[#062552] mb-4">
                    Welcome to VERDITS
                </h1>
                <p className="text-[#4b647c] text-lg max-w-xl mx-auto">
                    Select your primary role to continue. Each role provides specialized tools tailored to your precise needs.
                </p>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
                {/* 1. Lawyer Card */}
                <div 
                    onClick={() => handleRoleSelect('lawyer')}
                    className="group flex flex-col items-center p-10 bg-white border border-[#d7e9ef] hover:border-[#15a276]/60 rounded-3xl cursor-pointer transition-all duration-300 shadow-xl shadow-[#062552]/5 hover:shadow-[#15a276]/15 hover:-translate-y-2"
                >
                    <div className="w-20 h-20 bg-[#e8f7f2] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FaGavel className="text-4xl text-[#15a276]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#062552] mb-2">Lawyer</h2>
                    <p className="text-[#5f7488] text-center text-sm">
                        Offer legal services, manage cases, and connect directly with clients in need of your expertise.
                    </p>
                </div>

                {/* 2. Student Card */}
                <div 
                    onClick={() => handleRoleSelect('student')}
                    className="group flex flex-col items-center p-10 bg-white border border-[#d7e9ef] hover:border-[#15a276]/60 rounded-3xl cursor-pointer transition-all duration-300 shadow-xl shadow-[#062552]/5 hover:shadow-[#15a276]/15 hover:-translate-y-2"
                >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FaUserGraduate className="text-4xl text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#062552] mb-2">Student</h2>
                    <p className="text-[#5f7488] text-center text-sm">
                        Learn, research, and collaborate on legal studies and connect with verified legal professionals.
                    </p>
                </div>

                {/* 3. User Card */}
                <div 
                    onClick={() => handleRoleSelect('user')}
                    className="group flex flex-col items-center p-10 bg-white border border-[#d7e9ef] hover:border-[#062552]/40 rounded-3xl cursor-pointer transition-all duration-300 shadow-xl shadow-[#062552]/5 hover:shadow-[#062552]/10 hover:-translate-y-2"
                >
                    <div className="w-20 h-20 bg-[#eaf1f7] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FaUser className="text-4xl text-[#062552]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#062552] mb-2">User</h2>
                    <p className="text-[#5f7488] text-center text-sm">
                        Seek consultations, discover certified lawyers, and resolve your legal cases effortlessly.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
