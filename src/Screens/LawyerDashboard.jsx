import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { Copy, KeyRound, UserPlus, Users } from 'lucide-react';
import api from '../api/axios';
import AppHeader from '../components/AppHeader.jsx';
import FeedPostCard from '../components/feed/FeedPostCard.jsx';
import PostComposerModal from '../components/feed/PostComposerModal.jsx';
import ReactionBar from '../components/feed/ReactionBar.jsx';
import { updateUser } from '../redux/authSlice.jsx';

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

const initialCreateTeamForm = {
  firmName: '',
  seniorLawyerName: '',
  maxTeamSize: 5,
};

const initialJoinTeamForm = {
  teamCode: '',
};

const initialTeamCaseForm = {
  clientName: '',
  caseTitle: '',
  caseDetails: '',
  basicInfo: '',
  courtName: '',
  hearingDate: '',
  documents: '',
  status: 'new',
};

const teamCaseStatuses = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'hearing_scheduled', label: 'Hearing Scheduled' },
  { value: 'closed', label: 'Closed' },
];

const getTeamCaseStatusLabel = (status) => (
  teamCaseStatuses.find((item) => item.value === status)?.label || 'New'
);

const getEntityId = (value) => String(value?._id || value?.id || value || '');

const getLawyerDisplayName = (lawyer) => {
  const fullName = `${lawyer?.firstName || ''} ${lawyer?.lastName || ''}`.trim();
  return fullName || lawyer?.name || lawyer?.phone || 'Lawyer';
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

const commonNoticeFields = [
  {
    id: 'clientNames',
    label: 'Client / sender name',
    type: 'names',
    addLabel: 'Add another client',
    required: true,
  },
  {
    id: 'oppositePartyNames',
    label: 'Opposite party / recipient name',
    type: 'names',
    addLabel: 'Add another recipient',
    required: true,
  },
  {
    id: 'clientAddress',
    label: 'Client address',
    type: 'textarea',
    rows: 2,
  },
  {
    id: 'oppositePartyAddress',
    label: 'Recipient address',
    type: 'textarea',
    rows: 2,
    required: true,
  },
  {
    id: 'jurisdiction',
    label: 'Jurisdiction / city',
    type: 'text',
  },
  {
    id: 'legalNoticeReceived',
    label: 'Legal notice already received or sent',
    type: 'checkbox',
  },
  {
    id: 'previousNoticeDetails',
    label: 'Previous notice details',
    type: 'textarea',
    rows: 2,
    placeholder: 'Mention date, sender, reply status, or any important reference.',
    dependsOn: 'legalNoticeReceived',
  },
];

const noticeTypeFields = {
  'Legal Notice for Recovery of Money': [
    { id: 'amount', label: 'Amount due', type: 'text', required: true },
    { id: 'transactionDate', label: 'Transaction / loan date', type: 'date' },
    { id: 'dueDate', label: 'Payment due date', type: 'date' },
    { id: 'paymentProof', label: 'Payment proof / documents', type: 'textarea', rows: 2 },
    { id: 'reliefRequired', label: 'Relief required', type: 'text', placeholder: 'Example: pay full amount with interest within 15 days' },
  ],
  'Legal Notice for Breach of Contract': [
    { id: 'contractDate', label: 'Contract date', type: 'date' },
    { id: 'contractPurpose', label: 'Contract purpose', type: 'text', required: true },
    { id: 'breachedTerms', label: 'Terms breached', type: 'textarea', rows: 2, required: true },
    { id: 'losses', label: 'Loss / damage suffered', type: 'textarea', rows: 2 },
    { id: 'reliefRequired', label: 'Relief required', type: 'text' },
  ],
  'Tenant Eviction Notice': [
    { id: 'propertyAddress', label: 'Rental property address', type: 'textarea', rows: 2, required: true },
    { id: 'tenancyStartDate', label: 'Tenancy start date', type: 'date' },
    { id: 'rentAmount', label: 'Monthly rent', type: 'text' },
    { id: 'evictionReason', label: 'Reason for eviction', type: 'textarea', rows: 2, required: true },
    { id: 'vacateDeadline', label: 'Vacate deadline', type: 'date' },
  ],
  'Consumer Complaint Notice': [
    { id: 'productService', label: 'Product / service', type: 'text', required: true },
    { id: 'purchaseDate', label: 'Purchase / service date', type: 'date' },
    { id: 'invoiceDetails', label: 'Invoice / order details', type: 'text' },
    { id: 'defectOrIssue', label: 'Defect or issue faced', type: 'textarea', rows: 2, required: true },
    { id: 'reliefRequired', label: 'Refund / replacement / compensation required', type: 'text' },
  ],
  'Employment Termination Dispute Notice': [
    { id: 'employeeName', label: 'Employee name', type: 'text' },
    { id: 'employerName', label: 'Employer name', type: 'text' },
    { id: 'joiningDate', label: 'Joining date', type: 'date' },
    { id: 'terminationDate', label: 'Termination date', type: 'date', required: true },
    { id: 'terminationIssue', label: 'Termination issue', type: 'textarea', rows: 2, required: true },
    { id: 'duesPending', label: 'Pending salary / dues', type: 'text' },
  ],
  'Cheque Bounce Notice': [
    { id: 'chequeNumber', label: 'Cheque number', type: 'text', required: true },
    { id: 'chequeDate', label: 'Cheque date', type: 'date' },
    { id: 'bankName', label: 'Bank name', type: 'text' },
    { id: 'chequeAmount', label: 'Cheque amount', type: 'text', required: true },
    { id: 'bounceDate', label: 'Bounce date', type: 'date' },
    { id: 'returnReason', label: 'Bank return reason', type: 'text' },
  ],
  'Property Dispute Notice': [
    { id: 'propertyAddress', label: 'Property address', type: 'textarea', rows: 2, required: true },
    { id: 'ownershipDetails', label: 'Ownership / possession details', type: 'textarea', rows: 2 },
    { id: 'disputeType', label: 'Type of dispute', type: 'text', required: true },
    { id: 'incidentDate', label: 'Incident date', type: 'date' },
    { id: 'reliefRequired', label: 'Relief required', type: 'text' },
  ],
  'Defamation Notice': [
    { id: 'defamatoryStatement', label: 'Defamatory statement / act', type: 'textarea', rows: 2, required: true },
    { id: 'publicationDate', label: 'Date of publication / statement', type: 'date' },
    { id: 'publicationMedium', label: 'Where it was said or published', type: 'text' },
    { id: 'harmCaused', label: 'Harm caused', type: 'textarea', rows: 2 },
    { id: 'reliefRequired', label: 'Apology / removal / compensation required', type: 'text' },
  ],
  'Custom Legal Notice': [
    { id: 'customIssue', label: 'What is this notice about?', type: 'textarea', rows: 3, required: true },
    { id: 'importantDates', label: 'Important dates', type: 'text' },
    { id: 'supportingDocuments', label: 'Supporting documents', type: 'textarea', rows: 2 },
    { id: 'reliefRequired', label: 'Relief required', type: 'text' },
  ],
};

const additionalNoticeFields = [
  {
    id: 'facts',
    label: 'Facts in short',
    type: 'textarea',
    rows: 3,
    placeholder: 'Add the important story in simple points.',
    required: true,
  },
  {
    id: 'deadline',
    label: 'Compliance deadline',
    type: 'text',
    placeholder: 'Example: 15 days from receipt of this notice',
  },
];

const initialNoticeForm = {
  documentType: noticeDocumentTypes[0],
  clientNames: [''],
  oppositePartyNames: [''],
  clientAddress: '',
  oppositePartyAddress: '',
  jurisdiction: '',
  legalNoticeReceived: false,
  previousNoticeDetails: '',
  amount: '',
  transactionDate: '',
  dueDate: '',
  paymentProof: '',
  reliefRequired: '',
  contractDate: '',
  contractPurpose: '',
  breachedTerms: '',
  losses: '',
  propertyAddress: '',
  tenancyStartDate: '',
  rentAmount: '',
  evictionReason: '',
  vacateDeadline: '',
  productService: '',
  purchaseDate: '',
  invoiceDetails: '',
  defectOrIssue: '',
  employeeName: '',
  employerName: '',
  joiningDate: '',
  terminationDate: '',
  terminationIssue: '',
  duesPending: '',
  chequeNumber: '',
  chequeDate: '',
  bankName: '',
  chequeAmount: '',
  bounceDate: '',
  returnReason: '',
  ownershipDetails: '',
  disputeType: '',
  incidentDate: '',
  defamatoryStatement: '',
  publicationDate: '',
  publicationMedium: '',
  harmCaused: '',
  customIssue: '',
  importantDates: '',
  supportingDocuments: '',
  facts: '',
  deadline: '',
};

const getNoticeFields = (documentType) => [
  ...commonNoticeFields,
  ...(noticeTypeFields[documentType] || []),
  ...additionalNoticeFields,
];

const isNoticeFieldFilled = (field, form) => {
  if (field.type === 'checkbox') return true;
  if (field.type === 'names') {
    return (form[field.id] || []).some((value) => String(value || '').trim());
  }
  return Boolean(String(form[field.id] || '').trim());
};

const formatNoticeDetails = (documentType, form) => {
  const lines = getNoticeFields(documentType)
    .filter((field) => !field.dependsOn || form[field.dependsOn])
    .map((field) => {
      const value = field.type === 'names'
        ? (form[field.id] || []).map((name) => String(name || '').trim()).filter(Boolean).join(', ')
        : field.type === 'checkbox'
          ? (form[field.id] ? 'Yes' : 'No')
          : String(form[field.id] || '').trim();

      return value ? `${field.label}: ${value}` : '';
    })
    .filter(Boolean);

  return [`Document type: ${documentType}`, ...lines].join('\n');
};

const getNoticeRequestError = (error, fallbackMessage) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Unable to reach the server. Please check your connection and try again.';
  return fallbackMessage;
};

