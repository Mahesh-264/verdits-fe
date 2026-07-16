import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaBriefcase,
  FaCalendarPlus,
  FaCheck,
  FaCircle,
  FaFileSignature,
  FaGavel,
  FaMagic,
  FaPlus,
  FaTimes,
  FaUserGraduate,
} from 'react-icons/fa';
import { Users } from 'lucide-react';
import api from '../api/axios';
import AppHeader from '../components/AppHeader.jsx';
import FeedPostCard from '../components/feed/FeedPostCard.jsx';
import PostComposerModal from '../components/feed/PostComposerModal.jsx';
import ReactionBar from '../components/feed/ReactionBar.jsx';

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

const applicantFilters = ['All', 'Pending', 'Accepted', 'Rejected'];
const participantFilters = ['All', 'Joined'];

const statCards = [
  { key: 'totalInternshipsPosted', label: 'Total internships posted', accent: 'text-[#19b98d]' },
  { key: 'activeInternships', label: 'Active internships', accent: 'text-emerald-400' },
  { key: 'totalApplicants', label: 'Total applicants', accent: 'text-cyan-400' },
  { key: 'totalJamSessions', label: 'Total jam sessions', accent: 'text-purple-400' },
  { key: 'totalParticipants', label: 'Total participants', accent: 'text-pink-400' },
];

const initialStats = {
  totalInternshipsPosted: 0,
  activeInternships: 0,
  totalApplicants: 0,
  totalJamSessions: 0,
  totalParticipants: 0,
};

const emptyDrawerState = {
  open: false,
  type: 'applicants',
  title: '',
  parentId: '',
  parentLabel: '',
  items: [],
};

const noticeDocumentTypes = [
  'Legal Notice for Recovery of Money',
  'Legal Notice for Breach of Contract',
  'Tenant Eviction Notice',
  'Consumer Complaint Notice',
  'Employment Termination Dispute Notice',
  'Cheque Bounce Notice',
  'Property Dispute Notice',
  'Defamation Notice',
  'Custom Legal Notice',
];

const initialNoticeForm = {
  documentType: noticeDocumentTypes[0],
  details: '',
};

const getNoticeRequestError = (error, fallbackMessage) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Unable to reach the server. Please check your connection and try again.';
  return fallbackMessage;
};

