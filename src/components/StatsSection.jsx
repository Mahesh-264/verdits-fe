import React from 'react';

const StatCard = React.memo(({ value, label, color }) => (
    <div className="text-center">
        <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
    </div>
));

StatCard.displayName = 'StatCard';

const StatsSection = React.memo(({ profile }) => {
    return (
        <div className="w-full max-w-md flex justify-between px-8 py-6 bg-white mt-2 shadow-sm">
            <StatCard value={profile.casesHandled || '50+'} label="Cases" color="text-[#15a276]" />
            <div className="w-px bg-gray-200"></div>
            <StatCard value={`${profile.successRate || 92}%`} label="Success Rate" color="text-[#15a276]" />
            <div className="w-px bg-gray-200"></div>
            <StatCard value="4.8" label="Rating" color="text-[#062552]" />
        </div>
    );
});

StatsSection.displayName = 'StatsSection';

export default StatsSection;
