import React, { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from './BrandLogo';

const PageHeader = React.memo(({ onBackClick }) => {
    const handleBack = useCallback(() => {
        onBackClick();
    }, [onBackClick]);

    return (
        <div className="w-full bg-[#062552] text-white p-4 flex items-center gap-4 shadow-md sticky top-0 z-20">
            <button
                onClick={handleBack}
                className="cursor-pointer hover:text-gray-300 transition"
                aria-label="Go back"
            >
                <ArrowLeft size={24} />
            </button>
            <BrandLogo className="h-10 max-w-[160px]" light />
            <span className="text-lg font-bold tracking-wide">Lawyer Profile</span>
        </div>
    );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
