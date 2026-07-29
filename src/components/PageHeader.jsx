import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from './BrandLogo';

const PageHeader = React.memo(() => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const dashboardHome = user?.role === 'lawyer'
        ? '/lawyer-dash'
        : user?.role === 'student'
            ? '/student-home'
            : '/user-home';
    const handleBack = () => {
        navigate(dashboardHome, { replace: true });
    };

    return (
        <div className="relative w-full bg-[#f8f3e3]/95 text-[#0d1117] border-b border-[#d6b85b]/45 p-4 flex items-center gap-4 shadow-sm sticky top-0 z-20 backdrop-blur">
            <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d6b85b]/45 bg-white text-[#0d1117] transition hover:bg-[#fff2bf]"
                aria-label="Go back"
            >
                <ArrowLeft size={20} />
            </button>
            <button
                type="button"
                onClick={() => navigate(dashboardHome)}
                className="cursor-pointer transition hover:opacity-90"
                aria-label="Go to dashboard home"
            >
                <BrandLogo className="h-16" showWordmark />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-wide">Lawyer Profile</span>
        </div>
    );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
