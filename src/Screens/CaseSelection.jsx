import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Home, Heart, MoreHorizontal } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';

const CaseSelection = () => {
    const navigate = useNavigate();

    const categories = [
        { id: 'criminal', name: 'Criminal Case', desc: 'Criminal law matters', icon: <Scale size={24} />, color: 'bg-[#062552]' },
        { id: 'civil', name: 'Civil Case', desc: 'Civil disputes & claims', icon: <Home size={24} />, color: 'bg-[#15a276]' },
        { id: 'marital', name: 'Marital Case', desc: 'Family & marriage law', icon: <Heart size={24} />, color: 'bg-[#0b3b70]' },
        { id: 'other', name: 'Other', desc: 'Other legal matters', icon: <MoreHorizontal size={24} />, color: 'bg-[#19b98d]' },
    ];

    return (
        <div className="min-h-screen bg-[#f3f8fb] flex flex-col items-center">
            <div className="w-full">
                <AppHeader variant="user" profileTo="/profile" showBackButton backTo="/user-home" />
            </div>

            <div className="w-full max-w-md p-6 mt-4">
                <h2 className="text-gray-600 text-center mb-6">Please select the type of legal case you need assistance with</h2>

                <div className="flex flex-col gap-4">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            onClick={() => navigate(`/lawyers/${cat.id}`)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-[#d7e9ef] flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-[#15a276]/40 transition"
                        >
                            <div className="case-selection-icon h-12 w-12 rounded-full flex items-center justify-center shrink-0">
                                {cat.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{cat.name}</h3>
                                <p className="text-sm text-gray-500">{cat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CaseSelection;
