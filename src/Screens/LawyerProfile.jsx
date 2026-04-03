import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { ArrowLeft, Star, Phone, Video, MessageSquare, ShieldCheck, Clock } from 'lucide-react';

const LawyerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestStatus, setRequestStatus] = useState(null);

    useEffect(() => {
        if (lawyer && user) {
            const appointments = JSON.parse(localStorage.getItem('mockAppointments') || '[]');
            const existing = appointments.find(a => 
                String(a.lawyerId) === String(lawyer._id || lawyer.id) && 
                String(a.userId) === String(user._id || user.id)
            );
            if (existing) setRequestStatus(existing.status);
        }
    }, [lawyer, user]);

    const handleSendRequest = () => {
        const appointments = JSON.parse(localStorage.getItem('mockAppointments') || '[]');
        const newAppt = {
            id: Date.now().toString(),
            lawyerId: lawyer._id || lawyer.id,
            userId: user._id || user.id,
            userName: user.firstName ? `${user.firstName} ${user.lastName}` : (user.name || "User"),
            lawyerName: lawyer.name || (lawyer.firstName ? `${lawyer.firstName} ${lawyer.lastName}` : "Lawyer"),
            status: 'Pending',
            timestamp: new Date().toISOString()
        };
        appointments.push(newAppt);
        localStorage.setItem('mockAppointments', JSON.stringify(appointments));
        setRequestStatus('Pending');
    };

    useEffect(() => {
        const fetchLawyer = async () => {
            try {
                const res = await api.get(`/auth/lawyers/${id}`);
                setLawyer(res.data);
            } catch (error) {
                console.error("Error fetching lawyer:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLawyer();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!lawyer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">Lawyer not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-semibold">Go Back</button>
            </div>
        );
    }

    const profile = lawyer.lawyerProfile || {};

    const handleConnect = (type) => {
        if (type === 'chat') {
            // 🟢 Pass the entire lawyer object to the Chat screen
            navigate('/chat', { state: { selectedPartner: lawyer } });
        } else {
            console.log("Initiating", type);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-32 relative">

            {/* Header */}
            <div className="w-full bg-black text-white p-4 flex items-center gap-4 shadow-md sticky top-0 z-20">
                <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer hover:text-gray-300 transition" />
                <span className="text-xl font-bold tracking-wide">Lawyer Profile</span>
            </div>

            {/* Profile Card */}
            <div className="w-full max-w-md bg-white mt-2 pb-6 shadow-sm border-b border-gray-100">
                <div className="p-6 flex gap-5 items-start">
                    <div className="h-24 w-24 rounded-full overflow-hidden shadow-lg border-2 border-white shrink-0">
                        <img
                            src={lawyer.profileImage || `https://ui-avatars.com/api/?name=${lawyer.name}&background=0D8ABC&color=fff`}
                            alt={lawyer.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{lawyer.name}</h1>
                        <p className="text-blue-600 font-medium">{profile.specialization || "General"} Law</p>

                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                <Clock size={14} /> {profile.experienceYears || 0} Yrs Exp
                            </span>
                            <span className="flex items-center text-amber-500 font-bold gap-1 bg-amber-50 px-2 py-1 rounded">
                                <Star size={14} fill="currentColor" /> 4.8
                            </span>
                        </div>
                    </div>
                </div>

                {/* Languages */}
                <div className="px-6 flex flex-wrap gap-2">
                    {profile.languages?.map((lang, idx) => (
                        <span key={idx} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full border border-zinc-200">
                            {lang}
                        </span>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="w-full max-w-md flex justify-between px-8 py-6 bg-white mt-2 shadow-sm">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-blue-600">{profile.casesHandled || '50+'}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Cases</p>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-green-600">{profile.successRate || 92}%</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Success Rate</p>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-purple-600">4.8</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Rating</p>
                </div>
            </div>

            {/* About Section */}
            <div className="w-full max-w-md bg-white p-6 mt-2 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-blue-600" /> About
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {profile.about || `Experienced ${profile.specialization} lawyer dedicated to providing high-quality legal representation. Committed to protecting client rights and achieving favorable outcomes.`}
                </p>
            </div>

            {/* Education Section */}
            <div className="w-full max-w-md bg-white p-6 mt-2 shadow-sm mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-3">Credentials</h3>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                        <span>Bar Council ID: <span className="font-mono text-gray-900 font-semibold">{profile.barId || "N/A"}</span></span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                        <span>LL.B / LL.M in {profile.specialization || "Law"}</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                        <span>Verified Practitioner at Nyaya Setu</span>
                    </li>
                </ul>
            </div>

            {/* Floating Bottom Actions */}
            <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
                {requestStatus !== 'Accepted' ? (
                    <div className="flex flex-col items-center">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Consultation Access</h4>
                        {requestStatus === 'Pending' ? (
                            <button disabled className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl opacity-70 cursor-not-allowed">
                                Request Pending Approval...
                            </button>
                        ) : requestStatus === 'Rejected' ? (
                            <button disabled className="w-full bg-red-500 text-white font-bold py-3 rounded-xl opacity-70 cursor-not-allowed">
                                Request Declined
                            </button>
                        ) : (
                            <button onClick={handleSendRequest} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition">
                                Send Appointment Request
                            </button>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2 text-center items-center">
                            Communication features will unlock once the lawyer accepts your request.
                        </p>
                    </div>
                ) : (
                    <>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Request Accepted - Connect Now
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handleConnect('audio')} className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 p-3 rounded-xl transition border border-blue-100">
                                <Phone size={24} className="mb-1" />
                                <span className="text-xs font-bold">Audio</span>
                                <span className="text-[10px] opacity-70">₹{profile.consultationFee || 500}/min</span>
                            </button>

                            <button onClick={() => handleConnect('video')} className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 p-3 rounded-xl transition border border-green-100">
                                <Video size={24} className="mb-1" />
                                <span className="text-xs font-bold">Video</span>
                                <span className="text-[10px] opacity-70">₹{(profile.consultationFee || 500) + 200}/min</span>
                            </button>

                            <button onClick={() => handleConnect('chat')} className="flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition shadow-lg shadow-purple-200">
                                <MessageSquare size={24} className="mb-1" />
                                <span className="text-xs font-bold">Chat</span>
                                <span className="text-[10px] opacity-80">Free</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LawyerProfile;