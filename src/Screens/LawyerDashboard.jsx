import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaCalendarPlus, FaGavel, FaFileSignature, FaBriefcase, FaCheck, FaTimes, FaCircle, FaUserCircle } from 'react-icons/fa';

export default function LawyerDashboard() {
  const { user } = useSelector(state => state.auth);
  const [appointments, setAppointments] = useState([]);
  
  // States for toggling UI
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);

  useEffect(() => {
    loadAppointments();
    const intv = setInterval(loadAppointments, 2000);
    return () => clearInterval(intv);
  }, [user]);

  const loadAppointments = () => {
    if (user) {
      const allAppts = JSON.parse(localStorage.getItem('mockAppointments') || '[]');
      const lawyerTargetId = String(user._id || user.id).trim();
      const myAppts = allAppts.filter(a => String(a.lawyerId).trim() === lawyerTargetId);
      setAppointments(myAppts);
    }
  };

  const updateStatus = (id, newStatus) => {
    let allAppts = JSON.parse(localStorage.getItem('mockAppointments') || '[]');
    allAppts = allAppts.map(a => {
        if (a.id === id) return { ...a, status: newStatus };
        return a;
    });
    localStorage.setItem('mockAppointments', JSON.stringify(allAppts));
    loadAppointments();
  };

  const pendingCount = appointments.filter(a => a.status === 'Pending').length;

  const cards = [
    { title: 'New Appointments', badge: pendingCount > 0 ? pendingCount : null, icon: <FaCalendarPlus className="text-4xl text-amber-500" />, desc: 'Review and manage incoming consultation requests.', onClick: () => setShowAppointmentsModal(true) },
    { title: 'Next Hearings', icon: <FaGavel className="text-4xl text-emerald-500" />, desc: 'Track your upcoming court dates and schedules.' },
    { title: 'Notice Generator', icon: <FaFileSignature className="text-4xl text-blue-500" />, desc: 'Quickly draft and send legal notices to parties.' },
    { title: 'Other Services', icon: <FaBriefcase className="text-4xl text-purple-500" />, desc: 'Access additional tools and tailored services.' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-20">
          <div>
            <h1 className="text-4xl font-bold mb-2">Lawyer Dashboard</h1>
            <p className="text-zinc-400">Manage your appointments, hearings, and daily practice efficiently.</p>
          </div>
          
          {/* Lawyer Profile Icon / Toggle */}
          <div className="relative">
            <div 
               onClick={() => setShowProfileInfo(!showProfileInfo)}
               className="h-14 w-14 rounded-full bg-zinc-900 border-2 border-amber-500/50 flex items-center justify-center overflow-hidden cursor-pointer shadow-lg hover:border-amber-500 transition relative z-30"
            >
               {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
               ) : (
                  <span className="text-xl font-bold text-amber-500">{user?.name?.charAt(0) || user?.firstName?.charAt(0) || "L"}</span>
               )}
            </div>

            {/* Expandable Profile Info Dropdown */}
            {showProfileInfo && (
              <div className="absolute right-0 top-16 w-72 bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="text-right">
                  <h3 className="text-lg font-bold text-white leading-tight">{user?.name || (user?.firstName ? `${user.firstName} ${user.lastName}` : "Lawyer")}</h3>
                  <p className="text-[12px] text-amber-500 font-bold tracking-wide uppercase">{user?.lawyerProfile?.specialization || "Legal Services"}</p>
                  <div className="text-[12px] text-zinc-400 mt-3 space-y-2 block border-t border-zinc-800 pt-3">
                    <p className="flex justify-between items-center"><span>Bar Council ID:</span> <span className="text-zinc-200 font-medium bg-zinc-950 px-2 py-1 rounded">{user?.lawyerProfile?.barId || "Not Provided"}</span></p>
                    <p className="flex justify-between items-center"><span>Age:</span> <span className="text-zinc-200 font-medium bg-zinc-950 px-2 py-1 rounded">{user?.age || "N/A"}</span></p>
                    <p className="flex justify-between items-center"><span>Location:</span> <span className="text-zinc-200 font-medium bg-zinc-950 px-2 py-1 rounded">{user?.address?.city || user?.address?.district || "Not Set"}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <div 
              key={idx} 
              onClick={card.onClick}
              className="relative bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
              {card.badge > 0 && (
                <div className="absolute top-4 right-4 bg-amber-500 text-zinc-950 text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full shadow-lg animate-pulse">
                  {card.badge}
                </div>
              )}
              <div className="bg-zinc-950 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                {card.icon}
              </div>
              <h2 className="text-xl font-bold mb-2">{card.title}</h2>
              <p className="text-zinc-400 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Appointments Modal */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl relative z-[101]">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaCalendarPlus className="text-amber-500" /> Incoming Appointments
              </h2>
              <button 
                onClick={() => setShowAppointmentsModal(false)}
                className="text-zinc-400 hover:text-red-500 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              {appointments.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                    <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                      <FaCalendarPlus size={24} />
                    </div>
                    <p className="text-zinc-400 font-medium">No appointment requests perfectly matching your profile yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {appointments.slice().reverse().map((appt) => (
                    <div key={appt.id} className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-amber-500 transition-colors">{appt.userName}</h3>
                        <p className="text-xs text-zinc-500 mb-2">Requested on: {new Date(appt.timestamp).toLocaleString()}</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${appt.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : appt.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          <FaCircle className="text-[8px]" /> {appt.status}
                        </span>
                      </div>
                      {appt.status === 'Pending' && (
                        <div className="flex gap-3 w-full sm:w-auto mt-3 sm:mt-0 shadow-lg">
                          <button onClick={() => updateStatus(appt.id, 'Accepted')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#005c4b] hover:bg-[#007b64] text-[#e9edef] rounded-lg font-bold shadow-lg transition-transform active:scale-95">
                            <FaCheck /> Accept
                          </button>
                          <button onClick={() => updateStatus(appt.id, 'Rejected')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-red-900/40 hover:bg-red-800 text-red-100 rounded-lg font-bold transition-transform active:scale-95 border border-red-900/50">
                            <FaTimes /> Reject
                          </button>
                        </div>
                      )}
                      {appt.status === 'Accepted' && (
                         <p className="text-xs text-zinc-400 font-medium">✨ Client Communication unlocked</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