export default function LawyerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showStudentInteractionModal, setShowStudentInteractionModal] = useState(false);
  const [showNoticeGenerator, setShowNoticeGenerator] = useState(false);
  const [studentInteractionTab, setStudentInteractionTab] = useState('internships');
  const [publishedInternships, setPublishedInternships] = useState([]);
  const [publishedJamSessions, setPublishedJamSessions] = useState([]);
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [quickStats, setQuickStats] = useState(initialStats);
  const [showInternshipForm, setShowInternshipForm] = useState(false);
  const [showJamSessionForm, setShowJamSessionForm] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [drawer, setDrawer] = useState(emptyDrawerState);
  const [drawerFilter, setDrawerFilter] = useState('All');
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');
  const [posting, setPosting] = useState(false);
  const [resumePreview, setResumePreview] = useState(null);
  const [noticeForm, setNoticeForm] = useState(initialNoticeForm);
  const [noticeDraft, setNoticeDraft] = useState('');
  const [noticeEditPrompt, setNoticeEditPrompt] = useState('');
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeEditing, setNoticeEditing] = useState(false);
  const [noticeError, setNoticeError] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [updatingApplicantId, setUpdatingApplicantId] = useState('');
  const [togglingInternshipId, setTogglingInternshipId] = useState('');
  const [deletingInternshipId, setDeletingInternshipId] = useState('');
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    description: '',
    duration: '',
    location: '',
    stipend: '',
  });
  const [jamSessionForm, setJamSessionForm] = useState({
    title: '',
    description: '',
    schedule: '',
    location: '',
  });

  const loadAppointments = useCallback(async () => {
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
  }, [user]);

  const loadStudentInteractionPosts = useCallback(async () => {
    try {
      setInteractionLoading(true);
      const { data } = await api.get('/auth/lawyer/student-interactions');
      setPublishedInternships(Array.isArray(data?.internships) ? data.internships : []);
      setPublishedJamSessions(Array.isArray(data?.jamSessions) ? data.jamSessions : []);
      setQuickStats(data?.stats || initialStats);
    } catch (error) {
      console.error('Error loading student interaction posts:', error);
      setPublishedInternships([]);
      setPublishedJamSessions([]);
      setQuickStats(initialStats);
    } finally {
      setInteractionLoading(false);
    }
  }, []);

  const loadOwnPosts = useCallback(async () => {
    if (!user?._id) return;

    try {
      setPostLoading(true);
      const { data } = await api.get(`/posts/user/${user._id}`);
      setPublishedPosts(Array.isArray(data?.posts) ? data.posts : []);
    } catch (error) {
      console.error('Error loading lawyer posts:', error);
      setPublishedPosts([]);
    } finally {
      setPostLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (searchParams.get('section') === 'student-interactions') {
      setShowStudentInteractionModal(true);
    }

    if (searchParams.get('section') === 'appointments') {
      setShowAppointmentsModal(true);
    }

    const requestedTab = searchParams.get('tab');
    if (['internships', 'jamSessions', 'posts'].includes(requestedTab)) {
      setStudentInteractionTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    loadAppointments();
    loadStudentInteractionPosts();
    loadOwnPosts();
  }, [loadAppointments, loadOwnPosts, loadStudentInteractionPosts, user]);

  useEffect(() => {
    const itemId = searchParams.get('itemId');
    const drawerType = searchParams.get('drawer');

    if (!showStudentInteractionModal || drawerType !== 'applicants' || !itemId || publishedInternships.length === 0) {
      return;
    }

    const targetInternship = publishedInternships.find((internship) => String(internship.id) === String(itemId));
    if (targetInternship) {
      handleOpenApplicantsDrawer(targetInternship);
    }
  }, [publishedInternships, searchParams, showStudentInteractionModal]);

  const updateStatus = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/appointments/${id}`, {
        status: newStatus.toLowerCase(),
      });

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === id
            ? {
                ...appointment,
                status: normalizeStatus(data?.status || newStatus),
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
    const selectedPartner =
      appointment.user && typeof appointment.user === 'object'
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

  const resetInternshipForm = () => {
    setInternshipForm({
      title: '',
      description: '',
      duration: '',
      location: '',
      stipend: '',
    });
  };

  const resetJamSessionForm = () => {
    setJamSessionForm({
      title: '',
      description: '',
      schedule: '',
      location: '',
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
        description: internshipForm.description.trim(),
        duration: internshipForm.duration.trim(),
        location: internshipForm.location.trim(),
        stipend: internshipForm.stipend.trim(),
        firm: user?.address?.city || user?.address?.district || '',
        specialization: user?.lawyerProfile?.specialization
          ? [String(user.lawyerProfile.specialization).trim()].filter(Boolean)
          : [],
        skills: [],
      };

      const { data } = await api.post('/auth/lawyer/internships', payload);
      if (data?.internship) {
        setPublishedInternships((current) => [data.internship, ...current]);
        setQuickStats((current) => ({
          ...current,
          totalInternshipsPosted: current.totalInternshipsPosted + 1,
          activeInternships: current.activeInternships + 1,
        }));
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
        topic: user?.lawyerProfile?.specialization || 'Legal Jam Session',
        summary: jamSessionForm.description.trim(),
        schedule: jamSessionForm.schedule.trim(),
        location: jamSessionForm.location.trim(),
      };

      const { data } = await api.post('/auth/lawyer/jam-sessions', payload);
      if (data?.jamSession) {
        setPublishedJamSessions((current) => [data.jamSession, ...current]);
        setQuickStats((current) => ({
          ...current,
          totalJamSessions: current.totalJamSessions + 1,
        }));
      }
      setShowJamSessionForm(false);
      resetJamSessionForm();
    } catch (error) {
      console.error('Error publishing jam session:', error);
      alert(error.response?.data?.message || 'Failed to publish jam session');
    }
  };

  const handleJamLike = async (session) => {
    const { data } = await api.post(`/auth/jam-sessions/${session.id}/like`);
    return data;
  };

  const handleJamComment = async (session, text) => {
    const { data } = await api.post(`/auth/jam-sessions/${session.id}/comments`, { text });
    return data;
  };

  const handleInternshipLike = async (internship) => {
    const { data } = await api.post(`/auth/lawyer/internships/${internship.id}/like`);
    return data;
  };

  const handleInternshipComment = async (internship, text) => {
    const { data } = await api.post(`/auth/lawyer/internships/${internship.id}/comments`, { text });
    return data;
  };

  const handleOpenApplicantsDrawer = (internship) => {
    setDrawer({
      open: true,
      type: 'applicants',
      title: internship.title,
      parentId: internship.id,
      parentLabel: 'Applicants',
      items: internship.applicants || [],
    });
    setDrawerFilter('All');
  };

  const handleOpenParticipantsDrawer = (session) => {
    setDrawer({
      open: true,
      type: 'participants',
      title: session.title,
      parentId: session.id,
      parentLabel: 'Participants',
      items: session.joinedStudents || [],
    });
    setDrawerFilter('All');
  };

  const handleToggleInternshipStatus = async (internship) => {
    try {
      setTogglingInternshipId(internship.id);
      const { data } = await api.patch(`/auth/lawyer/internships/${internship.id}/toggle-status`);

      if (data?.internship) {
        setPublishedInternships((current) =>
          current.map((item) => (item.id === internship.id ? { ...item, ...data.internship } : item))
        );
      }

      if (data?.stats) {
        setQuickStats(data.stats);
      }
    } catch (error) {
      console.error('Error toggling internship status:', error);
      alert(error.response?.data?.message || 'Failed to update internship status');
    } finally {
      setTogglingInternshipId('');
    }
  };

  const handleDeleteInternship = async (internship) => {
    const confirmed = window.confirm(`Delete "${internship.title}"? This will remove the offer from the dashboard and student views.`);
    if (!confirmed) return;

    try {
      setDeletingInternshipId(internship.id);
      const { data } = await api.delete(`/auth/lawyer/internships/${internship.id}`);

      setPublishedInternships((current) => current.filter((item) => item.id !== internship.id));

      if (drawer.open && drawer.parentId === internship.id) {
        setDrawer(emptyDrawerState);
      }

      if (data?.stats) {
        setQuickStats(data.stats);
      }
    } catch (error) {
      console.error('Error deleting internship:', error);
      alert(error.response?.data?.message || 'Failed to delete internship');
    } finally {
      setDeletingInternshipId('');
    }
  };

  const handleCreatePost = async ({ content, visibility, tags, images }) => {
    if (!String(content || '').trim()) {
      setPostError('Please add some text before posting.');
      return;
    }

    try {
      setPosting(true);
      setPostError('');
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('visibility', visibility);
      tags.forEach((tag) => formData.append('tags', tag));
      images.forEach((image) => formData.append('images', image));

      const { data } = await api.post('/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data?.post) {
        setPublishedPosts((current) => [data.post, ...current]);
      }

      setShowPostComposer(false);
    } catch (error) {
      console.error('Error creating post:', error);
      setPostError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleNoticeInput = (event) => {
    const { name, value } = event.target;
    setNoticeForm((current) => ({ ...current, [name]: value }));
  };

  const handleGenerateNotice = async (event) => {
    event.preventDefault();

    if (!noticeForm.documentType || !noticeForm.details.trim()) {
      setNoticeError('Please select a document type and add the basic details.');
      return;
    }

    try {
      setNoticeLoading(true);
      setNoticeError('');
      setNoticeMessage('');
      const { data } = await api.post('/ai/notice/generate', noticeForm);
      setNoticeDraft(data?.draft || '');
    } catch (error) {
      console.error('Error generating notice:', error);
      setNoticeError(getNoticeRequestError(error, 'Failed to generate notice.'));
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleEditNotice = async (event) => {
    event.preventDefault();

    if (!noticeDraft.trim() || !noticeEditPrompt.trim()) {
      setNoticeError('Generate a draft and add an edit instruction first.');
      return;
    }

    try {
      setNoticeEditing(true);
      setNoticeError('');
      setNoticeMessage('');
      const { data } = await api.post('/ai/notice/edit', {
        documentType: noticeForm.documentType,
        currentDraft: noticeDraft,
        editInstruction: noticeEditPrompt,
      });
      setNoticeDraft(data?.draft || noticeDraft);
      setNoticeEditPrompt('');
    } catch (error) {
      console.error('Error editing notice:', error);
      setNoticeError(getNoticeRequestError(error, 'Failed to edit notice.'));
    } finally {
      setNoticeEditing(false);
    }
  };

  const handleCopyNotice = async () => {
    if (!noticeDraft.trim()) return;

    try {
      await navigator.clipboard.writeText(noticeDraft);
      setNoticeMessage('Draft copied.');
    } catch (error) {
      console.error('Error copying notice:', error);
      setNoticeMessage('Select the draft text and copy it manually.');
    }
  };

  const handleApplicantDecision = async (applicationId, status) => {
    if (!drawer.parentId) return;

    try {
      setUpdatingApplicantId(applicationId);
      const { data } = await api.patch(
        `/auth/lawyer/internships/${drawer.parentId}/applicants/${applicationId}/status`,
        { status }
      );

      setPublishedInternships((current) =>
        current.map((internship) =>
          internship.id === drawer.parentId
            ? {
                ...internship,
                applicants: (internship.applicants || []).map((applicant) =>
                  applicant.id === applicationId ? { ...applicant, status } : applicant
                ),
              }
            : internship
        )
      );

      setDrawer((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === applicationId ? { ...item, status } : item
        ),
      }));

      if (data?.stats) {
        setQuickStats(data.stats);
      }
    } catch (error) {
      console.error('Error updating applicant status:', error);
      alert(error.response?.data?.message || 'Failed to update applicant');
    } finally {
      setUpdatingApplicantId('');
    }
  };

  const pendingAppointments = appointments.filter((appointment) => appointment.status !== 'Accepted');
  const acceptedClients = appointments.filter((appointment) => appointment.status === 'Accepted');
  const pendingCount = pendingAppointments.filter((appointment) => appointment.status === 'Pending').length;
  const clientCount = acceptedClients.length;

  const cards = [
    {
      title: 'New Appointments',
      badge: pendingCount > 0 ? pendingCount : null,
      icon: <FaCalendarPlus className="text-4xl text-[#15a276]" />,
      desc: 'Review and manage incoming consultation requests.',
      onClick: () => setShowAppointmentsModal(true),
    },
    {
      title: 'Next Hearings',
      icon: <FaGavel className="text-4xl text-emerald-500" />,
      desc: 'Track your upcoming court dates and schedules.',
    },
    {
      title: 'Notice Generator',
      icon: <FaFileSignature className="text-4xl text-[#15a276]" />,
      desc: 'Quickly draft and send legal notices to parties.',
      onClick: () => setShowNoticeGenerator(true),
    },
    {
      title: 'My Clients',
      badge: clientCount > 0 ? clientCount : null,
      icon: <FaBriefcase className="text-4xl text-[#062552]" />,
      desc: 'See all clients whose requests you have accepted.',
      onClick: () => setShowClientsModal(true),
    },
    {
      title: 'Student Interaction',
      icon: <FaUserGraduate className="text-4xl text-cyan-400" />,
      desc: 'Publish internships and jam sessions for students.',
      onClick: () => setShowStudentInteractionModal(true),
    },
  ];

  const filteredDrawerItems = useMemo(() => {
    if (drawerFilter === 'All') return drawer.items;
    if (drawer.type === 'participants') return drawer.items;

    return drawer.items.filter(
      (item) => String(item.status || 'pending').toLowerCase() === drawerFilter.toLowerCase()
    );
  }, [drawer.items, drawer.type, drawerFilter]);

  const activeDrawerFilters = drawer.type === 'participants' ? participantFilters : applicantFilters;

  return (
    <div className="lawyer-theme min-h-screen bg-[#f3f8fb] text-[#062552] relative">
      <AppHeader variant="lawyer" onProfileClick={() => setShowProfileInfo((current) => !current)} />

      {showProfileInfo && (
        <div className="fixed right-4 top-20 w-72 bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 md:right-6">
          <div className="text-right">
            <h3 className="text-lg font-bold text-white leading-tight">
              {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName}` : 'Lawyer')}
            </h3>
            <p className="text-[12px] text-[#15a276] font-bold tracking-wide uppercase">
              {user?.lawyerProfile?.specialization || 'Legal Services'}
            </p>
            <div className="text-[12px] text-zinc-400 mt-3 space-y-2 block border-t border-zinc-800 pt-3">
              <p className="flex justify-between items-center">
                <span>Bar Council ID:</span>
                <span className="text-zinc-200 font-medium bg-zinc-950 px-2 py-1 rounded">
                  {user?.lawyerProfile?.barId || 'Not Provided'}
                </span>
              </p>
              <p className="flex justify-between items-center">
                <span>Age:</span>
                <span className="text-zinc-200 font-medium bg-zinc-950 px-2 py-1 rounded">
                  {user?.age || 'N/A'}
                </span>
              </p>
              <p className="flex justify-between items-center">
                <span>Location:</span>
                <span className="text-zinc-200 font-medium bg-zinc-950 px-2 py-1 rounded">
                  {user?.address?.city || user?.address?.district || 'Not Set'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-20">
          <div>
            <h1 className="text-4xl font-bold mb-2">Lawyer Dashboard</h1>
            <p className="text-zinc-400">Manage your appointments, hearings, and daily practice efficiently.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              onClick={card.onClick}
              className="relative bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-[#15a276]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
              {card.badge > 0 && (
                <div className="absolute top-4 right-4 bg-[#15a276] text-zinc-950 text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full shadow-lg animate-pulse">
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

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Quick Stats</h2>
              <p className="text-zinc-400 mt-2">A live view of your student engagement across internships and jam sessions.</p>
            </div>
            {interactionLoading ? <p className="text-sm text-zinc-500">Refreshing...</p> : null}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((stat) => (
              <div key={stat.key} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-sm text-zinc-400">{stat.label}</p>
                <p className={`mt-3 text-3xl font-bold ${stat.accent}`}>{quickStats[stat.key] || 0}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showAppointmentsModal && (
        <ModalShell title="Incoming Appointments" icon={<FaCalendarPlus className="text-[#15a276]" />} onClose={() => setShowAppointmentsModal(false)}>
          {loadingAppointments ? (
            <EmptyBlock icon={<FaCalendarPlus size={24} />} message="Loading appointment requests..." />
          ) : pendingAppointments.length === 0 ? (
            <EmptyBlock icon={<FaCalendarPlus size={24} />} message="No pending or rejected appointment requests right now." />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingAppointments.slice().reverse().map((appt) => (
                <div key={appt.id} className="bg-zinc-950 border border-zinc-800 hover:border-[#15a276]/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                  <div>
                    <h3 className="font-bold text-lg text-white">{appt.userName}</h3>
                    <p className="text-xs text-zinc-500 mb-2">Requested on: {new Date(appt.timestamp).toLocaleString()}</p>
                    <StatusPill status={appt.status} />
                  </div>
                  {appt.status === 'Pending' ? (
                    <div className="flex gap-3 w-full sm:w-auto mt-3 sm:mt-0 shadow-lg">
                      <button onClick={() => updateStatus(appt.id, 'Accepted')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#005c4b] hover:bg-[#007b64] text-[#e9edef] rounded-lg font-bold shadow-lg transition-transform active:scale-95">
                        <FaCheck /> Accept
                      </button>
                      <button onClick={() => updateStatus(appt.id, 'Rejected')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-red-900/40 hover:bg-red-800 text-red-100 rounded-lg font-bold transition-transform active:scale-95 border border-red-900/50">
                        <FaTimes /> Reject
                      </button>
                    </div>
                  ) : appt.status === 'Rejected' ? (
                    <p className="text-xs text-red-300 font-medium">Request rejected</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </ModalShell>
      )}

      {showClientsModal && (
        <ModalShell title="My Clients" icon={<FaBriefcase className="text-[#062552]" />} onClose={() => setShowClientsModal(false)}>
          {loadingAppointments ? (
            <EmptyBlock icon={<FaBriefcase size={24} />} message="Loading accepted clients..." />
          ) : acceptedClients.length === 0 ? (
            <EmptyBlock icon={<FaBriefcase size={24} />} message="No accepted clients yet." />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {acceptedClients.slice().reverse().map((client) => (
                <div key={client.id} className="bg-zinc-950 border border-zinc-800 hover:border-[#15a276]/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
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
                      className="px-5 py-2 bg-[#15a276] hover:bg-[#19b98d] text-zinc-950 rounded-lg font-bold transition-transform active:scale-95"
                    >
                      Go to Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalShell>
      )}

      {showStudentInteractionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-7xl flex flex-col max-h-[90vh] shadow-2xl relative z-[101] overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUserGraduate className="text-cyan-400" /> Student Interaction
                </h2>
                <p className="text-sm text-zinc-400 mt-2">Create, manage, and track all student engagement from one dashboard module.</p>
              </div>
              <button
                onClick={() => {
                  setShowStudentInteractionModal(false);
                  setDrawer(emptyDrawerState);
                  setResumePreview(null);
                }}
                className="text-zinc-400 hover:text-red-500 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              <div className="w-full xl:w-64 border-b xl:border-b-0 xl:border-r border-zinc-800 bg-zinc-950/40 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setStudentInteractionTab('internships');
                    setShowJamSessionForm(false);
                  }}
                  className={`w-full text-left rounded-xl px-4 py-4 font-semibold transition ${
                    studentInteractionTab === 'internships'
                      ? 'bg-[#15a276] text-zinc-950'
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
                <button
                  type="button"
                  onClick={() => {
                    setStudentInteractionTab('posts');
                    setShowInternshipForm(false);
                    setShowJamSessionForm(false);
                  }}
                  className={`mt-3 w-full text-left rounded-xl px-4 py-4 font-semibold transition ${
                    studentInteractionTab === 'posts'
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  Posts
                </button>
              </div>

              <div className="flex-1 grid min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="overflow-y-auto p-6">
                  {studentInteractionTab === 'internships' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">Posted Internships</h3>
                          <p className="text-sm text-zinc-400 mt-1">Track posted roles, applicant volume, and open or close intake without leaving the dashboard.</p>
                        </div>
                      </div>

                      {interactionLoading ? (
                        <EmptyBlock icon={<FaBriefcase size={24} />} message="Loading internships..." />
                      ) : publishedInternships.length === 0 ? (
                        <EmptyBlock icon={<FaBriefcase size={24} />} message="No internships published yet." />
                      ) : (
                        publishedInternships.map((internship) => (
                          <div key={internship.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className="text-lg font-bold text-white">{internship.title}</h4>
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                    internship.status === 'closed'
                                      ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  }`}>
                                    {internship.status === 'closed' ? 'Closed' : 'Open'}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-1">{internship.location || 'Location not specified'}</p>
                              </div>
                              <span className="text-xs font-bold bg-[#15a276]/10 text-[#19b98d] border border-[#15a276]/20 px-3 py-1 rounded-full">
                                {new Date(internship.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-sm text-zinc-300 mt-4 leading-7">{internship.description || 'No description added.'}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs text-zinc-400">
                              <div>Location: {internship.location || 'Not specified'}</div>
                              <div>Duration: {internship.duration || 'Not specified'}</div>
                              <div>Stipend: {internship.stipend || 'Not specified'}</div>
                              <div>{internship.applicationCount || 0} Applied</div>
                            </div>

                            <div className="mt-5 rounded-xl border border-zinc-800 bg-white p-4 text-zinc-950">
                              <ReactionBar
                                item={internship}
                                itemLabel="internship"
                                compact
                                onLike={handleInternshipLike}
                                onComment={handleInternshipComment}
                              />
                            </div>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => handleOpenApplicantsDrawer(internship)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-white hover:border-[#15a276]/40"
                              >
                                <Users size={16} />
                                View Applicants
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleInternshipStatus(internship)}
                                disabled={togglingInternshipId === internship.id}
                                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition ${
                                  internship.status === 'closed'
                                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                    : 'bg-red-900/60 hover:bg-red-800 text-red-100'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {togglingInternshipId === internship.id
                                  ? 'Updating...'
                                  : internship.status === 'closed'
                                    ? 'Reopen Internship'
                                    : 'Close Internship'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInternship(internship)}
                                disabled={deletingInternshipId === internship.id}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-900/60 bg-red-950/50 px-4 py-3 font-semibold text-red-100 transition hover:bg-red-900/70 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingInternshipId === internship.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : studentInteractionTab === 'jamSessions' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">Posted Jam Sessions</h3>
                          <p className="text-sm text-zinc-400 mt-1">Monitor participation and review everyone who joined from the same dashboard workspace.</p>
                        </div>
                      </div>

                      {interactionLoading ? (
                        <EmptyBlock icon={<FaUserGraduate size={24} />} message="Loading jam sessions..." />
                      ) : publishedJamSessions.length === 0 ? (
                        <EmptyBlock icon={<FaUserGraduate size={24} />} message="No jam sessions published yet." />
                      ) : (
                        publishedJamSessions.map((session) => (
                          <div key={session.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-white">{session.title}</h4>
                                <p className="text-sm text-zinc-400 mt-1">{session.location || 'Location not specified'}</p>
                              </div>
                              <span className="text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full">
                                {new Date(session.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-sm text-zinc-300 mt-4 leading-7">{session.summary || 'No description added.'}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs text-zinc-400">
                              <div>Schedule: {session.schedule || 'Not specified'}</div>
                              <div>Date: {new Date(session.createdAt).toLocaleDateString()}</div>
                              <div>Location: {session.location || 'Not specified'}</div>
                              <div>{session.participantCount || 0} Participants</div>
                            </div>

                            <div className="mt-5 rounded-xl border border-zinc-800 bg-white p-4 text-zinc-950">
                              <ReactionBar
                                item={session}
                                itemLabel="jam session"
                                compact
                                onLike={handleJamLike}
                                onComment={handleJamComment}
                              />
                            </div>

                            <div className="mt-5">
                              <button
                                type="button"
                                onClick={() => handleOpenParticipantsDrawer(session)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-white hover:border-cyan-500/40"
                              >
                                <Users size={16} />
                                View Participants
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">Published Posts</h3>
                          <p className="text-sm text-zinc-400 mt-1">General social posts from your account appear here and flow into the personalized student feed.</p>
                        </div>
                      </div>

                      {postLoading ? (
                        <EmptyBlock icon={<FaUserGraduate size={24} />} message="Loading posts..." />
                      ) : publishedPosts.length === 0 ? (
                        <EmptyBlock icon={<FaUserGraduate size={24} />} message="No posts published yet." />
                      ) : (
                        publishedPosts.map((post) => (
                          <FeedPostCard key={`lawyer-post-${post.id}`} post={post} />
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
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#15a276] hover:bg-[#19b98d] text-zinc-950 font-bold px-5 py-3 transition"
                      >
                        <FaPlus />
                        New Internship
                      </button>

                      {showInternshipForm && (
                        <form onSubmit={handlePublishInternship} className="mt-5 space-y-4">
                          <input name="title" value={internshipForm.title} onChange={handleInternshipInput} placeholder="Internship title" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" required />
                          <textarea name="description" value={internshipForm.description} onChange={handleInternshipInput} placeholder="Description" rows="4" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" required />
                          <input name="location" value={internshipForm.location} onChange={handleInternshipInput} placeholder="Location" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" />
                          <input name="duration" value={internshipForm.duration} onChange={handleInternshipInput} placeholder="Duration" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" />
                          <input name="stipend" value={internshipForm.stipend} onChange={handleInternshipInput} placeholder="Stipend" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" />
                          <button type="submit" className="w-full rounded-xl bg-white text-zinc-950 font-bold px-5 py-3 hover:bg-zinc-200 transition">
                            Publish Internship
                          </button>
                        </form>
                      )}
                    </div>
                  ) : studentInteractionTab === 'jamSessions' ? (
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
                          <textarea name="description" value={jamSessionForm.description} onChange={handleJamSessionInput} placeholder="Description" rows="5" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" required />
                          <input name="schedule" value={jamSessionForm.schedule} onChange={handleJamSessionInput} placeholder="Schedule" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" />
                          <input name="location" value={jamSessionForm.location} onChange={handleJamSessionInput} placeholder="Location / online" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" />
                          <button type="submit" className="w-full rounded-xl bg-white text-zinc-950 font-bold px-5 py-3 hover:bg-zinc-200 transition">
                            Publish Jam Session
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setPostError('');
                          setShowPostComposer(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-5 py-3 transition"
                      >
                        <FaPlus />
                        New Post
                      </button>
                      <p className="mt-4 text-sm leading-7 text-zinc-400">
                        Share general updates, insights, and media posts. These appear instantly in the social feed and are ranked by network relevance and recency.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {drawer.open ? (
                <div className="w-full xl:w-[390px] border-t xl:border-t-0 xl:border-l border-zinc-800 bg-zinc-950/90 p-6 overflow-y-auto">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{drawer.parentLabel}</p>
                      <h3 className="text-xl font-bold text-white mt-2">{drawer.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrawer(emptyDrawerState)}
                      className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-red-400"
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeDrawerFilters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setDrawerFilter(filter)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          drawerFilter === filter
                            ? 'bg-white text-zinc-950'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 space-y-4">
                    {filteredDrawerItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                        No records match this filter.
                      </div>
                    ) : (
                      filteredDrawerItems.map((item) => (
                        <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{item.name}</p>
                              <p className="text-xs text-zinc-400 mt-1">{item.email || 'No email shared'}</p>
                              <p className="text-xs text-zinc-500 mt-2">
                                {item.collegeName || 'College not shared'}
                                {item.yearOfStudy ? ` | ${item.yearOfStudy}` : ''}
                              </p>
                            </div>
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${
                              drawer.type === 'participants'
                                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                : item.status === 'accepted'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : item.status === 'rejected'
                                    ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                    : 'bg-[#15a276]/10 text-[#8de2c6] border-[#15a276]/20'
                            }`}>
                              {drawer.type === 'participants' ? 'Joined' : capitalize(item.status || 'pending')}
                            </span>
                          </div>

                          {item.coverMessage ? (
                            <p className="mt-3 text-xs leading-6 text-zinc-300">{item.coverMessage}</p>
                          ) : null}

                          {drawer.type === 'applicants' ? (
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-1 gap-2 text-xs text-zinc-300">
                                <ApplicantDetail label="Phone" value={item.phone} />
                                <ApplicantDetail label="Degree" value={item.degree} />
                                <ApplicantDetail label="Year" value={item.yearOfStudy} />
                                <ApplicantDetail label="Applied" value={formatDate(item.submittedAt)} />
                              </div>

                              {item.skills?.length ? (
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Skills</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {item.skills.map((skill) => (
                                      <span key={skill} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Resume and links</p>
                                <div className="mt-3 space-y-2">
                                  {item.resumeLink ? <ApplicantLink href={item.resumeLink} label="Open resume link" /> : null}
                                  {item.resumeUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setResumePreview({
                                        url: item.resumeUrl,
                                        fileName: item.resumeFileName || `${item.name || 'Applicant'} resume`,
                                      })}
                                      className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-xs font-bold text-blue-300 transition hover:border-blue-500/50 hover:text-blue-200"
                                    >
                                      View uploaded resume
                                    </button>
                                  ) : null}
                                  {item.linkedIn ? <ApplicantLink href={item.linkedIn} label="Open LinkedIn" /> : null}
                                  {item.portfolio ? <ApplicantLink href={item.portfolio} label="Open portfolio" /> : null}
                                  {item.resumeFileName ? (
                                    <p className="text-xs text-zinc-400">Attached file name: {item.resumeFileName}</p>
                                  ) : null}
                                  {!item.resumeLink && !item.resumeUrl && !item.linkedIn && !item.portfolio && !item.resumeFileName ? (
                                    <p className="text-xs text-zinc-500">No resume or external links shared.</p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApplicantDecision(item.id, 'accepted')}
                                  disabled={updatingApplicantId === item.id || item.status === 'accepted'}
                                  className="flex-1 rounded-lg bg-[#005c4b] px-4 py-2 text-sm font-bold text-[#e9edef] hover:bg-[#007b64] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updatingApplicantId === item.id ? 'Saving...' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplicantDecision(item.id, 'rejected')}
                                  disabled={updatingApplicantId === item.id || item.status === 'rejected'}
                                  className="flex-1 rounded-lg border border-red-900/60 bg-red-900/40 px-4 py-2 text-sm font-bold text-red-100 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updatingApplicantId === item.id ? 'Saving...' : 'Reject'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-4 text-xs text-zinc-500">
                              Joined on {new Date(item.joinedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {resumePreview ? (
        <ResumePreviewModal
          resume={resumePreview}
          onClose={() => setResumePreview(null)}
        />
      ) : null}

      {showNoticeGenerator ? (
        <ModalShell
          title="AI Notice Generator"
          icon={<FaFileSignature className="text-[#15a276]" />}
          onClose={() => setShowNoticeGenerator(false)}
          maxWidthClass="max-w-6xl"
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <form onSubmit={handleGenerateNotice} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-200 mb-2">Document Type</label>
                <select
                  name="documentType"
                  value={noticeForm.documentType}
                  onChange={handleNoticeInput}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#15a276]"
                >
                  {noticeDocumentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-200 mb-2">Basic Information</label>
                <textarea
                  name="details"
                  value={noticeForm.details}
                  onChange={handleNoticeInput}
                  rows="13"
                  placeholder="Add party names, addresses, facts, dates, amounts, obligations, notices already sent, relief required, deadline, and jurisdiction."
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#15a276]"
                />
              </div>

              {noticeError ? (
                <p className="rounded-xl border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-100">{noticeError}</p>
              ) : null}

              <button
                type="submit"
                disabled={noticeLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#15a276] px-5 py-3 font-bold text-white transition hover:bg-[#118b66] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaMagic />
                {noticeLoading ? 'Generating...' : 'Generate Document'}
              </button>
            </form>

            <div className="min-w-0 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-zinc-200">Generated Draft</label>
                  <button
                    type="button"
                    onClick={handleCopyNotice}
                    disabled={!noticeDraft.trim()}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-[#15a276] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  value={noticeDraft}
                  onChange={(event) => setNoticeDraft(event.target.value)}
                  rows="18"
                  placeholder="Your generated notice will appear here."
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 font-mono text-sm leading-7 text-zinc-100 outline-none focus:border-[#15a276]"
                />
              </div>

              <form onSubmit={handleEditNotice} className="space-y-3">
                <label className="block text-sm font-bold text-zinc-200">Edit With AI</label>
                <div className="flex flex-col gap-3 lg:flex-row">
                  <input
                    value={noticeEditPrompt}
                    onChange={(event) => setNoticeEditPrompt(event.target.value)}
                    placeholder="Example: make it stronger, add 15-day compliance deadline, simplify paragraph 3"
                    className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#15a276]"
                  />
                  <button
                    type="submit"
                    disabled={noticeEditing || !noticeDraft.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaMagic />
                    {noticeEditing ? 'Editing...' : 'Apply Edit'}
                  </button>
                </div>
              </form>

              {noticeMessage ? <p className="text-sm font-semibold text-blue-300">{noticeMessage}</p> : null}
            </div>
          </div>
        </ModalShell>
      ) : null}

      <PostComposerModal
        key={showPostComposer ? 'lawyer-post-open' : 'lawyer-post-closed'}
        open={showPostComposer}
        title="Create a lawyer post"
        description="Share a legal insight, win, announcement, or update with your students and network."
        submitting={posting}
        error={postError}
        onClose={() => {
          setShowPostComposer(false);
          setPostError('');
        }}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}

function ModalShell({ title, icon, onClose, children, maxWidthClass = 'max-w-3xl' }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
      <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl w-full ${maxWidthClass} flex flex-col max-h-[85vh] shadow-2xl relative z-[101]`}>
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {icon} {title}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-red-500 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition p-2"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}

function EmptyBlock({ icon, message }) {
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
      <div className="w-16 h-16 bg-zinc-900 text-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="text-zinc-400 font-medium">{message}</p>
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
        status === 'Pending'
          ? 'bg-[#15a276]/10 text-[#15a276] border-[#15a276]/20'
          : status === 'Accepted'
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20'
      }`}
    >
      <FaCircle className="text-[8px]" /> {status}
    </span>
  );
}

function ApplicantDetail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[190px] text-right font-semibold text-zinc-200">{value || 'Not shared'}</span>
    </div>
  );
}

function ResumePreviewModal({ resume, onClose }) {
  const resumeUrl = normalizeExternalUrl(resume.url);
  const fileName = resume.fileName || 'Uploaded resume';
  const filePath = `${fileName} ${resumeUrl.split('?')[0]}`.toLowerCase();
  const isImage = /\.(png|jpe?g|webp|gif)\b/.test(filePath);
  const isPdf = /\.pdf\b/.test(filePath);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(isPdf);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isPdf) return undefined;

    const controller = new AbortController();
    let objectUrl = '';

    const loadPdf = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError('');

        const response = await fetch(resumeUrl, { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load this PDF');

        const fileBlob = await response.blob();
        const pdfBlob = fileBlob.type === 'application/pdf'
          ? fileBlob
          : new Blob([fileBlob], { type: 'application/pdf' });

        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(objectUrl);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setPreviewError('The PDF could not be displayed. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    };

    loadPdf();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isPdf, resumeUrl]);

  const officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeUrl)}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${fileName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15a276]">Resume preview</p>
            <h3 className="mt-1 truncate font-semibold text-white">{fileName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-zinc-800 p-2 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
            aria-label="Close resume preview"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-zinc-800">
          {previewLoading ? (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-300">
              Loading PDF preview...
            </div>
          ) : previewError ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-red-300">
              {previewError}
            </div>
          ) : isImage ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <img src={resumeUrl} alt={fileName} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <iframe
              src={isPdf ? pdfPreviewUrl : officePreviewUrl}
              title={fileName}
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicantLink({ href, label }) {
  const safeHref = normalizeExternalUrl(href);

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-blue-300 transition hover:border-blue-500/50 hover:text-blue-200"
    >
      {label}
    </a>
  );
}

function normalizeExternalUrl(url) {
  return String(url || '').startsWith('http') ? url : `https://${url}`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function capitalize(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
