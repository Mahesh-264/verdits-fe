import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaBriefcase,
  FaCalendarPlus,
  FaFileSignature,
  FaGavel,
  FaUserGraduate,
} from 'react-icons/fa';
import { Users } from 'lucide-react';
import api from '../api/axios';
import AppHeader from '../components/AppHeader.jsx';
import PostComposerModal from '../components/feed/PostComposerModal.jsx';
import { updateUser } from '../redux/authSlice.jsx';
import socket from '../utils/socket.jsx';

// Modular Lawyer Feature Components & Shared Utilities
import {
  applicantFilters,
  emptyDrawerState,
  formatDate,
  formatTime,
  getEntityId,
  getNoticeRequestError,
  getTeamCaseStatusLabel,
  getUserName,
  initialCreateTeamForm,
  initialJoinTeamForm,
  initialNoticeForm,
  initialStats,
  initialTeamCaseForm,
  isSameId,
  normalizeStatus,
  participantFilters,
  statCards,
  teamCaseStatuses,
} from '../utils/lawyerUtils';

import LawyerAppointmentsModal from '../components/Lawyer/LawyerAppointmentsModal.jsx';
import LawyerClientsModal from '../components/Lawyer/LawyerClientsModal.jsx';
import LawyerNextHearingsModal from '../components/Lawyer/LawyerNextHearingsModal.jsx';
import LawyerNoticeGeneratorModal from '../components/Lawyer/LawyerNoticeGeneratorModal.jsx';
import { ApplicantDrawer, EmptyBlock, ResumePreviewModal } from '../components/Lawyer/LawyerSharedComponents.jsx';
import LawyerStudentInteractionModal from '../components/Lawyer/LawyerStudentInteractionModal.jsx';
import LawyerTeamModal from '../components/Lawyer/LawyerTeamModal.jsx';

