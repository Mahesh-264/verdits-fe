import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Home, Heart, MoreHorizontal } from 'lucide-react';

const CaseSelection = () => {
    const navigate = useNavigate();

    const categories = [
        { id: 'criminal', name: 'Criminal Case', desc: 'Criminal law matters', icon: <Scale size={24} />, color: 'bg-red-500' },
        { id: 'civil', name: 'Civil Case', desc: 'Civil disputes & claims', icon: <Home size={24} />, color: 'bg-blue-500' },
        { id: 'marital', name: 'Marital Case', desc: 'Family & marriage law', icon: <Heart size={24} />, color: 'bg-pink-500' },
        { id: 'other', name: 'Other', desc: 'Other legal matters', icon: <MoreHorizontal size={24} />, color: 'bg-gray-500' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-black text-white p-4 flex items-center gap-4 shadow-md">
                <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer" />
                <span className="text-xl font-bold tracking-wide">Nyaya Setu</span>
            </div>

            <div className="w-full max-w-md p-6 mt-4">
                <h2 className="text-gray-600 text-center mb-6">Please select the type of legal case you need assistance with</h2>

                <div className="flex flex-col gap-4">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            onClick={() => navigate(`/lawyers/${cat.id}`)}
                            className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition"
                        >
                            <div className={`h-12 w-12 ${cat.color} rounded-full flex items-center justify-center text-white shrink-0`}>
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