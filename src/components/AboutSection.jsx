import React from 'react';
import { ShieldCheck } from 'lucide-react';

const AboutSection = React.memo(({ profile }) => {
    return (
        <div className="w-full max-w-md bg-white p-6 mt-2 shadow-sm">
            <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#15a276]" /> About
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {profile.about || `Experienced ${profile.specialization} lawyer dedicated to providing high-quality legal representation. Committed to protecting client rights and achieving favorable outcomes.`}
            </p>
        </div>
    );
});

AboutSection.displayName = 'AboutSection';

export default AboutSection;
