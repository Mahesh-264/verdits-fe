import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../api/axios';

const InstantConsult = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOnlineLawyers = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/auth/lawyers`);
                // Assume first 6 are 'online' representing instant consultation queue
                setLawyers(res.data.slice(0, 6));
            } catch (error) {
                console.error("Error fetching online lawyers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOnlineLawyers();
    }, []);

    const handleInstantConsult = (lawyer) => {
        // Automatically inject an accepted appointment to bypass the standard lock for INSTANT chat
        const appointments = JSON.parse(localStorage.getItem('mockAppointments') || '[]');
        const existing = appointments.find(a => a.lawyerId === lawyer._id && a.userId === (user._id || user.id));
        
        if (!existing) {
            appointments.push({
                id: Date.now().toString(),
                lawyerId: lawyer._id,
                userId: user._id || user.id,
                userName: user.firstName ? `${user.firstName} ${user.lastName}` : (user.name || "User"),
                lawyerName: lawyer.name || (lawyer.firstName ? `${lawyer.firstName} ${lawyer.lastName}` : "Lawyer"),
                status: 'Accepted', // Instantly accepted!
                timestamp: new Date().toISOString(),
                isInstant: true
            });
            localStorage.setItem('mockAppointments', JSON.stringify(appointments));
        } else if (existing.status !== 'Accepted') {
            existing.status = 'Accepted';
            localStorage.setItem('mockAppointments', JSON.stringify(appointments));
        }

        // Redirect to chat
        navigate('/chat', { state: { selectedPartner: lawyer } }); 
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-black text-white p-4 flex items-center gap-4 shadow-md sticky top-0 z-10">
                <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer hover:text-gray-300 transition" />
                <span className="text-xl font-bold tracking-wide">Instant Consultation</span>
            </div>

            <div className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-800 leading-tight">Consult Instantly</h2>
                        <p className="text-gray-500 text-[11px] mt-0.5">Skip the wait. Connect instantly.</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        LIVE
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center mt-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {lawyers.length > 0 ? (
                            lawyers.map((lawyer) => (
                                <div key={lawyer._id} className="bg-white p-5 rounded-2xl shadow-sm border border-transparent hover:border-emerald-200 transition-all hover:-translate-y-1 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-400 group-hover:w-2 transition-all"></div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-200 shrink-0 shadow-inner">
                                            {lawyer.profileImage ? (
                                                <img src={lawyer.profileImage} alt={lawyer.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-full overflow-hidden bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <span className="font-black text-xl">{lawyer.name?.charAt(0) || "L"}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-gray-900 text-[16px]">{lawyer.name}</h3>
                                                <span className="flex items-center text-amber-500 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded shadow-sm gap-0.5 mt-1">
                                                    <Star size={10} fill="currentColor" /> 4.9
                                                </span>
                                            </div>
                                            <p className="text-[12px] font-bold text-emerald-600 tracking-wide uppercase mt-0.5">{lawyer.lawyerProfile?.specialization || "General"} Law</p>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1 font-medium pb-1">
                                                <span>{lawyer.lawyerProfile?.experienceYears || 5} Yrs Exp</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{lawyer.address?.city || lawyer.address?.district || "India"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleInstantConsult(lawyer)}
                                        className="w-full bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-emerald-200 hover:border-emerald-600 text-sm shadow-sm"
                                    >
                                        <MessageCircle size={18} /> Direct Consult Now
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-zinc-400 font-medium">No lawyers are currently online.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstantConsult;
