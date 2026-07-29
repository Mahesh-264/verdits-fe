import React, { useMemo } from 'react';
import { Clock, User } from 'lucide-react';
import { getProfileImageUrl } from '../utils/lawyerProfileHelpers';

const ProfileHeader = React.memo(({ lawyer, profile }) => {
    const profileImage = useMemo(() => getProfileImageUrl(lawyer), [lawyer]);

    return (
        <div className="w-full max-w-md bg-white mt-2 pb-6 shadow-sm border-b border-gray-100">
            <div className="p-6 flex gap-5 items-start">
                <div className="h-24 w-24 rounded-full overflow-hidden shadow-lg border-2 border-white shrink-0">
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt={lawyer.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#e8f7f2] text-[#15a276]">
                            <User size={42} />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">{lawyer.name}</h1>
                    <p className="text-[#15a276] font-medium">{profile.specialization || 'General'} Law</p>

                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                            <Clock size={14} /> {profile.experienceYears || 0} Yrs Exp
                        </span>
                    </div>
                </div>
            </div>

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
                <div className="px-6 flex flex-wrap gap-2">
                    {profile.languages.map((lang, idx) => (
                        <span
                            key={idx}
                            className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full border border-zinc-200"
                        >
                            {lang}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
});

ProfileHeader.displayName = 'ProfileHeader';

export default ProfileHeader;