export default function LawyerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Feature Visibility Modals
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showHearingsModal, setShowHearingsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showNoticeGenerator, setShowNoticeGenerator] = useState(false);
  const [showStudentInteractionModal, setShowStudentInteractionModal] = useState(false);

  // Appointments & Clients State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Next Hearings State
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState({ connected: false, email: null });
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState(false);
  const [googleCalendarActionLoading, setGoogleCalendarActionLoading] = useState(false);
  const [lawyerNextHearings, setLawyerNextHearings] = useState([]);
  const [lawyerNextHearingsLoaded, setLawyerNextHearingsLoaded] = useState(false);

  // Team Workspace State
  const [teamMode, setTeamMode] = useState('create');
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamWorkspaceLoading, setTeamWorkspaceLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamMessage, setTeamMessage] = useState('');
  const [teamWorkspace, setTeamWorkspace] = useState(null);
  const [teamWorkspaces, setTeamWorkspaces] = useState([]);
  const [, setSelectedTeamIdState] = useState('');
  const selectedTeamIdRef = useRef('');

  const setSelectedTeamId = useCallback((id) => {
    const nextId = id ? String(id) : '';
    selectedTeamIdRef.current = nextId;
    setSelectedTeamIdState(nextId);
  }, []);

  const [activeTeamTab, setActiveTeamTab] = useState('my_cases');
  const [showTeamCaseForm, setShowTeamCaseForm] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState('');
  const [selectedLawyerRecord, setSelectedLawyerRecord] = useState(null);
  const [selectedLawyerCases, setSelectedLawyerCases] = useState(null);
  const [memberOwnedTeam, setMemberOwnedTeam] = useState(null);
  const [memberOwnedTeamLoading, setMemberOwnedTeamLoading] = useState(false);
  const [memberOwnedTeamError, setMemberOwnedTeamError] = useState('');
  const [selectedCaseForDetailsId, setSelectedCaseForDetailsId] = useState('');
  const [savingTeamCase, setSavingTeamCase] = useState(false);
  const [updatingTeamCaseId, setUpdatingTeamCaseId] = useState('');
  const [updatingTeamRequestId, setUpdatingTeamRequestId] = useState('');
  const [removingTeamMemberId, setRemovingTeamMemberId] = useState('');
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [createTeamForm, setCreateTeamForm] = useState(initialCreateTeamForm);
  const [joinTeamForm, setJoinTeamForm] = useState(initialJoinTeamForm);
  const [teamCaseForm, setTeamCaseForm] = useState(initialTeamCaseForm);

  // Student Interaction State
  const [studentInteractionTab, setStudentInteractionTab] = useState('internships');
  const [publishedInternships, setPublishedInternships] = useState([]);
  const [publishedJamSessions, setPublishedJamSessions] = useState([]);
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [followerStudents, setFollowerStudents] = useState([]);
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
  const [updatingApplicantId, setUpdatingApplicantId] = useState('');
  const [togglingInternshipId, setTogglingInternshipId] = useState('');
  const [deletingInternshipId, setDeletingInternshipId] = useState('');
  const [deletingJamSessionId, setDeletingJamSessionId] = useState('');
  const [internshipForm, setInternshipForm] = useState({
    title: '',
    description: '',
    duration: '',
    location: '',
    stipend: '',
  });
  const [jamSessionForm, setJamSessionForm] = useState({
    title: '',
    topic: '',
    summary: '',
    scheduleDate: '',
    scheduleTime: '',
    schedule: '',
    location: '',
  });
  const [deletingPostId, setDeletingPostId] = useState('');

  // Notice Generator State
  const [noticeForm, setNoticeForm] = useState(initialNoticeForm);
  const [noticeDraft, setNoticeDraft] = useState('');
  const [noticeEditPrompt, setNoticeEditPrompt] = useState('');
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeEditing, setNoticeEditing] = useState(false);
  const [noticeError, setNoticeError] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  // --- API DATA FETCHERS ---
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
      setFollowerStudents(Array.isArray(data?.followers) ? data.followers : []);
      setQuickStats(data?.stats || initialStats);
    } catch (error) {
      console.error('Error loading student interaction posts:', error);
      setPublishedInternships([]);
      setPublishedJamSessions([]);
      setFollowerStudents([]);
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

  const refreshCurrentUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      dispatch(updateUser(data));
      return data;
    } catch (error) {
      console.error('Error refreshing current lawyer:', error);
      return null;
    }
  }, [dispatch]);

  const loadGoogleCalendarStatus = useCallback(async () => {
    try {
      setGoogleCalendarLoading(true);
      const { data } = await api.get('/calendar/google/status');
      setGoogleCalendarStatus({ connected: Boolean(data?.connected), email: data?.email || null });
    } catch (error) {
      console.error('Error fetching Google Calendar status:', error);
      setGoogleCalendarStatus({ connected: false, email: null });
    } finally {
      setGoogleCalendarLoading(false);
    }
  }, []);

  const loadLawyerNextHearings = useCallback(async () => {
    try {
      const { data } = await api.get('/teams/next-hearings');
      setLawyerNextHearings(Array.isArray(data?.cases) ? data.cases : []);
    } catch (error) {
      console.error('Error loading lawyer-wide next hearings:', error);
      setLawyerNextHearings([]);
    } finally {
      setLawyerNextHearingsLoaded(true);
    }
  }, []);

  const [noTeamCases, setNoTeamCases] = useState([]);

  const loadTeamWorkspace = useCallback(async (targetTeamId) => {
    const effectiveTeamId = targetTeamId !== undefined ? targetTeamId : selectedTeamIdRef.current;
    try {
      setTeamWorkspaceLoading(true);
      const params = effectiveTeamId ? { teamId: effectiveTeamId } : undefined;
      const { data } = await api.get('/teams/workspace', { params });
      const teams = Array.isArray(data?.teams) ? data.teams : data?.team ? [data.team] : [];
      let activeId = effectiveTeamId;
      if (!activeId || !teams.some((t) => String(t.id) === String(activeId))) {
        activeId = data?.activeTeamId || data?.team?.id || teams[0]?.id || '';
      }
      setTeamWorkspaces(teams);
      if (activeId) {
        selectedTeamIdRef.current = String(activeId);
        setSelectedTeamIdState(String(activeId));
      } else {
        setSelectedTeamId('');
      }
      setTeamWorkspace(data?.team || null);
      if (Array.isArray(data?.cases)) {
        setNoTeamCases(data.cases);
      } else {
        setNoTeamCases([]);
      }
    } catch (error) {
      console.error('Error loading team workspace:', error);
      setTeamWorkspace(null);
      setTeamWorkspaces([]);
      setNoTeamCases([]);
    } finally {
      setTeamWorkspaceLoading(false);
    }
  }, [setSelectedTeamId]);

  const handleSelectTeam = useCallback((teamId) => {
    if (!teamId) return;
    const targetId = String(teamId);
    if (targetId === selectedTeamIdRef.current && teamWorkspace?.id === targetId) return;
    selectedTeamIdRef.current = targetId;
    setSelectedTeamIdState(targetId);
    setSelectedTeamMemberId('');
    setSelectedLawyerRecord(null);
    setSelectedLawyerCases(null);
    setMemberOwnedTeam(null);
    setMemberOwnedTeamError('');
    setSelectedCaseForDetailsId('');
    loadTeamWorkspace(targetId);
  }, [loadTeamWorkspace, teamWorkspace?.id]);

  // Sync state with URL search params
  useEffect(() => {
    const requestedSection = searchParams.get('section');
    setShowAppointmentsModal(false);
    setShowClientsModal(false);
    setShowHearingsModal(false);
    setShowTeamModal(false);
    setShowNoticeGenerator(false);
    setShowStudentInteractionModal(false);

    if (requestedSection === 'student-interactions') {
      setShowStudentInteractionModal(true);
    }
    if (requestedSection === 'appointments') {
      setShowAppointmentsModal(true);
    }
    if (requestedSection === 'hearings') {
      setShowHearingsModal(true);
      loadLawyerNextHearings();
    }
    if (requestedSection === 'notice-generator') {
      setShowNoticeGenerator(true);
    }
    if (requestedSection === 'clients') {
      setShowClientsModal(true);
    }
    if (requestedSection === 'team') {
      const requestedMode = searchParams.get('mode');
      const requestedTeamId = searchParams.get('teamId');
      if (requestedTeamId && String(requestedTeamId) !== String(selectedTeamIdRef.current)) {
        selectedTeamIdRef.current = String(requestedTeamId);
        setSelectedTeamIdState(String(requestedTeamId));
      }
      setTeamMode(requestedMode === 'join' ? 'join' : 'overview');
      setTeamError('');
      setTeamMessage('');
      setShowTeamModal(true);
    }

    const requestedTab = searchParams.get('tab');
    if (['internships', 'jamSessions', 'posts', 'followers'].includes(requestedTab)) {
      setStudentInteractionTab(requestedTab);
    }
  }, [searchParams, user?.lawyerProfile?.team?.teamCode]);

  useEffect(() => {
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    if (!fullName) return;
    setCreateTeamForm((current) => (
      current.seniorLawyerName ? current : { ...current, seniorLawyerName: fullName }
    ));
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    if (!user) return;
    loadAppointments();
    loadStudentInteractionPosts();
    loadOwnPosts();
    loadGoogleCalendarStatus();
    loadLawyerNextHearings();
  }, [loadAppointments, loadGoogleCalendarStatus, loadLawyerNextHearings, loadOwnPosts, loadStudentInteractionPosts, user]);

  useEffect(() => {
    if (user?.role !== 'lawyer') return;
    loadTeamWorkspace();
  }, [loadTeamWorkspace, user?.role]);

  useEffect(() => {
    if (!showTeamModal) return;
    refreshCurrentUser();
    loadTeamWorkspace(selectedTeamIdRef.current);
  }, [refreshCurrentUser, loadTeamWorkspace, showTeamModal]);

  useEffect(() => {
    if (user?.role !== 'lawyer') return undefined;
    const refreshTeamWorkspace = (event) => {
      if (/^(case|hearing)[.:]/.test(String(event?.type || '')) || event?.caseId || event?.hearingId) loadLawyerNextHearings();
      if (event?.teamId && selectedTeamIdRef.current && String(event.teamId) !== String(selectedTeamIdRef.current)) return;
      loadTeamWorkspace(selectedTeamIdRef.current);
    };
    const events = ['team:created', 'team:member-joined', 'team:member-left', 'team:join-request-created', 'team:join-request-rejected', 'case:created', 'case:updated', 'case:deleted', 'case:status-changed', 'hearing:created', 'hearing:updated', 'hearing:deleted', 'case.created', 'case.updated', 'case.deleted', 'hearing.created', 'hearing.updated', 'hearing.deleted', 'client.updated'];
    events.forEach((event) => socket.on(event, refreshTeamWorkspace));
    return () => events.forEach((event) => socket.off(event, refreshTeamWorkspace));
  }, [loadLawyerNextHearings, loadTeamWorkspace, user?.role]);

  // Google Calendar URL Auth Redirection Listener
  useEffect(() => {
    const calendarParam = searchParams.get('calendar');
    if (calendarParam === 'success') {
      setTeamMessage('Google Calendar connected successfully!');
      loadGoogleCalendarStatus();
      setSearchParams((params) => {
        params.delete('calendar');
        return params;
      });
    } else if (calendarParam === 'error') {
      setTeamError('Failed to connect Google Calendar.');
      setSearchParams((params) => {
        params.delete('calendar');
        return params;
      });
    }
  }, [searchParams, setSearchParams, loadGoogleCalendarStatus]);

  // --- HANDLERS ---
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
    const partnerId = selectedPartner._id || selectedPartner.id;
    navigate(`/chat?partnerId=${encodeURIComponent(partnerId)}`, {
      state: { selectedPartner, returnTo: '/lawyer-dash' },
    });
    setShowAppointmentsModal(false);
    setShowClientsModal(false);
  };

  const resetInternshipForm = () => {
    setInternshipForm({ title: '', description: '', duration: '', location: '', stipend: '' });
  };

  const resetJamSessionForm = () => {
    setJamSessionForm({
      title: '',
      topic: '',
      summary: '',
      scheduleDate: '',
      scheduleTime: '',
      schedule: '',
      location: '',
    });
  };

  const handleInternshipInput = (event) => {
    const { name, value } = event.target;
    setInternshipForm((current) => ({ ...current, [name]: value }));
  };

  const formatJamSchedule = (dateStr, timeStr) => {
    if (!dateStr) return timeStr || '';
    const dateObj = new Date(`${dateStr}T${timeStr || '00:00'}`);
    if (Number.isNaN(dateObj.getTime())) return `${dateStr} ${timeStr || ''}`.trim();

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (!timeStr) return formattedDate;

    const [hours, minutes] = timeStr.split(':');
    const tempDate = new Date();
    tempDate.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10));
    const formattedTime = tempDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${formattedDate} at ${formattedTime}`;
  };

  const handleJamSessionInput = (event) => {
    const { name, value } = event.target;
    setJamSessionForm((current) => {
      const updated = { ...current, [name]: value };
      if (name === 'scheduleDate' || name === 'scheduleTime') {
        const dateStr = name === 'scheduleDate' ? value : current.scheduleDate;
        const timeStr = name === 'scheduleTime' ? value : current.scheduleTime;
        updated.schedule = formatJamSchedule(dateStr, timeStr);
      }
      return updated;
    });
  };

  const handleCreateTeamInput = (event) => {
    const { name, value } = event.target;
    setCreateTeamForm((current) => ({ ...current, [name]: value }));
  };

  const handleJoinTeamInput = (event) => {
    const { name, value } = event.target;
    setJoinTeamForm((current) => ({ ...current, [name]: value.toUpperCase() }));
  };

  const handleTeamCaseInput = (event) => {
    const { name, value } = event.target;
    setTeamCaseForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    try {
      setTeamLoading(true);
      setTeamError('');
      setTeamMessage('');
      const payload = {
        firmName: createTeamForm.firmName.trim(),
        seniorLawyerName: createTeamForm.seniorLawyerName.trim(),
        maxTeamSize: Number(createTeamForm.maxTeamSize),
      };
      const { data } = await api.post('/teams', payload);
      if (data?.user) dispatch(updateUser(data.user));
      setTeamMode('overview');
      setTeamMessage(`Team created. Code: ${data?.team?.teamCode || ''}`);
      const teams = Array.isArray(data?.teams) ? data.teams : data?.team ? [data.team] : [];
      setTeamWorkspaces(teams);
      setSelectedTeamId(data?.team?.id ? String(data.team.id) : '');
      setTeamWorkspace(data?.team || null);
    } catch (error) {
      console.error('Error creating team:', error);
      setTeamError(error.response?.data?.message || 'Failed to create team');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleJoinTeam = async (event) => {
    event.preventDefault();
    try {
      setTeamLoading(true);
      setTeamError('');
      setTeamMessage('');
      const { data } = await api.post('/teams/join-requests', { teamCode: joinTeamForm.teamCode.trim() });
      if (data?.requestPending) {
        setJoinTeamForm(initialJoinTeamForm);
        setTeamMessage(data.message || 'Join request sent to the team owner.');
        return;
      }
      if (data?.user) dispatch(updateUser(data.user));
      setTeamMode('overview');
      setJoinTeamForm(initialJoinTeamForm);
      setTeamMessage('Team joined successfully.');
      const workspaceResponse = await api.get('/teams/workspace');
      setTeamWorkspaces(Array.isArray(workspaceResponse.data?.teams) ? workspaceResponse.data.teams : []);
      setTeamWorkspace(workspaceResponse.data?.team || null);
    } catch (error) {
      console.error('Error joining team:', error);
      setTeamError(error.response?.data?.message || 'Failed to join team');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCopyTeamCode = async () => {
    const teamCode = teamWorkspace?.teamCode;
    if (!teamCode) return;
    try {
      await navigator.clipboard.writeText(teamCode);
      setTeamMessage('Team code copied.');
    } catch (error) {
      console.error('Error copying team code:', error);
      setTeamMessage('Select the team code and copy it manually.');
    }
  };

  const handleAddTeamCase = async (event) => {
    event.preventDefault();
    const targetTeamId = teamWorkspace?.id || 'personal';
    try {
      setSavingTeamCase(true);
      setTeamError('');
      setTeamMessage('');
      await api.post(`/teams/${targetTeamId}/cases`, {
        clientName: teamCaseForm.clientName.trim(),
        clientPhone: teamCaseForm.clientPhone.trim(),
        clientAddress: teamCaseForm.clientAddress.trim(),
        caseName: teamCaseForm.caseName.trim(),
        courtName: teamCaseForm.courtName.trim(),
        startingDate: teamCaseForm.startingDate || undefined,
        hearingDate: teamCaseForm.hearingDate || undefined,
        hearingTime: teamCaseForm.hearingTime || undefined,
        briefInfo: teamCaseForm.briefInfo.trim(),
        status: teamCaseForm.status,
      });
      setTeamCaseForm(initialTeamCaseForm);
      setShowTeamCaseForm(false);
      setTeamMessage('Case saved under your lawyer profile.');
      await Promise.all([loadTeamWorkspace(), loadLawyerNextHearings()]);
    } catch (error) {
      console.error('Error adding team case:', error);
      setTeamError(error.response?.data?.message || 'Failed to add team case');
    } finally {
      setSavingTeamCase(false);
    }
  };

  const handleUpdateTeamCaseStatus = async (teamCase, nextStatus) => {
    if (!teamCase?.id) return;
    const targetTeamId = teamWorkspace?.id || 'personal';
    try {
      setUpdatingTeamCaseId(String(teamCase.id));
      setTeamError('');
      await api.put(`/teams/${targetTeamId}/cases/${teamCase.id}/status`, { status: nextStatus });
      await Promise.all([loadTeamWorkspace(), loadLawyerNextHearings()]);
    } catch (error) {
      console.error('Error updating team case status:', error);
      setTeamError(error.response?.data?.message || 'Failed to update case status');
    } finally {
      setUpdatingTeamCaseId('');
    }
  };

  const handleDeleteTeamCase = async (teamCase) => {
    if (!teamCase?.id) return;
    const targetTeamId = teamWorkspace?.id || 'personal';
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the case "${teamCase.caseName || teamCase.title || 'Untitled Case'}"?`);
    if (!confirmDelete) return;
    try {
      setUpdatingTeamCaseId(String(teamCase.id));
      setTeamError('');
      setTeamMessage('');
      await api.delete(`/teams/${targetTeamId}/cases/${teamCase.id}`);
      setSelectedCaseForDetailsId('');
      setTeamMessage('Case deleted successfully.');
      await Promise.all([loadTeamWorkspace(), loadLawyerNextHearings()]);
    } catch (error) {
      console.error('Error deleting team case:', error);
      setTeamError(error.response?.data?.message || 'Failed to delete case');
    } finally {
      setUpdatingTeamCaseId('');
    }
  };

  const handleTeamRequestDecision = async (request, action) => {
    if (!teamWorkspace?.id || !request?.id) return;
    const isApprove = action === 'accept' || action === 'approve';
    const decision = isApprove ? 'approve' : 'reject';
    try {
      setUpdatingTeamRequestId(String(request.id));
      setTeamError('');
      setTeamMessage('');
      const { data } = await api.patch(`/teams/${teamWorkspace.id}/join-requests/${request.id}/${decision}`);
      if (data?.user && String(data.user._id || data.user.id) === String(user?._id || user?.id)) {
        dispatch(updateUser(data.user));
      }
      setTeamMessage(isApprove ? 'Join request accepted.' : 'Join request rejected.');
      await loadTeamWorkspace();
    } catch (error) {
      console.error(`Error processing join request (${action}):`, error);
      setTeamError(error.response?.data?.message || `Failed to ${isApprove ? 'accept' : 'reject'} join request`);
    } finally {
      setUpdatingTeamRequestId('');
    }
  };

  const handleRemoveTeamMember = async (member) => {
    if (!teamWorkspace?.id || !member) return;
    const memberId = getEntityId(member.lawyerId || member.id);
    if (!memberId) {
      setTeamError('Unable to identify team member');
      return;
    }
    const confirmRemove = window.confirm(`Are you sure you want to remove ${member.name || 'this member'} from the team?`);
    if (!confirmRemove) return;
    try {
      setRemovingTeamMemberId(memberId);
      setTeamError('');
      setTeamMessage('');
      await api.delete(`/teams/${teamWorkspace.id}/members/${memberId}`);
      if (selectedTeamMemberId && String(selectedTeamMemberId) === String(member.id)) {
        setSelectedTeamMemberId('');
      }
      setTeamMessage(`${member.name || 'Member'} removed from the team.`);
      await loadTeamWorkspace();
    } catch (error) {
      console.error('Error removing team member:', error);
      setTeamError(error.response?.data?.message || 'Failed to remove team member');
    } finally {
      setRemovingTeamMemberId('');
    }
  };

  const handleLeaveTeam = async () => {
    if (!teamWorkspace?.id || !currentLawyerId) return;
    if (!window.confirm(`Leave ${teamWorkspace.firmName || 'this team'}?`)) return;
    try {
      setRemovingTeamMemberId(String(currentLawyerId));
      setTeamError('');
      setTeamMessage('');
      await api.delete(`/teams/${teamWorkspace.id}/members/${currentLawyerId}`);
      setSelectedTeamMemberId('');
      setSelectedCaseForDetailsId('');
      setActiveTeamTab('my_cases');
      setTeamMessage('You left the team.');
      await loadTeamWorkspace();
      await loadLawyerNextHearings();
    } catch (error) {
      console.error('Error leaving team:', error);
      setTeamError(error.response?.data?.message || 'Failed to leave team');
    } finally {
      setRemovingTeamMemberId('');
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamWorkspace?.id || !displayIsTeamOwner) return;
    try {
      setDeletingTeam(true);
      setTeamError('');
      setTeamMessage('');
      const { data } = await api.delete(`/teams/${teamWorkspace.id}`);
      const workspace = data?.data;
      const teams = Array.isArray(workspace?.teams) ? workspace.teams : [];
      const nextTeamId = workspace?.activeTeamId || workspace?.team?.id || teams[0]?.id || '';
      setSelectedTeamMemberId('');
      setSelectedCaseForDetailsId('');
      setSelectedLawyerRecord(null);
      setSelectedLawyerCases(null);
      setMemberOwnedTeam(null);
      setActiveTeamTab('my_cases');
      setShowTeamCaseForm(false);
      setTeamWorkspaces(teams);
      setTeamWorkspace(workspace?.team || null);
      setSelectedTeamId(nextTeamId);
      setTeamMode(workspace?.team ? 'overview' : 'create');
      setTeamMessage('Team deleted successfully.');
      await Promise.all([loadTeamWorkspace(nextTeamId), loadLawyerNextHearings()]);
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      setTeamError(error.response?.data?.message || 'Failed to delete team');
      return false;
    } finally {
      setDeletingTeam(false);
    }
  };

  const handlePublishInternship = async (event) => {
    event.preventDefault();
    try {
      setInteractionLoading(true);
      await api.post('/auth/lawyer/internships', internshipForm);
      resetInternshipForm();
      setShowInternshipForm(false);
      await loadStudentInteractionPosts();
    } catch (error) {
      console.error('Error publishing internship:', error);
      alert(error.response?.data?.message || 'Failed to publish internship');
    } finally {
      setInteractionLoading(false);
    }
  };

  const handlePublishJamSession = async (event) => {
    event.preventDefault();
    try {
      setInteractionLoading(true);
      await api.post('/auth/lawyer/jam-sessions', jamSessionForm);
      resetJamSessionForm();
      setShowJamSessionForm(false);
      await loadStudentInteractionPosts();
    } catch (error) {
      console.error('Error publishing jam session:', error);
      alert(error.response?.data?.message || 'Failed to publish jam session');
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleToggleInternshipStatus = async (internship) => {
    try {
      setTogglingInternshipId(internship.id);
      const nextStatus = internship.status === 'closed' ? 'open' : 'closed';
      await api.patch(`/auth/lawyer/internships/${internship.id}/toggle-status`);
      await loadStudentInteractionPosts();
    } catch (error) {
      console.error('Error toggling internship status:', error);
      alert(error.response?.data?.message || 'Failed to update internship status');
    } finally {
      setTogglingInternshipId('');
    }
  };

  const handleDeleteInternship = async (internship) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${internship.title}"?`);
    if (!confirmDelete) return;

    try {
      setDeletingInternshipId(internship.id);
      await api.delete(`/auth/lawyer/internships/${internship.id}`);
      await loadStudentInteractionPosts();
    } catch (error) {
      console.error('Error deleting internship:', error);
      alert(error.response?.data?.message || 'Failed to delete internship');
    } finally {
      setDeletingInternshipId('');
    }
  };

  const handleDeleteJamSession = async (session) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${session.title}"?`);
    if (!confirmDelete) return;

    try {
      setDeletingJamSessionId(session.id);
      await api.delete(`/auth/lawyer/jam-sessions/${session.id}`);
      await loadStudentInteractionPosts();
    } catch (error) {
      console.error('Error deleting jam session:', error);
      alert(error.response?.data?.message || 'Failed to delete jam session');
    } finally {
      setDeletingJamSessionId('');
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
      formData.append('visibility', visibility || 'public');
      (tags || []).forEach((tag) => formData.append('tags', tag));
      (images || []).slice(0, 3).forEach((image) => formData.append('images', image));

      const { data } = await api.post('/posts/create', formData);
      if (data?.post) {
        setPublishedPosts((current) => [data.post, ...current]);
      }
      setShowPostComposer(false);
      await loadOwnPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setPostError(error.response?.data?.message || 'Unable to publish this post right now.');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (!post || !post.id) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      setDeletingPostId(post.id);
      await api.delete(`/posts/${post.id}`);
      setPublishedPosts((prev) => prev.filter((item) => String(item.id) !== String(post.id)));
      await loadStudentInteractionPosts();
      await loadOwnPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeletingPostId('');
    }
  };

  const handleOpenApplicantsDrawer = (internship) => {
    // Applicants are returned with the lawyer's student-interactions payload.
    // Opening from that source avoids a second request and keeps the drawer
    // available even when the selected internship has no applicants.
    setDrawerFilter('All');
    setDrawer({
      open: true,
      type: 'applicants',
      title: internship.title,
      parentId: internship.id,
      parentLabel: 'Internship Role',
      items: Array.isArray(internship.applicants) ? internship.applicants : [],
    });
  };

  const handleOpenParticipantsDrawer = (jamSession) => {
    // These are returned by the same authenticated student-interactions API
    // that supplies participantCount, so the count and drawer always reflect
    // the same persisted jam-session participant array.
    const participants = Array.isArray(jamSession.joinedStudents)
      ? jamSession.joinedStudents
      : [];

    setDrawerFilter('All');
    setDrawer({
      open: true,
      type: 'participants',
      title: jamSession.title,
      parentId: jamSession.id,
      parentLabel: 'Jam Session',
      items: participants,
    });
  };

  const handleApplicantDecision = async (applicantId, status) => {
    if (!drawer.parentId) return;
    try {
      setUpdatingApplicantId(applicantId);
      await api.patch(`/auth/lawyer/internships/${drawer.parentId}/applicants/${applicantId}/status`, { status });
      setDrawer((current) => ({
        ...current,
        items: current.items.map((item) => (
          String(item.id) === String(applicantId) ? { ...item, status } : item
        )),
      }));
      setDrawerFilter(status === 'accepted' ? 'Accepted' : 'Rejected');
      await loadStudentInteractionPosts();
    } catch (error) {
      console.error('Error updating applicant status:', error);
      alert(error.response?.data?.message || 'Failed to update applicant status');
    } finally {
      setUpdatingApplicantId('');
    }
  };

  const handleNoticeInput = (event) => {
    const { name, value, type, checked } = event.target;
    setNoticeForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNoticeNameInput = (fieldId, index, value) => {
    setNoticeForm((current) => {
      const currentList = Array.isArray(current[fieldId]) ? [...current[fieldId]] : [''];
      currentList[index] = value;
      return { ...current, [fieldId]: currentList };
    });
  };

  const addNoticeName = (fieldId) => {
    setNoticeForm((current) => {
      const currentList = Array.isArray(current[fieldId]) ? [...current[fieldId]] : [''];
      return { ...current, [fieldId]: [...currentList, ''] };
    });
  };

  const removeNoticeName = (fieldId, index) => {
    setNoticeForm((current) => {
      const currentList = Array.isArray(current[fieldId]) ? [...current[fieldId]] : [''];
      if (currentList.length <= 1) return current;
      currentList.splice(index, 1);
      return { ...current, [fieldId]: currentList };
    });
  };

  const handleGenerateNotice = async (event) => {
    event.preventDefault();
    try {
      setNoticeLoading(true);
      setNoticeError('');
      setNoticeMessage('');
      const payload = {
        documentType: noticeForm.documentType,
        clientNames: (noticeForm.clientNames || []).map((name) => name.trim()).filter(Boolean),
        oppositePartyNames: (noticeForm.oppositePartyNames || []).map((name) => name.trim()).filter(Boolean),
        details: noticeForm,
      };
      const { data } = await api.post('/notices/generate', payload);
      setNoticeDraft(data.draft || '');
      setNoticeMessage('Notice generated successfully.');
    } catch (error) {
      console.error('Error generating notice:', error);
      setNoticeError(getNoticeRequestError(error, 'Failed to generate legal notice.'));
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleEditNotice = async (event) => {
    event.preventDefault();
    if (!noticeDraft.trim() || !noticeEditPrompt.trim()) return;
    try {
      setNoticeEditing(true);
      setNoticeError('');
      setNoticeMessage('');
      const { data } = await api.post('/notices/edit', {
        currentDraft: noticeDraft,
        editInstruction: noticeEditPrompt.trim(),
      });
      setNoticeDraft(data.updatedDraft || noticeDraft);
      setNoticeEditPrompt('');
      setNoticeMessage('Draft updated based on your instruction.');
    } catch (error) {
      console.error('Error editing notice:', error);
      setNoticeError(getNoticeRequestError(error, 'Failed to update the notice draft.'));
    } finally {
      setNoticeEditing(false);
    }
  };

  const handleCopyNotice = async () => {
    if (!noticeDraft.trim()) return;
    try {
      await navigator.clipboard.writeText(noticeDraft);
      setNoticeMessage('Notice draft copied to clipboard.');
    } catch (error) {
      console.error('Error copying notice:', error);
      setNoticeError('Failed to copy text automatically. Please copy it manually.');
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setGoogleCalendarActionLoading(true);
      setTeamError('');
      const { data } = await api.get('/calendar/google/connect?response=json');
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Error getting Google Calendar auth URL:', error);
      setTeamError('Failed to initiate Google Calendar connection.');
    } finally {
      setGoogleCalendarActionLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      setGoogleCalendarActionLoading(true);
      setTeamError('');
      await api.delete('/calendar/google/disconnect');
      setGoogleCalendarStatus({ connected: false, email: null });
      setTeamMessage('Google Calendar disconnected.');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
    } finally {
      setGoogleCalendarActionLoading(false);
    }
  };

  const handleInternshipLike = async (item) => {
    try {
      const { data } = await api.post(`/auth/lawyer/internships/${item.id}/like`);
      setPublishedInternships((prev) =>
        prev.map((intern) => (intern.id === item.id ? { ...intern, likes: data.likes } : intern))
      );
    } catch (error) {
      console.error('Error liking internship:', error);
    }
  };

  const handleInternshipComment = async (item, text) => {
    try {
      const { data } = await api.post(`/auth/lawyer/internships/${item.id}/comment`, { text });
      setPublishedInternships((prev) =>
        prev.map((intern) => (intern.id === item.id ? { ...intern, comments: data.comments } : intern))
      );
    } catch (error) {
      console.error('Error commenting on internship:', error);
    }
  };

  const handleJamLike = async (item) => {
    try {
      const { data } = await api.post(`/auth/jam-sessions/${item.id}/like`);
      setPublishedJamSessions((prev) =>
        prev.map((jam) => (jam.id === item.id ? { ...jam, ...data } : jam))
      );
    } catch (error) {
      console.error('Error liking jam session:', error);
    }
  };

  const handleJamComment = async (item, text) => {
    try {
      const { data } = await api.post(`/auth/jam-sessions/${item.id}/comments`, { text });
      setPublishedJamSessions((prev) =>
        prev.map((jam) => (jam.id === item.id
          ? {
              ...jam,
              commentsCount: data.commentsCount,
              comments: data.comment ? [data.comment, ...(jam.comments || [])] : jam.comments,
            }
          : jam))
      );
    } catch (error) {
      console.error('Error commenting on jam session:', error);
    }
  };

  // Derived Calculations
  const pendingAppointments = useMemo(
    () => appointments.filter((appt) => appt.status === 'Pending' || appt.status === 'Rejected'),
    [appointments]
  );

  const acceptedClients = useMemo(
    () => appointments.filter((appt) => appt.status === 'Accepted'),
    [appointments]
  );

  const pendingCount = pendingAppointments.filter((a) => a.status === 'Pending').length;
  const clientCount = acceptedClients.length;

  const displayTeam = useMemo(() => {
    if (!teamWorkspace) return {};
    return teamWorkspace;
  }, [teamWorkspace]);

  const hasTeam = Boolean(displayTeam?.id || displayTeam?.teamCode);
  const displayIsTeamOwner = displayTeam?.role === 'owner';
  const teamMembers = Array.isArray(displayTeam.members) ? displayTeam.members : [];
  
  const teamPendingRequests = useMemo(() => {
    if (Array.isArray(displayTeam.pendingJoinRequests)) return displayTeam.pendingJoinRequests;
    if (Array.isArray(displayTeam.pendingRequests)) return displayTeam.pendingRequests;
    return [];
  }, [displayTeam.pendingJoinRequests, displayTeam.pendingRequests]);

  const teamCases = useMemo(() => {
    if (Array.isArray(displayTeam.cases) && displayTeam.cases.length) return displayTeam.cases;
    if (Array.isArray(noTeamCases)) return noTeamCases;
    return [];
  }, [displayTeam.cases, noTeamCases]);

  const teamSize = (displayTeam.membersCount !== undefined && displayTeam.membersCount !== null)
    ? Number(displayTeam.membersCount)
    : (teamMembers.length + 1);

  const currentLawyerId = user?._id || user?.id;

  const visibleTeamDirectory = useMemo(() => {
    const rawMembers = Array.isArray(displayTeam.members) ? [...displayTeam.members] : [];
    const ownerId = getEntityId(displayTeam.seniorLawyer || displayTeam.ownerId || displayTeam.owner);
    return rawMembers.flatMap((member) => {
      const memberId = getEntityId(member.lawyerId || member.id || member._id);
      if (!memberId || isSameId(memberId, ownerId) || isSameId(memberId, currentLawyerId) || member.role === 'owner') return [];
      return [{
        ...member,
        id: String(member.id || member._id || memberId),
        lawyerId: memberId,
        name: String(member.name || '').replace(/\s*\(you\)$/i, '').trim(),
        roleLabel: 'Team Member',
      }];
    });
  }, [displayTeam, currentLawyerId]);

  const handleSelectTeamMember = useCallback((member) => {
    const lawyerId = getEntityId(member?.lawyerId || member?.id || member?._id);
    if (!lawyerId) return;
    setSelectedLawyerRecord({
      ...member,
      id: String(member.id || member._id || lawyerId),
      lawyerId,
      name: String(member.name || '').replace(/\s*\(you\)$/i, '').trim(),
      roleLabel: member.role === 'owner' ? 'Team Owner' : (member.roleLabel || 'Team Member'),
    });
    setSelectedLawyerCases(null);
    setMemberOwnedTeam(null);
    setMemberOwnedTeamError('');
    setSelectedCaseForDetailsId('');
    setSelectedTeamMemberId(String(lawyerId));
  }, []);

  const activeTeamMember = useMemo(() => {
    if (!selectedTeamMemberId) return null;
    return visibleTeamDirectory.find((m) => 
      String(m.id) === String(selectedTeamMemberId) || 
      isSameId(m.id || m.lawyerId, selectedTeamMemberId)
    ) || selectedLawyerRecord || null;
  }, [selectedLawyerRecord, selectedTeamMemberId, visibleTeamDirectory]);

  const activeTeamMemberId = activeTeamMember ? getEntityId(activeTeamMember.lawyerId || activeTeamMember.id) : '';

  useEffect(() => {
    if (selectedTeamMemberId) return;
    setSelectedLawyerRecord(null);
    setSelectedLawyerCases(null);
    setMemberOwnedTeam(null);
    setMemberOwnedTeamLoading(false);
    setMemberOwnedTeamError('');
  }, [selectedTeamMemberId]);

  const loadSelectedMemberProfile = useCallback(async () => {
    if (!displayIsTeamOwner || !displayTeam.id || !activeTeamMemberId) {
      setMemberOwnedTeam(null);
      setSelectedLawyerCases(null);
      setMemberOwnedTeamLoading(false);
      setMemberOwnedTeamError('');
      return;
    }

    setMemberOwnedTeam(null);
    setSelectedLawyerCases(null);
    setMemberOwnedTeamError('');
    setMemberOwnedTeamLoading(true);
    try {
      const { data } = await api.get(`/teams/${displayTeam.id}/members/${activeTeamMemberId}/owned-team`);
      setMemberOwnedTeam(data?.team || null);
      setSelectedLawyerCases(Array.isArray(data?.cases) ? data.cases : []);
    } catch (error) {
      console.error('Error loading selected lawyer profile:', error);
      setMemberOwnedTeam(null);
      setSelectedLawyerCases([]);
      setMemberOwnedTeamError(error.response?.data?.message || 'Unable to load this lawyer team');
    } finally {
      setMemberOwnedTeamLoading(false);
    }
  }, [activeTeamMemberId, displayIsTeamOwner, displayTeam.id]);

  useEffect(() => {
    loadSelectedMemberProfile();
  }, [loadSelectedMemberProfile]);

  const activeTeamMemberCases = useMemo(() => {
    if (!activeTeamMember) return [];
    if (Array.isArray(selectedLawyerCases)) return selectedLawyerCases;
    const targetMemberId = getEntityId(activeTeamMember.lawyerId || activeTeamMember.id);

    return teamCases.filter((teamCase) => {
      const caseOwnerId = getEntityId(teamCase.addedBy || teamCase.ownerId);
      if (caseOwnerId && targetMemberId && isSameId(caseOwnerId, targetMemberId)) {
        return true;
      }
      return false;
    });
  }, [activeTeamMember, selectedLawyerCases, teamCases]);

  const canRemoveActiveTeamMember = useMemo(() => {
    if (!displayIsTeamOwner || !activeTeamMember) return false;
    const memberRole = String(activeTeamMember.role || '').toLowerCase();
    const isOwner = memberRole === 'owner' || isSameId(activeTeamMemberId, displayTeam.ownerId);
    const isDirectMember = visibleTeamDirectory.some((member) => isSameId(member.lawyerId || member.id, activeTeamMemberId));
    return !isOwner && isDirectMember;
  }, [displayIsTeamOwner, activeTeamMember, activeTeamMemberId, displayTeam.ownerId, visibleTeamDirectory]);

  const ownTeamCases = useMemo(() => {
    if (!Array.isArray(teamCases)) return [];
    if (!hasTeam) return teamCases;
    return teamCases.filter((teamCase) => isSameId(getEntityId(teamCase.addedBy || teamCase.ownerId), currentLawyerId));
  }, [teamCases, hasTeam, currentLawyerId]);

  // Next Hearings is intentionally lawyer-scoped, not selected-team scoped.
  const ownHearings = lawyerNextHearingsLoaded ? lawyerNextHearings : [];

  const hearingsLoading = !lawyerNextHearingsLoaded;
  // Joined team members can manage only their own cases. Team owners retain
  // access to the member directory and join requests.
  const currentActiveTeamTab = !displayIsTeamOwner
    ? 'my_cases'
    : activeTeamTab;

  const openFeature = (section) => {
    setSearchParams({ section });
  };

  const closeAllFeatures = () => {
    setShowAppointmentsModal(false);
    setShowClientsModal(false);
    setShowHearingsModal(false);
    setShowTeamModal(false);
    setShowNoticeGenerator(false);
    setShowStudentInteractionModal(false);
    setDrawer(emptyDrawerState);
    setResumePreview(null);
    setSearchParams({}, { replace: true });
  };

  const cards = [
    {
      title: 'New Appointments',
      badge: pendingCount > 0 ? pendingCount : null,
      icon: <FaCalendarPlus className="text-2xl text-[#15a276]" />,
      desc: 'Review and manage incoming consultation requests.',
      onClick: () => openFeature('appointments'),
    },
    {
      title: 'Next Hearings',
      badge: ownHearings.length > 0 ? ownHearings.length : null,
      icon: <FaGavel className="text-2xl text-emerald-500" />,
      desc: 'Track upcoming hearings from your cases across all teams and firms.',
      onClick: () => openFeature('hearings'),
    },
    {
      title: 'Notice Generator',
      icon: <FaFileSignature className="text-2xl text-[#15a276]" />,
      desc: 'Quickly draft and send legal notices to parties.',
      onClick: () => openFeature('notice-generator'),
    },
    {
      title: 'My Clients',
      badge: clientCount > 0 ? clientCount : null,
      icon: <FaBriefcase className="text-2xl text-[#062552]" />,
      desc: 'See all clients whose requests you have accepted.',
      onClick: () => openFeature('clients'),
    },
    {
      title: 'My Team',
      badge: displayIsTeamOwner && (teamPendingRequests.length || teamMembers.length)
        ? teamPendingRequests.length || teamMembers.length
        : null,
      icon: <Users className="h-6 w-6 text-amber-500" />,
      desc: hasTeam
        ? `${displayIsTeamOwner ? 'Created' : 'Joined'} ${displayTeam.firmName || 'your team'}.`
        : 'Create a team or join with a team code.',
      onClick: () => {
        setTeamMode(hasTeam ? 'overview' : 'create');
        setTeamError('');
        setTeamMessage('');
        openFeature('team');
      },
    },
    {
      title: 'Student Interaction',
      icon: <FaUserGraduate className="text-2xl text-cyan-400" />,
      desc: 'Publish internships and jam sessions for students.',
      onClick: () => openFeature('student-interactions'),
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

  const hasActiveFeature = Boolean(
    showAppointmentsModal ||
    showClientsModal ||
    showHearingsModal ||
    showTeamModal ||
    showNoticeGenerator ||
    showStudentInteractionModal
  );

  return (
    <div className="lawyer-theme lawyer-dashboard-workspace min-h-screen bg-[#f3f8fb] text-[#062552] relative">
      <AppHeader variant="lawyer" profileTo="/profile" showBrandName />

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {hasActiveFeature ? (
          <div>
            <LawyerAppointmentsModal
              show={showAppointmentsModal}
              onClose={closeAllFeatures}
              loadingAppointments={loadingAppointments}
              pendingAppointments={pendingAppointments}
              updateStatus={updateStatus}
            />

            <LawyerClientsModal
              show={showClientsModal}
              onClose={closeAllFeatures}
              loadingAppointments={loadingAppointments}
              acceptedClients={acceptedClients}
              handleOpenChat={handleOpenChat}
            />

            <LawyerNextHearingsModal
              show={showHearingsModal}
              onClose={closeAllFeatures}
              googleCalendarLoading={googleCalendarLoading}
              googleCalendarStatus={googleCalendarStatus}
              googleCalendarActionLoading={googleCalendarActionLoading}
              handleConnectGoogleCalendar={handleConnectGoogleCalendar}
              handleDisconnectGoogleCalendar={handleDisconnectGoogleCalendar}
              hearingsLoading={hearingsLoading}
              ownHearings={ownHearings}
              onRefresh={loadLawyerNextHearings}
            />

            <LawyerTeamModal
              show={showTeamModal}
              onClose={closeAllFeatures}
              hasTeam={hasTeam}
              displayIsTeamOwner={displayIsTeamOwner}
              displayTeam={displayTeam}
              teamSize={teamSize}
              handleCopyTeamCode={handleCopyTeamCode}
              handleDeleteTeam={handleDeleteTeam}
              deletingTeam={deletingTeam}
              teamWorkspaceLoading={teamWorkspaceLoading}
              teamWorkspaces={teamWorkspaces}
              handleSelectTeam={handleSelectTeam}
              teamMode={teamMode}
              setTeamMode={setTeamMode}
              setTeamError={setTeamError}
              setTeamMessage={setTeamMessage}
              createTeamForm={createTeamForm}
              handleCreateTeamInput={handleCreateTeamInput}
              handleCreateTeam={handleCreateTeam}
              teamLoading={teamLoading}
              joinTeamForm={joinTeamForm}
              handleJoinTeamInput={handleJoinTeamInput}
              handleJoinTeam={handleJoinTeam}
              setActiveTeamTab={setActiveTeamTab}
              currentActiveTeamTab={currentActiveTeamTab}
              ownTeamCases={ownTeamCases}
              visibleTeamDirectory={visibleTeamDirectory}
              teamPendingRequests={teamPendingRequests}
              showTeamCaseForm={showTeamCaseForm}
              setShowTeamCaseForm={setShowTeamCaseForm}
              teamCaseForm={teamCaseForm}
              handleTeamCaseInput={handleTeamCaseInput}
              handleAddTeamCase={handleAddTeamCase}
              savingTeamCase={savingTeamCase}
              teamCaseStatuses={teamCaseStatuses}
              selectedCaseForDetailsId={selectedCaseForDetailsId}
              setSelectedCaseForDetailsId={setSelectedCaseForDetailsId}
              updatingTeamCaseId={updatingTeamCaseId}
              handleUpdateTeamCaseStatus={handleUpdateTeamCaseStatus}
              handleDeleteTeamCase={handleDeleteTeamCase}
              loadTeamWorkspace={loadTeamWorkspace}
              loadLawyerNextHearings={loadLawyerNextHearings}
              activeTeamMember={activeTeamMember}
              setSelectedTeamMemberId={setSelectedTeamMemberId}
              onSelectTeamMember={handleSelectTeamMember}
              currentLawyerId={currentLawyerId}
              teamCases={teamCases}
              canRemoveActiveTeamMember={canRemoveActiveTeamMember}
              handleRemoveTeamMember={handleRemoveTeamMember}
              handleLeaveTeam={handleLeaveTeam}
              removingTeamMemberId={removingTeamMemberId}
              handleDeleteTeam={handleDeleteTeam}
              deletingTeam={deletingTeam}
              activeTeamMemberId={activeTeamMemberId}
              activeTeamMemberCases={activeTeamMemberCases}
              memberOwnedTeam={memberOwnedTeam}
              memberOwnedTeamLoading={memberOwnedTeamLoading}
              memberOwnedTeamError={memberOwnedTeamError}
              loadSelectedMemberProfile={loadSelectedMemberProfile}
              updatingTeamRequestId={updatingTeamRequestId}
              handleTeamRequestDecision={handleTeamRequestDecision}
            />

            <LawyerNoticeGeneratorModal
              show={showNoticeGenerator}
              onClose={closeAllFeatures}
              noticeForm={noticeForm}
              handleNoticeInput={handleNoticeInput}
              handleNoticeNameInput={handleNoticeNameInput}
              addNoticeName={addNoticeName}
              removeNoticeName={removeNoticeName}
              noticeError={noticeError}
              noticeLoading={noticeLoading}
              handleGenerateNotice={handleGenerateNotice}
              noticeDraft={noticeDraft}
              setNoticeDraft={setNoticeDraft}
              handleCopyNotice={handleCopyNotice}
              noticeEditPrompt={noticeEditPrompt}
              setNoticeEditPrompt={setNoticeEditPrompt}
              handleEditNotice={handleEditNotice}
              noticeEditing={noticeEditing}
              noticeMessage={noticeMessage}
            />

            <LawyerStudentInteractionModal
              show={showStudentInteractionModal}
              onClose={closeAllFeatures}
              studentInteractionTab={studentInteractionTab}
              setStudentInteractionTab={setStudentInteractionTab}
              setShowInternshipForm={setShowInternshipForm}
              setShowJamSessionForm={setShowJamSessionForm}
              followerStudents={followerStudents}
              interactionLoading={interactionLoading}
              publishedInternships={publishedInternships}
              handleInternshipLike={handleInternshipLike}
              handleInternshipComment={handleInternshipComment}
              handleOpenApplicantsDrawer={handleOpenApplicantsDrawer}
              handleToggleInternshipStatus={handleToggleInternshipStatus}
              togglingInternshipId={togglingInternshipId}
              handleDeleteInternship={handleDeleteInternship}
              deletingInternshipId={deletingInternshipId}
              publishedJamSessions={publishedJamSessions}
              handleJamLike={handleJamLike}
              handleJamComment={handleJamComment}
              handleOpenParticipantsDrawer={handleOpenParticipantsDrawer}
              handleDeleteJamSession={handleDeleteJamSession}
              deletingJamSessionId={deletingJamSessionId}
              postLoading={postLoading}
              publishedPosts={publishedPosts}
              showInternshipForm={showInternshipForm}
              handlePublishInternship={handlePublishInternship}
              internshipForm={internshipForm}
              handleInternshipInput={handleInternshipInput}
              showJamSessionForm={showJamSessionForm}
              handlePublishJamSession={handlePublishJamSession}
              jamSessionForm={jamSessionForm}
              handleJamSessionInput={handleJamSessionInput}
              setPostError={setPostError}
              setShowPostComposer={setShowPostComposer}
              handleDeletePost={handleDeletePost}
              deletingPostId={deletingPostId}
            />
          </div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-20">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-[#062552]">Lawyer Dashboard</h1>
                <p className="text-[#5f7488]">Manage your appointments, hearings, and daily practice efficiently.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  onClick={card.onClick}
                  className="lawyer-dashboard-card group bg-white border border-[#d7e9ef] hover:border-[#15a276] rounded-2xl p-6 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#f8fbfc] border border-[#d7e9ef] flex items-center justify-center group-hover:bg-[#e8f7f2] group-hover:border-[#15a276]/30 transition-colors shrink-0">
                      {card.icon}
                    </div>
                    {card.badge && (
                      <span className="badge-pill bg-[#15a276] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h2 className="mb-2 text-lg font-bold leading-tight text-[#062552]">{card.title}</h2>
                  <p className="break-words text-sm leading-relaxed text-[#5f7488]">{card.desc}</p>
                </div>
              ))}
            </div>

            <section className="mt-8 rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#062552]">Quick Stats</h2>
                  <p className="text-[#5f7488] mt-2">A live view of your student engagement across internships and jam sessions.</p>
                </div>
                {interactionLoading ? <p className="text-sm text-[#5f7488]">Refreshing...</p> : null}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {statCards.map((stat) => (
                  <div key={stat.key} className="rounded-2xl border border-[#d7e9ef] bg-[#f8fbfc] p-5">
                    <p className="text-sm text-[#5f7488]">{stat.label}</p>
                    <p className={`mt-3 text-3xl font-bold ${stat.accent}`}>{quickStats[stat.key] || 0}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f2] text-[#15a276] border border-[#15a276]/20">
                    <FaGavel size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#062552]">My Upcoming Hearings</h2>
                    <p className="text-sm text-[#5f7488] mt-1">Upcoming hearings from cases added by you across all your teams and firms.</p>
                  </div>
                </div>
                {ownHearings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openFeature('hearings')}
                    className="text-xs font-bold text-[#15a276] hover:text-[#118b66] transition-colors cursor-pointer"
                  >
                    View All ({ownHearings.length})
                  </button>
                )}
              </div>

              <div className="mt-6">
                {ownHearings.length === 0 ? (
                  <EmptyBlock icon={<FaGavel size={24} />} message="No upcoming hearings from your cases yet." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ownHearings.slice(0, 3).map((hearing) => (
                      <div key={`${hearing.id}-${hearing.teamCode || 'team'}`} className="rounded-2xl border border-[#d7e9ef] bg-white p-5 flex flex-col justify-between hover:border-[#15a276]/50 shadow-sm transition-all text-[#062552]">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
                              {hearing.teamName || 'No team'}
                            </span>
                            <span className="text-xs font-semibold text-[#5f7488]">{getTeamCaseStatusLabel(hearing.status)}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-[#062552] truncate">{hearing.caseTitle || 'Untitled Case'}</h3>
                          <p className="mt-1 text-sm text-[#5f7488] truncate">Client: {hearing.clientName || 'Not specified'}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#d7e9ef] flex items-center justify-between text-xs">
                          <div>
                            <p className="text-[#5f7488] font-medium">Hearing Date</p>
                            <p className="font-bold text-[#15a276] mt-0.5">{formatDate(hearing.hearingDate)} · {formatTime(hearing.hearingDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#5f7488] font-medium">Court</p>
                            <p className="font-medium text-[#062552] mt-0.5 truncate max-w-[120px]">{hearing.courtName || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {teamError ? (
              <p className="mt-5 rounded-xl border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-100">{teamError}</p>
            ) : null}
            {teamMessage ? (
              <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">{teamMessage}</p>
            ) : null}
          </div>
        )}
      </div>

      <ApplicantDrawer
        drawer={drawer}
        drawerFilter={drawerFilter}
        setDrawerFilter={setDrawerFilter}
        activeDrawerFilters={activeDrawerFilters}
        filteredDrawerItems={filteredDrawerItems}
        onClose={() => setDrawer(emptyDrawerState)}
        setResumePreview={setResumePreview}
        updatingApplicantId={updatingApplicantId}
        handleApplicantDecision={handleApplicantDecision}
      />

      {resumePreview ? (
        <ResumePreviewModal
          resume={resumePreview}
          onClose={() => setResumePreview(null)}
        />
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