export default function LawyerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMode, setTeamMode] = useState('create');
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamWorkspaceLoading, setTeamWorkspaceLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamMessage, setTeamMessage] = useState('');
  const [teamWorkspace, setTeamWorkspace] = useState(null);
  const [showTeamCaseForm, setShowTeamCaseForm] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState('');
  const [savingTeamCase, setSavingTeamCase] = useState(false);
  const [updatingTeamCaseId, setUpdatingTeamCaseId] = useState('');
  const [updatingTeamRequestId, setUpdatingTeamRequestId] = useState('');
  const [removingTeamMemberId, setRemovingTeamMemberId] = useState('');
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
  const [createTeamForm, setCreateTeamForm] = useState(initialCreateTeamForm);
  const [joinTeamForm, setJoinTeamForm] = useState(initialJoinTeamForm);
  const [teamCaseForm, setTeamCaseForm] = useState(initialTeamCaseForm);
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

  useEffect(() => {
    if (searchParams.get('section') === 'student-interactions') {
      setShowStudentInteractionModal(true);
    }

    if (searchParams.get('section') === 'appointments') {
      setShowAppointmentsModal(true);
    }

    if (searchParams.get('section') === 'team') {
      const requestedMode = searchParams.get('mode');
      const currentHasTeam = Boolean(user?.lawyerProfile?.team?.teamCode);
      setTeamMode(currentHasTeam ? 'overview' : requestedMode === 'join' ? 'join' : 'create');
      setTeamError('');
      setTeamMessage('');
      setShowTeamModal(true);
    }

    const requestedTab = searchParams.get('tab');
    if (['internships', 'jamSessions', 'posts'].includes(requestedTab)) {
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

    const partnerId = selectedPartner._id || selectedPartner.id;
    navigate(`/chat?partnerId=${encodeURIComponent(partnerId)}`, {
      state: { selectedPartner, returnTo: '/lawyer-dash' },
    });
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

  const loadTeamWorkspace = useCallback(async () => {
    if (!user?.lawyerProfile?.team?.teamCode) {
      setTeamWorkspace(null);
      return;
    }

    try {
      setTeamWorkspaceLoading(true);
      const { data } = await api.get('/auth/lawyer/team');
      setTeamWorkspace(data?.team || null);
    } catch (error) {
      console.error('Error loading team workspace:', error);
      setTeamWorkspace(null);
    } finally {
      setTeamWorkspaceLoading(false);
    }
  }, [user?.lawyerProfile?.team?.teamCode]);

  useEffect(() => {
    const currentHasTeam = Boolean(user?.lawyerProfile?.team?.teamCode);
    if (!showTeamModal || !currentHasTeam) return;
    loadTeamWorkspace();
  }, [loadTeamWorkspace, showTeamModal, user?.lawyerProfile?.team?.teamCode]);

  useEffect(() => {
    if (!showTeamModal) return;
    refreshCurrentUser();
  }, [refreshCurrentUser, showTeamModal]);

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

      const { data } = await api.post('/auth/lawyer/team', payload);
      if (data?.user) {
        dispatch(updateUser(data.user));
      }
      setTeamMode('overview');
      setTeamMessage(`Team created. Code: ${data?.team?.teamCode || ''}`);
      setTeamWorkspace(data?.team ? { ...data.team, cases: [] } : null);
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

      const { data } = await api.post('/auth/lawyer/team/join', {
        teamCode: joinTeamForm.teamCode.trim(),
      });

      if (data?.requestPending) {
        setJoinTeamForm(initialJoinTeamForm);
        setTeamMessage(data.message || 'Join request sent to the senior lawyer.');
        return;
      }

      if (data?.user) {
        dispatch(updateUser(data.user));
      }
      setTeamMode('overview');
      setJoinTeamForm(initialJoinTeamForm);
      setTeamMessage('Team joined successfully.');
      const workspaceResponse = await api.get('/auth/lawyer/team');
      setTeamWorkspace(workspaceResponse.data?.team || null);
    } catch (error) {
      console.error('Error joining team:', error);
      setTeamError(error.response?.data?.message || 'Failed to join team');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCopyTeamCode = async () => {
    const teamCode = user?.lawyerProfile?.team?.teamCode;
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

    try {
      setSavingTeamCase(true);
      setTeamError('');
      setTeamMessage('');

      const payload = {
        clientName: teamCaseForm.clientName.trim(),
        caseTitle: teamCaseForm.caseTitle.trim(),
        caseDetails: teamCaseForm.caseDetails.trim(),
        basicInfo: teamCaseForm.basicInfo.trim(),
        courtName: teamCaseForm.courtName.trim(),
        hearingDate: teamCaseForm.hearingDate,
        documents: teamCaseForm.documents,
        status: teamCaseForm.status,
      };

      const { data } = await api.post('/auth/lawyer/team/cases', payload);
      setTeamWorkspace(data?.team || null);
      setTeamCaseForm(initialTeamCaseForm);
      setShowTeamCaseForm(false);
      setTeamMessage('Team case added.');
    } catch (error) {
      console.error('Error adding team case:', error);
      setTeamError(error.response?.data?.message || 'Failed to add team case');
    } finally {
      setSavingTeamCase(false);
    }
  };

  const handleUpdateTeamCaseStatus = async (teamCase, status) => {
    try {
      setUpdatingTeamCaseId(teamCase.id);
      setTeamError('');
      setTeamMessage('');

      const { data } = await api.patch(`/auth/lawyer/team/cases/${teamCase.id}/status`, { status });
      setTeamWorkspace(data?.team || null);
      setTeamMessage('Case status updated.');
    } catch (error) {
      console.error('Error updating team case status:', error);
      setTeamError(error.response?.data?.message || 'Failed to update case status');
    } finally {
      setUpdatingTeamCaseId('');
    }
  };

  const handleTeamRequestDecision = async (request, decision) => {
    try {
      setUpdatingTeamRequestId(request.id);
      setTeamError('');
      setTeamMessage('');

      const { data } = await api.patch(`/auth/lawyer/team/requests/${request.id}/${decision}`);
      setTeamWorkspace(data?.team || null);
      setTeamMessage(data?.message || (decision === 'accept' ? 'Join request accepted.' : 'Join request rejected.'));
    } catch (error) {
      console.error('Error updating team request:', error);
      setTeamError(error.response?.data?.message || 'Failed to update team request');
    } finally {
      setUpdatingTeamRequestId('');
    }
  };

  const handleRemoveTeamMember = async (member) => {
    const memberId = member.lawyerId || member.id;
    if (!memberId) return;

    const confirmed = window.confirm(`Remove ${member.name || 'this lawyer'} from the team?`);
    if (!confirmed) return;

    try {
      setRemovingTeamMemberId(String(memberId));
      setTeamError('');
      setTeamMessage('');

      const { data } = await api.delete(`/auth/lawyer/team/members/${memberId}`);
      setTeamWorkspace(data?.team || null);
      setTeamMessage(data?.message || 'Team member removed.');
    } catch (error) {
      console.error('Error removing team member:', error);
      setTeamError(error.response?.data?.message || 'Failed to remove team member');
    } finally {
      setRemovingTeamMemberId('');
    }
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

  const selectedNoticeFields = useMemo(
    () => getNoticeFields(noticeForm.documentType),
    [noticeForm.documentType]
  );

  const handleNoticeInput = (event) => {
    const { name, type, checked, value } = event.target;
    setNoticeForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNoticeNameInput = (fieldId, index, value) => {
    setNoticeForm((current) => {
      const names = [...(current[fieldId] || [''])];
      names[index] = value;
      return { ...current, [fieldId]: names };
    });
  };

  const addNoticeName = (fieldId) => {
    setNoticeForm((current) => ({
      ...current,
      [fieldId]: [...(current[fieldId] || ['']), ''],
    }));
  };

  const removeNoticeName = (fieldId, index) => {
    setNoticeForm((current) => {
      const names = (current[fieldId] || ['']).filter((_, nameIndex) => nameIndex !== index);
      return { ...current, [fieldId]: names.length ? names : [''] };
    });
  };

  const handleGenerateNotice = async (event) => {
    event.preventDefault();

    const missingField = selectedNoticeFields.find(
      (field) => field.required
        && (!field.dependsOn || noticeForm[field.dependsOn])
        && !isNoticeFieldFilled(field, noticeForm)
    );

    if (!noticeForm.documentType || missingField) {
      setNoticeError(
        missingField
          ? `Please add ${missingField.label.toLowerCase()}.`
          : 'Please select a document type and add the basic details.'
      );
      return;
    }

    try {
      setNoticeLoading(true);
      setNoticeError('');
      setNoticeMessage('');
      const { data } = await api.post('/ai/notice/generate', {
        documentType: noticeForm.documentType,
        details: formatNoticeDetails(noticeForm.documentType, noticeForm),
      });
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
  const lawyerTeam = user?.lawyerProfile?.team || null;
  const hasTeam = Boolean(lawyerTeam?.teamCode);
  const displayTeam = teamWorkspace || lawyerTeam || {};
  const displayTeamRole = teamWorkspace?.role || lawyerTeam?.role;
  const displayIsTeamOwner = displayTeamRole === 'owner';
  const teamMembers = Array.isArray(displayTeam?.members) ? displayTeam.members : [];
  const teamPendingRequests = Array.isArray(displayTeam?.pendingRequests) ? displayTeam.pendingRequests : [];
  const teamCases = Array.isArray(displayTeam?.cases) ? displayTeam.cases : [];
  const teamSize = hasTeam ? teamMembers.length + 1 : 0;
  const currentLawyerId = getEntityId(user);
  const seniorLawyerId = getEntityId(displayTeam?.seniorLawyer) || (displayIsTeamOwner ? currentLawyerId : '');
  const seniorTeamProfile = {
    id: seniorLawyerId || 'senior-lawyer',
    lawyerId: seniorLawyerId,
    name: displayTeam.seniorLawyerName || getLawyerDisplayName(user),
    email: displayIsTeamOwner ? user?.email : '',
    phone: displayIsTeamOwner ? user?.phone : '',
    joinedAt: displayTeam.createdAt,
    roleLabel: 'Senior Lawyer',
    isOwner: true,
  };
  const normalizedTeamMembers = teamMembers.map((member) => {
    const memberId = getEntityId(member.lawyerId || member.id || member._id);
    return {
      ...member,
      id: memberId || member.email || member.phone || member.name,
      lawyerId: memberId,
      roleLabel: 'Junior Lawyer',
      isOwner: false,
    };
  });
  const teamDirectory = displayIsTeamOwner
    ? normalizedTeamMembers
    : [seniorTeamProfile, ...normalizedTeamMembers.filter((member) => member.id !== currentLawyerId)];
  const activeTeamMember = teamDirectory.find((member) => String(member.id) === String(selectedTeamMemberId))
    || teamDirectory[0]
    || null;
  const activeTeamMemberCases = activeTeamMember
    ? teamCases.filter((teamCase) => {
        const caseOwnerId = getEntityId(teamCase.addedBy);
        const memberId = getEntityId(activeTeamMember.lawyerId || activeTeamMember.id);
        const caseOwnerName = String(teamCase.addedByName || '').trim().toLowerCase();
        const memberName = String(activeTeamMember.name || '').trim().toLowerCase();
        return (caseOwnerId && memberId && caseOwnerId === memberId)
          || (caseOwnerName && memberName && caseOwnerName === memberName);
      })
    : [];
  const activeTeamMemberId = activeTeamMember ? getEntityId(activeTeamMember.lawyerId || activeTeamMember.id) : '';
  const canRemoveActiveTeamMember = displayIsTeamOwner
    && activeTeamMember
    && !activeTeamMember.isOwner
    && Boolean(activeTeamMember.lawyerId);

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
      title: 'My Team',
      badge: displayIsTeamOwner && (teamPendingRequests.length || teamMembers.length)
        ? teamPendingRequests.length || teamMembers.length
        : null,
      icon: <Users className="h-10 w-10 text-amber-300" />,
      desc: hasTeam
        ? `${displayIsTeamOwner ? 'Created' : 'Joined'} ${displayTeam.firmName || 'your team'}.`
        : 'Create a team or join with a senior lawyer code.',
      onClick: () => {
        setTeamMode(hasTeam ? 'overview' : 'create');
        setTeamError('');
        setTeamMessage('');
        setShowTeamModal(true);
      },
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
    <div className="lawyer-theme lawyer-dashboard-workspace min-h-screen bg-[#f3f8fb] text-[#062552] relative">
      <AppHeader variant="lawyer" profileTo="/profile" showBrandName />

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-20">
          <div>
            <h1 className="text-4xl font-bold mb-2">Lawyer Dashboard</h1>
            <p className="text-zinc-400">Manage your appointments, hearings, and daily practice efficiently.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
                    <h3 className="font-bold text-lg text-zinc-950">{client.userName}</h3>
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

      {showTeamModal && (
        <ModalShell
          title="My Team"
          icon={<Users className="h-6 w-6 text-amber-300" />}
          onClose={() => setShowTeamModal(false)}
          maxWidthClass="max-w-6xl"
        >
          <div className="lawyer-team-workspace">
            {hasTeam ? (
              <div className="space-y-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
                      {displayIsTeamOwner ? 'Senior lawyer team' : 'Joined team'}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{displayTeam.firmName || 'My Team'}</h3>
                    <p className="mt-2 text-sm text-zinc-400">Senior lawyer: {displayTeam.seniorLawyerName || 'Not added'}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
                    <p className="text-zinc-500">Team size</p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {teamSize}/{displayTeam.maxTeamSize || teamSize}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <KeyRound className="h-5 w-5 shrink-0 text-amber-300" />
                    <span className="min-w-0 flex-1 font-mono text-lg font-bold tracking-wider text-white">
                      {displayTeam.teamCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTeamCode}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-200"
                  >
                    <Copy size={18} />
                    Copy Code
                  </button>
                </div>
              </div>

              {teamWorkspaceLoading ? (
                <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-400">
                  Refreshing team workspace...
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="space-y-5">
                  {displayIsTeamOwner ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-white">Join Requests</h3>
                        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400">
                          {teamPendingRequests.length}
                        </span>
                      </div>
                      {teamPendingRequests.length === 0 ? (
                        <p className="mt-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900 p-4 text-sm font-semibold text-zinc-500">
                          No pending requests.
                        </p>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 gap-3">
                          {teamPendingRequests.map((request) => (
                            <div key={request.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                              <h4 className="font-bold text-white">{request.name || 'Lawyer'}</h4>
                              <p className="mt-1 text-xs text-zinc-500">{request.email || request.phone || 'Contact not shared'}</p>
                              <p className="mt-2 text-xs text-zinc-500">Requested {formatDate(request.requestedAt) || 'recently'}</p>
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTeamRequestDecision(request, 'accept')}
                                  disabled={updatingTeamRequestId === request.id}
                                  className="rounded-lg bg-[#15a276] px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-[#19b98d] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {updatingTeamRequestId === request.id ? 'Saving...' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTeamRequestDecision(request, 'reject')}
                                  disabled={updatingTeamRequestId === request.id}
                                  className="rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-900/70 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white">Team Directory</h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Select a lawyer to view profile and cases.
                        </p>
                      </div>
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400">
                        {teamDirectory.length}
                      </span>
                    </div>

                    {teamDirectory.length === 0 ? (
                      <EmptyBlock icon={<UserPlus size={24} />} message="No junior lawyers have joined yet." />
                    ) : (
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        {teamDirectory.map((member) => {
                          const memberId = getEntityId(member.lawyerId || member.id);
                          const memberCasesCount = teamCases.filter((teamCase) => {
                            const caseOwnerId = getEntityId(teamCase.addedBy);
                            const caseOwnerName = String(teamCase.addedByName || '').trim().toLowerCase();
                            const memberName = String(member.name || '').trim().toLowerCase();
                            return (caseOwnerId && memberId && caseOwnerId === memberId)
                              || (caseOwnerName && memberName && caseOwnerName === memberName);
                          }).length;
                          const isActiveMember = activeTeamMember && String(activeTeamMember.id) === String(member.id);

                          return (
                            <button
                              key={member.id || member.phone || member.email}
                              type="button"
                              onClick={() => setSelectedTeamMemberId(String(member.id))}
                              className={`w-full rounded-xl border p-4 text-left transition ${
                                isActiveMember
                                  ? 'border-amber-300 bg-amber-100/70 shadow-lg'
                                  : 'border-zinc-800 bg-zinc-900 hover:border-amber-300/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="truncate font-bold text-white">{member.name || 'Lawyer'}</h4>
                                  <p className="mt-1 truncate text-xs text-zinc-500">{member.email || member.phone || 'Contact not shared'}</p>
                                </div>
                                <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-bold text-zinc-400">
                                  {memberCasesCount} cases
                                </span>
                              </div>
                              <span className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                                {member.roleLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </aside>

                <section className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Lawyer Workspace</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        Cases appear under the lawyer who added them. Select a teammate to inspect their work.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTeamCaseForm((current) => !current)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-200"
                    >
                      <FaPlus />
                      {showTeamCaseForm ? 'Close Form' : 'Add Case'}
                    </button>
                  </div>

                  {showTeamCaseForm ? (
                    <form onSubmit={handleAddTeamCase} className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5 md:grid-cols-2">
                      <p className="text-sm font-semibold text-zinc-400 md:col-span-2">
                        This case will be saved under your lawyer profile in the team.
                      </p>
                      <input
                        name="clientName"
                        value={teamCaseForm.clientName}
                        onChange={handleTeamCaseInput}
                        placeholder="Client name"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        required
                      />
                      <input
                        name="caseTitle"
                        value={teamCaseForm.caseTitle}
                        onChange={handleTeamCaseInput}
                        placeholder="Case title"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        required
                      />
                      <input
                        name="courtName"
                        value={teamCaseForm.courtName}
                        onChange={handleTeamCaseInput}
                        placeholder="Court name"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      />
                      <input
                        type="date"
                        name="hearingDate"
                        value={teamCaseForm.hearingDate}
                        onChange={handleTeamCaseInput}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      />
                      <textarea
                        name="caseDetails"
                        value={teamCaseForm.caseDetails}
                        onChange={handleTeamCaseInput}
                        placeholder="Case details"
                        rows="4"
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300 md:col-span-2"
                        required
                      />
                      <textarea
                        name="basicInfo"
                        value={teamCaseForm.basicInfo}
                        onChange={handleTeamCaseInput}
                        placeholder="Basic info"
                        rows="3"
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      />
                      <textarea
                        name="documents"
                        value={teamCaseForm.documents}
                        onChange={handleTeamCaseInput}
                        placeholder="Documents, links, or file names. Add one per line."
                        rows="3"
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      />
                      <select
                        name="status"
                        value={teamCaseForm.status}
                        onChange={handleTeamCaseInput}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      >
                        {teamCaseStatuses.map((status) => (
                          <option key={status.value} value={status.value} className="text-zinc-950">
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={savingTeamCase}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FaCheck />
                        {savingTeamCase ? 'Saving...' : 'Save Case'}
                      </button>
                    </form>
                  ) : null}

                  {!activeTeamMember ? (
                    <EmptyBlock icon={<UserPlus size={24} />} message="Select a team member to view their profile and cases." />
                  ) : (
                    <>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-300">{activeTeamMember.roleLabel}</p>
                            <h3 className="mt-2 text-2xl font-bold text-white">{activeTeamMember.name || 'Lawyer'}</h3>
                            <p className="mt-2 text-sm text-zinc-500">{activeTeamMember.email || activeTeamMember.phone || 'Contact not shared'}</p>
                          </div>
                          {canRemoveActiveTeamMember ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveTeamMember(activeTeamMember)}
                              disabled={removingTeamMemberId === activeTeamMemberId}
                              className="inline-flex items-center justify-center rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-red-900/70 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {removingTeamMemberId === activeTeamMemberId ? 'Removing...' : 'Remove Member'}
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Joined</p>
                            <p className="mt-1 font-semibold text-zinc-200">{formatDate(activeTeamMember.joinedAt) || 'Recently'}</p>
                          </div>
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Cases Added</p>
                            <p className="mt-1 font-semibold text-zinc-200">{activeTeamMemberCases.length}</p>
                          </div>
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Team Role</p>
                            <p className="mt-1 font-semibold text-zinc-200">{activeTeamMember.roleLabel}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white">Cases by {activeTeamMember.name || 'this lawyer'}</h3>
                            <p className="text-sm text-zinc-500">Only this lawyer's matters are shown here.</p>
                          </div>
                          <p className="text-sm font-bold text-zinc-400">{activeTeamMemberCases.length} total</p>
                        </div>

                        {activeTeamMemberCases.length === 0 ? (
                          <EmptyBlock icon={<FaBriefcase size={24} />} message="No cases added by this lawyer yet." />
                        ) : (
                          <div className="space-y-4">
                            {activeTeamMemberCases.map((teamCase) => (
                              <div key={teamCase.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <h4 className="text-lg font-bold text-white">{teamCase.caseTitle || 'Untitled Case'}</h4>
                                    <p className="mt-1 text-sm text-zinc-400">Client: {teamCase.clientName || 'Not added'}</p>
                                    <p className="mt-1 text-xs text-zinc-500">Added on {formatDate(teamCase.createdAt) || 'recently'}</p>
                                  </div>
                                  <select
                                    value={teamCase.status || 'new'}
                                    onChange={(event) => handleUpdateTeamCaseStatus(teamCase, event.target.value)}
                                    disabled={updatingTeamCaseId === teamCase.id}
                                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white outline-none focus:border-amber-300 disabled:opacity-60"
                                  >
                                    {teamCaseStatuses.map((status) => (
                                      <option key={status.value} value={status.value} className="text-zinc-950">
                                        {status.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <p className="mt-4 text-sm leading-7 text-zinc-300">{teamCase.caseDetails || 'No case details added.'}</p>

                                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Court</p>
                                    <p className="mt-1 text-zinc-200">{teamCase.courtName || 'Not added'}</p>
                                  </div>
                                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Hearing Date</p>
                                    <p className="mt-1 text-zinc-200">{formatDate(teamCase.hearingDate) || 'Not scheduled'}</p>
                                  </div>
                                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Status</p>
                                    <p className="mt-1 text-zinc-200">{getTeamCaseStatusLabel(teamCase.status)}</p>
                                  </div>
                                </div>

                                {teamCase.basicInfo ? (
                                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Basic Info</p>
                                    <p className="mt-2 text-sm leading-6 text-zinc-300">{teamCase.basicInfo}</p>
                                  </div>
                                ) : null}

                                {teamCase.documents?.length ? (
                                  <div className="mt-4">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Documents</p>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      {teamCase.documents.map((document, index) => (
                                        <a
                                          key={`${teamCase.id}-doc-${index}`}
                                          href={String(document.url || '').startsWith('http') ? document.url : undefined}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-blue-300 transition hover:border-blue-500/50"
                                        >
                                          {document.name || document.url || `Document ${index + 1}`}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
              </div>
            ) : (
              <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTeamMode('create');
                    setTeamError('');
                    setTeamMessage('');
                  }}
                  className={`rounded-xl px-4 py-3 font-bold transition ${
                    teamMode === 'create'
                      ? 'bg-amber-300 text-zinc-950'
                      : 'border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-amber-300/50'
                  }`}
                >
                  Create a team
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeamMode('join');
                    setTeamError('');
                    setTeamMessage('');
                  }}
                  className={`rounded-xl px-4 py-3 font-bold transition ${
                    teamMode === 'join'
                      ? 'bg-amber-300 text-zinc-950'
                      : 'border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-amber-300/50'
                  }`}
                >
                  Join a team
                </button>
              </div>

              {teamMode === 'create' ? (
                <form onSubmit={handleCreateTeam} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Firm name</label>
                    <input
                      name="firmName"
                      value={createTeamForm.firmName}
                      onChange={handleCreateTeamInput}
                      placeholder="Firm name"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Senior lawyer name</label>
                    <input
                      name="seniorLawyerName"
                      value={createTeamForm.seniorLawyerName}
                      onChange={handleCreateTeamInput}
                      placeholder="Senior lawyer name"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Maximum team size</label>
                    <input
                      type="number"
                      min="2"
                      name="maxTeamSize"
                      value={createTeamForm.maxTeamSize}
                      onChange={handleCreateTeamInput}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Users size={18} />
                    {teamLoading ? 'Creating...' : 'Create Team'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoinTeam} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Team code</label>
                    <input
                      name="teamCode"
                      value={joinTeamForm.teamCode}
                      onChange={handleJoinTeamInput}
                      placeholder="Enter team code"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-lg font-bold tracking-wider text-white outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus size={18} />
                    {teamLoading ? 'Sending request...' : 'Request to Join'}
                  </button>
                </form>
              )}
              </div>
            )}

            {teamError ? (
              <p className="mt-5 rounded-xl border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-100">{teamError}</p>
            ) : null}
            {teamMessage ? (
              <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">{teamMessage}</p>
            ) : null}
          </div>
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
                  className="w-full rounded-xl border border-zinc-700 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-[#15a276]"
                >
                  {noticeDocumentTypes.map((type) => (
                    <option key={type} value={type} className="text-zinc-950">{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-200 mb-2">Basic Information</label>
                <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-2">
                  {selectedNoticeFields.map((field) => {
                    if (field.dependsOn && !noticeForm[field.dependsOn]) return null;

                    if (field.type === 'checkbox') {
                      return (
                        <label
                          key={field.id}
                          className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100"
                        >
                          <input
                            type="checkbox"
                            name={field.id}
                            checked={Boolean(noticeForm[field.id])}
                            onChange={handleNoticeInput}
                            className="mt-1 h-4 w-4 rounded border-zinc-600 accent-[#15a276]"
                          />
                          {field.label}
                        </label>
                      );
                    }

                    if (field.type === 'names') {
                      const names = noticeForm[field.id] || [''];

                      return (
                        <div key={field.id}>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                            {field.label}{field.required ? ' *' : ''}
                          </label>
                          <div className="space-y-2">
                            {names.map((name, index) => (
                              <div key={`${field.id}-${index}`} className="flex gap-2">
                                <input
                                  value={name}
                                  onChange={(event) => handleNoticeNameInput(field.id, index, event.target.value)}
                                  placeholder={`${field.label} ${index + 1}`}
                                  className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-[#15a276]"
                                />
                                {names.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeNoticeName(field.id, index)}
                                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-950 transition hover:border-red-700 hover:bg-red-50 hover:text-red-800"
                                    aria-label={`Remove ${field.label.toLowerCase()}`}
                                  >
                                    <FaTimes />
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => addNoticeName(field.id)}
                            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-950 transition hover:border-[#15a276] hover:bg-emerald-50"
                          >
                            <FaPlus />
                            {field.addLabel || 'Add another name'}
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={field.id}>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                          {field.label}{field.required ? ' *' : ''}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            name={field.id}
                            value={noticeForm[field.id] || ''}
                            onChange={handleNoticeInput}
                            rows={field.rows || 3}
                            placeholder={field.placeholder || field.label}
                            className="w-full resize-none rounded-xl border border-zinc-700 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-[#15a276]"
                          />
                        ) : (
                          <input
                            type={field.type}
                            name={field.id}
                            value={noticeForm[field.id] || ''}
                            onChange={handleNoticeInput}
                            placeholder={field.placeholder || field.label}
                            className="w-full rounded-xl border border-zinc-700 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-[#15a276]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
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
