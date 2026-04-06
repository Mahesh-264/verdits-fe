import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCalendarPlus, FaGavel, FaFileSignature, FaBriefcase, FaCheck, FaTimes, FaCircle, FaUserGraduate, FaPlus } from 'react-icons/fa';
import api from '../api/axios';

const normalizeStatus = (status) => {
  const formattedStatus = String(status || '').toLowerCase();

  if (formattedStatus === 'pending') return 'Pending';
  if (formattedStatus === 'accepted') return 'Accepted';
  if (formattedStatus === 'rejected') return 'Rejected';

  return status || 'Pending';
};

const getUserName = (appointmentUser) => {
  if (!appointmentUser) return 'Client';

  const fullName = `${appointmentUser.firstName || ''} ${appointmentUser.lastName || ''}`.trim();
  return fullName || appointmentUser.name || appointmentUser.phone || 'Client';
};

export default function LawyerDashboard() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  // States for toggling UI
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showStudentInteractionModal, setShowStudentInteractionModal] = useState(false);
  const [studentInteractionTab, setStudentInteractionTab] = useState('internships');
  const [publishedInternships, setPublishedInternships] = useState([]);
  const [publishedJamSessions, setPublishedJamSessions] = useState([]);
  const [showInternshipForm, setShowInternshipForm] = useState(false);
  const [showJamSessionForm, setShowJamSessionForm] = useState(false);
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    firm: '',
    specialization: '',
    description: '',
    duration: '',
    location: '',
    stipend: '',
    skills: '',
  });
  const [jamSessionForm, setJamSessionForm] = useState({
    title: '',
    topic: '',
    summary: '',
    schedule: '',
  });

  useEffect(() => {
    if (!user) return;

    loadAppointments();
    loadStudentInteractionPosts();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      setLoadingAppointments(true);

      const lawyerId = String(user._id || user.id).trim();
      const { data } = await api.get(`/appointments/${lawyerId}`);

      const mappedAppointments = data.map((appointment) => ({
        id: appointment._id,
        userId: appointment.userId?._id || appointment.userId,
        user: appointment.userId || null,
        userName: getUserName(appointment.userId),
        status: normalizeStatus(appointment.status),
        timestamp: appointment.createdAt,
      }));

      setAppointments(mappedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/appointments/${id}`, {
        status: newStatus.toLowerCase()
      });

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === id
            ? {
                ...appointment,
                status: normalizeStatus(data?.status || newStatus)
              }
            : appointment
        )
      );
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert(error.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleOpenChat = (appointment) => {
    const selectedPartner = appointment.user && typeof appointment.user === 'object'
      ? { ...appointment.user, role: appointment.user.role || 'user' }
      : {
          _id: appointment.userId,
          id: appointment.userId,
          name: appointment.userName,
          role: 'user',
        };

    navigate('/chat', { state: { selectedPartner } });
    setShowAppointmentsModal(false);
    setShowClientsModal(false);
  };

  const loadStudentInteractionPosts = () => {
    const fetchStudentInteractionPosts = async () => {
      try {
        const { data } = await api.get('/auth/lawyer/student-interactions');
        setPublishedInternships(Array.isArray(data?.internships) ? data.internships : []);
        setPublishedJamSessions(Array.isArray(data?.jamSessions) ? data.jamSessions : []);
      } catch (error) {
        console.error('Error loading student interaction posts:', error);
        setPublishedInternships([]);
        setPublishedJamSessions([]);
      }
    };

    fetchStudentInteractionPosts();
  };

  const resetInternshipForm = () => {
    setInternshipForm({
      title: '',
      firm: '',
      specialization: '',
      description: '',
      duration: '',
      location: '',
      stipend: '',
      skills: '',
    });
  };

  const resetJamSessionForm = () => {
    setJamSessionForm({
      title: '',
      topic: '',
      summary: '',
      schedule: '',
    });
  };

  const handleInternshipInput = (event) => {
    const { name, value } = event.target;
    setInternshipForm((current) => ({ ...current, [name]: value }));
  };

  const handleJamSessionInput = (event) => {
    const { name, value } = event.target;
    setJamSessionForm((current) => ({ ...current, [name]: value }));
  };

  const handlePublishInternship = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        title: internshipForm.title.trim(),
        firm: internshipForm.firm.trim(),
        specialization: internshipForm.specialization
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        description: internshipForm.description.trim(),
        duration: internshipForm.duration.trim(),
        location: internshipForm.location.trim(),
        stipend: internshipForm.stipend.trim(),
        skills: internshipForm.skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const { data } = await api.post('/auth/lawyer/internships', payload);
      if (data?.internship) {
        setPublishedInternships((current) => [data.internship, ...current]);
      }
      setShowInternshipForm(false);
      resetInternshipForm();
    } catch (error) {
      console.error('Error publishing internship:', error);
      alert(error.response?.data?.message || 'Failed to publish internship');
    }
  };

  const handlePublishJamSession = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        title: jamSessionForm.title.trim(),
        topic: jamSessionForm.topic.trim(),
        summary: jamSessionForm.summary.trim(),
        schedule: jamSessionForm.schedule.trim(),
      };

      const { data } = await api.post('/auth/lawyer/jam-sessions', payload);
      if (data?.jamSession) {
        setPublishedJamSessions((current) => [data.jamSession, ...current]);
      }
      setShowJamSessionForm(false);
      resetJamSessionForm();
    } catch (error) {
      console.error('Error publishing jam session:', error);
      alert(error.response?.data?.message || 'Failed to publish jam session');
    }
  };

  const pendingAppointments = appointments.filter((appointment) => appointment.status !== 'Accepted');
  const acceptedClients = appointments.filter((appointment) => appointment.status === 'Accepted');
  const pendingCount = pendingAppointments.filter(a => a.status === 'Pending').length;
  const clientCount = acceptedClients.length;

  const cards = [
    { title: 'New Appointments', badge: pendingCount > 0 ? pendingCount : null, icon: <FaCalendarPlus className="text-4xl text-amber-500" />, desc: 'Review and manage incoming consultation requests.', onClick: () => setShowAppointmentsModal(true) },
    { title: 'Next Hearings', icon: <FaGavel className="text-4xl text-emerald-500" />, desc: 'Track your upcoming court dates and schedules.' },
    { title: 'Notice Generator', icon: <FaFileSignature className="text-4xl text-blue-500" />, desc: 'Quickly draft and send legal notices to parties.' },
    { title: 'My Clients', badge: clientCount > 0 ? clientCount : null, icon: <FaBriefcase className="text-4xl text-purple-500" />, desc: 'See all clients whose requests you have accepted.', onClick: () => setShowClientsModal(true) },
    { title: 'Student Interaction', icon: <FaUserGraduate className="text-4xl text-cyan-400" />, desc: 'Publish internships and jam sessions for students.', onClick: () => setShowStudentInteractionModal(true) }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              {loadingAppointments ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                    <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex flex-col items-center justify-center mx-auto mb-4 animate-pulse">
                      <FaCalendarPlus size={24} />
                    </div>
                    <p className="text-zinc-400 font-medium">Loading appointment requests...</p>
                </div>
              ) : pendingAppointments.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                    <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                      <FaCalendarPlus size={24} />
                    </div>
                    <p className="text-zinc-400 font-medium">No pending or rejected appointment requests right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingAppointments.slice().reverse().map((appt) => (
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
                      {appt.status === 'Rejected' && (
                        <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                          <p className="text-xs text-red-300 font-medium">Request rejected</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showClientsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl relative z-[101]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaBriefcase className="text-purple-500" /> My Clients
              </h2>
              <button
                onClick={() => setShowClientsModal(false)}
                className="text-zinc-400 hover:text-red-500 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              {loadingAppointments ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                  <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex flex-col items-center justify-center mx-auto mb-4 animate-pulse">
                    <FaBriefcase size={24} />
                  </div>
                  <p className="text-zinc-400 font-medium">Loading accepted clients...</p>
                </div>
              ) : acceptedClients.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                  <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                    <FaBriefcase size={24} />
                  </div>
                  <p className="text-zinc-400 font-medium">No accepted clients yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {acceptedClients.slice().reverse().map((client) => (
                    <div key={client.id} className="bg-zinc-950 border border-zinc-800 hover:border-purple-500/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                      <div>
                        <h3 className="font-bold text-lg text-white">{client.userName}</h3>
                        <p className="text-xs text-zinc-500 mb-2">Accepted on: {new Date(client.timestamp).toLocaleString()}</p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <FaCircle className="text-[8px]" /> Accepted Client
                        </span>
                      </div>
                      <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                        <p className="text-xs text-zinc-400 font-medium">Client communication unlocked</p>
                        <button
                          onClick={() => handleOpenChat(client)}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg font-bold transition-transform active:scale-95"
                        >
                          Go to Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStudentInteractionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl flex flex-col max-h-[88vh] shadow-2xl relative z-[101] overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUserGraduate className="text-cyan-400" /> Student Interaction
                </h2>
                <p className="text-sm text-zinc-400 mt-2">Manage published internships and jam sessions for students.</p>
              </div>
              <button
                onClick={() => setShowStudentInteractionModal(false)}
                className="text-zinc-400 hover:text-red-500 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/40 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setStudentInteractionTab('internships');
                    setShowJamSessionForm(false);
                  }}
                  className={`w-full text-left rounded-xl px-4 py-4 font-semibold transition ${
                    studentInteractionTab === 'internships'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  Internships
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentInteractionTab('jamSessions');
                    setShowInternshipForm(false);
                  }}
                  className={`mt-3 w-full text-left rounded-xl px-4 py-4 font-semibold transition ${
                    studentInteractionTab === 'jamSessions'
                      ? 'bg-cyan-400 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  Jam Sessions
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] min-h-0">
                <div className="overflow-y-auto p-6">
                  {studentInteractionTab === 'internships' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">Published Internships</h3>
                          <p className="text-sm text-zinc-400 mt-1">Your existing internship posts appear here.</p>
                        </div>
                      </div>

                      {publishedInternships.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                          <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaBriefcase size={24} />
                          </div>
                          <p className="text-zinc-400 font-medium">No internships published yet.</p>
                        </div>
                      ) : (
                        publishedInternships.map((internship) => (
                          <div key={internship.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-lg font-bold text-white">{internship.title}</h4>
                                <p className="text-sm text-zinc-400 mt-1">{internship.firm || 'Law Firm / Office not specified'}</p>
                              </div>
                              <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
                                {new Date(internship.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 mt-4">{internship.description || 'No description added.'}</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                              {internship.specialization.map((item) => (
                                <span key={item} className="px-3 py-1 rounded-full bg-zinc-900 text-xs text-zinc-300 border border-zinc-800">
                                  {item}
                                </span>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs text-zinc-400">
                              <div>Duration: {internship.duration || 'Not specified'}</div>
                              <div>Location: {internship.location || 'Not specified'}</div>
                              <div>Stipend: {internship.stipend || 'Not specified'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">Published Jam Sessions</h3>
                          <p className="text-sm text-zinc-400 mt-1">Your existing jam session posts appear here.</p>
                        </div>
                      </div>

                      {publishedJamSessions.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                          <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaUserGraduate size={24} />
                          </div>
                          <p className="text-zinc-400 font-medium">No jam sessions published yet.</p>
                        </div>
                      ) : (
                        publishedJamSessions.map((session) => (
                          <div key={session.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-lg font-bold text-white">{session.title}</h4>
                                <p className="text-sm text-zinc-400 mt-1">{session.topic || 'Topic not specified'}</p>
                              </div>
                              <span className="text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full">
                                {new Date(session.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 mt-4">{session.summary || 'No summary added.'}</p>
                            <div className="mt-4 text-xs text-zinc-400">
                              Schedule: {session.schedule || 'Not specified'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t xl:border-t-0 xl:border-l border-zinc-800 bg-zinc-950/30 p-6 overflow-y-auto">
                  {studentInteractionTab === 'internships' ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInternshipForm((current) => !current);
                          setShowJamSessionForm(false);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-3 transition"
                      >
                        <FaPlus />
                        New Internship
                      </button>

                      {showInternshipForm && (
                        <form onSubmit={handlePublishInternship} className="mt-5 space-y-4">
                          <input name="title" value={internshipForm.title} onChange={handleInternshipInput} placeholder="Internship title" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" required />
                          <input name="firm" value={internshipForm.firm} onChange={handleInternshipInput} placeholder="Firm / office name" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" />
                          <input name="specialization" value={internshipForm.specialization} onChange={handleInternshipInput} placeholder="Specialization, comma separated" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" />
                          <textarea name="description" value={internshipForm.description} onChange={handleInternshipInput} placeholder="Description" rows="4" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" required />
                          <input name="duration" value={internshipForm.duration} onChange={handleInternshipInput} placeholder="Duration" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" />
                          <input name="location" value={internshipForm.location} onChange={handleInternshipInput} placeholder="Location" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" />
                          <input name="stipend" value={internshipForm.stipend} onChange={handleInternshipInput} placeholder="Stipend" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" />
                          <input name="skills" value={internshipForm.skills} onChange={handleInternshipInput} placeholder="Skills, comma separated" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-amber-500" />
                          <button type="submit" className="w-full rounded-xl bg-white text-zinc-950 font-bold px-5 py-3 hover:bg-zinc-200 transition">
                            Publish Internship
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowJamSessionForm((current) => !current);
                          setShowInternshipForm(false);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold px-5 py-3 transition"
                      >
                        <FaPlus />
                        New Jam Session
                      </button>

                      {showJamSessionForm && (
                        <form onSubmit={handlePublishJamSession} className="mt-5 space-y-4">
                          <input name="title" value={jamSessionForm.title} onChange={handleJamSessionInput} placeholder="Session title" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" required />
                          <input name="topic" value={jamSessionForm.topic} onChange={handleJamSessionInput} placeholder="Topic" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" required />
                          <textarea name="summary" value={jamSessionForm.summary} onChange={handleJamSessionInput} placeholder="Session summary" rows="5" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" required />
                          <input name="schedule" value={jamSessionForm.schedule} onChange={handleJamSessionInput} placeholder="Schedule / date" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" />
                          <button type="submit" className="w-full rounded-xl bg-white text-zinc-950 font-bold px-5 py-3 hover:bg-zinc-200 transition">
                            Publish Jam Session
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
