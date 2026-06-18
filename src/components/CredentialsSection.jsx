import React from 'react';

const CredentialItem = React.memo(({ children }) => (
    <li className="flex items-start gap-3 text-sm text-gray-700">
        <div className="h-2 w-2 bg-[#15a276] rounded-full mt-1.5 shrink-0"></div>
        <span>{children}</span>
    </li>
));

CredentialItem.displayName = 'CredentialItem';

const CredentialsSection = React.memo(({ profile }) => {
    return (
        <div className="w-full max-w-md bg-white p-6 mt-2 shadow-sm mb-4">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Credentials</h3>
            <ul className="space-y-3">
                <CredentialItem>
                    Bar Council ID: <span className="font-mono text-gray-900 font-semibold">{profile.barId || 'N/A'}</span>
                </CredentialItem>
                <CredentialItem>
                    LL.B / LL.M in {profile.specialization || 'Law'}
                </CredentialItem>
                <CredentialItem>
                    Verified Practitioner at VERDITS
                </CredentialItem>
            </ul>
        </div>
    );
});

CredentialsSection.displayName = 'CredentialsSection';

export default CredentialsSection;
