import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Star, MapPin } from 'lucide-react';

const categoryKeywordMap = {
    criminal: ['criminal'],
    civil: ['civil'],
    marital: ['family', 'marital', 'matrimonial', 'divorce', 'domestic'],
    property: ['property', 'land', 'real estate'],
    corporate: ['corporate', 'business', 'commercial', 'company'],
    other: [],
};

const getDisplayName = (lawyer) => {
    const fullName = `${lawyer?.firstName || ''} ${lawyer?.lastName || ''}`.trim();
    return fullName || lawyer?.name || 'Lawyer';
};

const LawyerList = () => {
    const { category } = useParams();
    const navigate = useNavigate();
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLawyers = async () => {
            try {
                setLoading(true);

                const normalizedCategory = String(category || '').toLowerCase();
                const keywords = categoryKeywordMap[normalizedCategory] || [];
                const { data } = await api.get('/auth/lawyers');
                const allLawyers = Array.isArray(data) ? data : [];

                const filteredLawyers = keywords.length
                    ? allLawyers.filter((lawyer) => {
                        const specialization = String(
                            lawyer?.lawyerProfile?.specialization || ''
                        ).toLowerCase();

                        return keywords.some((keyword) => specialization.includes(keyword));
                    })
                    : allLawyers;

                setLawyers(filteredLawyers);
            } catch (error) {
                console.error('Error fetching lawyers:', error);
            } finally {
                setLoading(false);
            }
        };

        if (category) {
            fetchLawyers();
        }
    }, [category]);

    const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <div className="w-full bg-black text-white p-4 flex items-center gap-4 shadow-md sticky top-0 z-10">
                <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer" />
                <span className="text-xl font-bold tracking-wide">Nyaya Setu</span>
            </div>

            <div className="w-full max-w-md p-4">
                <h2 className="text-xl font-bold text-gray-800">Available Lawyers</h2>
                <p className="text-gray-500 text-sm mb-6">
                    Showing results for:{' '}
                    <span className="font-semibold text-blue-600">{categoryTitle}</span>
                </p>

                {loading ? (
                    <div className="flex justify-center mt-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {lawyers.length > 0 ? (
                            lawyers.map((lawyer) => (
                                <div
                                    key={lawyer._id}
                                    onClick={() => navigate(`/lawyer-profile/${lawyer._id}`)}
                                    className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition border border-transparent hover:border-blue-100"
                                >
                                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                        {lawyer.profileImage ? (
                                            <img
                                                src={lawyer.profileImage}
                                                alt={getDisplayName(lawyer)}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold text-xl">
                                                {getDisplayName(lawyer).charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-800 text-lg">
                                                {getDisplayName(lawyer)}
                                            </h3>
                                            <span className="flex items-center text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-full gap-1">
                                                <Star size={10} fill="currentColor" /> 4.8
                                            </span>
                                        </div>

                                        <p className="text-sm font-medium text-blue-600">
                                            {lawyer.lawyerProfile?.specialization || 'General'} Law
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <span>{lawyer.lawyerProfile?.experienceYears || 0} Yrs Exp</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} /> {lawyer.address?.city || lawyer.address?.district || 'Location not added'}
                                            </span>
                                        </div>

                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {(lawyer.lawyerProfile?.languages || []).slice(0, 2).map((lang, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                                <p className="text-gray-400 mb-2">No lawyers found.</p>
                                <p className="text-sm text-gray-500">
                                    Newly registered lawyers only appear here when their specialization matches this case category.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LawyerList;
