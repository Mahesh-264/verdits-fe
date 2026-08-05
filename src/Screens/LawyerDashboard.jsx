import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBriefcase,
  FaCalendarPlus,
  FaCheck,
  FaCircle,
  FaFileSignature,
  FaGavel,
  FaMagic,
  FaPlus,
  FaTimes,
  FaTrash,
  FaUserGraduate,
} from 'react-icons/fa';
import { Copy, KeyRound, UserPlus, Users } from 'lucide-react';
import api from '../api/axios';
import AppHeader from '../components/AppHeader.jsx';
import FeedPostCard from '../components/feed/FeedPostCard.jsx';
import PostComposerModal from '../components/feed/PostComposerModal.jsx';
import ReactionBar from '../components/feed/ReactionBar.jsx';
import { updateUser } from '../redux/authSlice.jsx';
import socket from '../utils/socket.jsx';

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
  clientPhone: '',
  clientAddress: '',
  caseName: '',
  courtName: '',
  startingDate: '',
  nextHearingDate: '',
  briefInfo: '',
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

const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return String(value._id || value.id || value.lawyerId || '').trim();
  }
  return String(value).trim();
};

const isSameId = (id1, id2) => {
  const s1 = getEntityId(id1);
  const s2 = getEntityId(id2);
  return Boolean(s1 && s2 && s1 === s2);
};

const normalizeLawyerName = (name) => (
  String(name || '')
    .replace(/^(adv\.?|advocate|mr\.?|dr\.?)\s+/i, '')
    .replace(/\s*\(you\)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
);

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

const CaseDetailsView = ({
  selectedCase,
  displayTeam,
  onBack,
  teamCaseStatuses,
  updatingTeamCaseId,
  handleUpdateTeamCaseStatus,
  handleDeleteTeamCase,
  loadTeamWorkspace,
  formatDate,
}) => {
  const [caseDetails, setCaseDetails] = useState(null);
  const caseRecord = caseDetails || selectedCase;
  const [editingPhone, setEditingPhone] = useState(caseRecord.clientPhone || '');
  const [editingAddress, setEditingAddress] = useState(caseRecord.clientAddress || '');
  const [savingCaseDetails, setSavingCaseDetails] = useState(false);
  const [savingHearingHistory, setSavingHearingHistory] = useState(false);
  const [caseDetailsMessage, setCaseDetailsMessage] = useState('');
  const [caseDetailsError, setCaseDetailsError] = useState('');

  const getInitialHearingHistory = useCallback(() => {
    if (Array.isArray(caseRecord.hearingHistory) && caseRecord.hearingHistory.length > 0) {
      return caseRecord.hearingHistory.map((item) => ({
        id: item.id,
        courtName: item.courtName || '',
        hearingDate: item.hearingDate ? new Date(item.hearingDate).toISOString().split('T')[0] : '',
        hearingDetails: item.hearingDetails || '',
        nextHearing: item.nextHearing ? new Date(item.nextHearing).toISOString().split('T')[0] : '',
      }));
    }
    return [
      {
        courtName: caseRecord.courtName || '',
        hearingDate: '',
        hearingDetails: '',
        nextHearing: caseRecord.nextHearingDate ? new Date(caseRecord.nextHearingDate).toISOString().split('T')[0] : '',
      },
    ];
  }, [caseRecord]);

  const [localHearingHistory, setLocalHearingHistory] = useState(getInitialHearingHistory);

  useEffect(() => {
    let active = true;
    api.get(`/teams/${displayTeam.id}/cases/${selectedCase.id}`)
      .then(({ data }) => { if (active) setCaseDetails(data?.case || null); })
      .catch((error) => console.error('Error loading case details:', error));
    return () => { active = false; };
  }, [displayTeam.id, selectedCase.id]);

  useEffect(() => {
    setEditingPhone(caseRecord.clientPhone || '');
    setEditingAddress(caseRecord.clientAddress || '');
    setLocalHearingHistory(getInitialHearingHistory());
  }, [caseRecord, getInitialHearingHistory]);

  const handleSaveCaseDetails = async () => {
    if (!editingPhone.trim()) { setCaseDetailsError('Phone number is required.'); return; }
    try {
      setSavingCaseDetails(true);
      setCaseDetailsError('');
      setCaseDetailsMessage('');
      await api.patch(`/teams/${displayTeam.id}/cases/${caseRecord.id}`, { clientPhone: editingPhone.trim(), clientAddress: editingAddress.trim() });
      const { data } = await api.get(`/teams/${displayTeam.id}/cases/${caseRecord.id}`);
      setCaseDetails(data?.case || null);
      await loadTeamWorkspace();
      setCaseDetailsMessage('Case details saved.');
    } catch (error) {
      setCaseDetailsError(error.response?.data?.message || 'Unable to save case details.');
    } finally {
      setSavingCaseDetails(false);
    }
  };

  const handleHearingHistoryChange = (index, field, value) => {
    setLocalHearingHistory((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddHearingRow = () => {
    let newCourtName = caseRecord?.courtName || '';
    let newHearingDate = '';

    if (localHearingHistory.length > 0) {
      const lastRow = localHearingHistory[localHearingHistory.length - 1];
      newCourtName = lastRow.courtName || newCourtName;
      newHearingDate = lastRow.nextHearing || '';
    }

    setLocalHearingHistory((prev) => [
      ...prev,
      {
        courtName: newCourtName,
        hearingDate: newHearingDate,
        hearingDetails: '',
        nextHearing: '',
      },
    ]);
  };

  const handleRemoveHearingRow = (index) => {
    setLocalHearingHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveHearingHistory = async () => {
    try {
      setSavingHearingHistory(true);
      const { data } = await api.put(`/teams/${displayTeam.id}/cases/${caseRecord.id}/hearings`, { hearings: localHearingHistory });
      setCaseDetails(data?.case || null);
      await loadTeamWorkspace();
    } catch (error) {
      console.error('Error saving hearing history:', error);
    } finally {
      setSavingHearingHistory(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef5f8] pb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-2 text-sm font-bold text-[#062552] transition hover:border-[#15a276] hover:text-[#15a276]"
        >
          <FaArrowLeft /> Back to Cases
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleDeleteTeamCase(selectedCase)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
          >
            <FaTrash size={12} /> Delete Case
          </button>
          <span className="text-xs font-bold text-[#5f7488]">Status:</span>
          <select
            value={caseRecord.status || 'new'}
            onChange={(event) => handleUpdateTeamCaseStatus(caseRecord, event.target.value)}
            disabled={updatingTeamCaseId === caseRecord.id}
            className="rounded-xl border border-[#d7e9ef] bg-white px-3 py-1.5 text-xs font-bold text-[#062552] outline-none focus:border-[#15a276]"
          >
            {teamCaseStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expanded Case Details Section */}
      <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-5 space-y-4">
        <div className="border-b border-[#eef5f8] pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#15a276]">Case Details</h4>
          <h3 className="mt-1 text-2xl font-bold text-[#062552]">
            {caseRecord.caseName || caseRecord.caseTitle || caseRecord.title || 'Untitled Case'}
          </h3>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Brief Description</p>
          <p className="mt-1 text-sm leading-relaxed text-[#2c3e50]">
            {caseRecord.briefInfo || caseRecord.caseDetails || 'No brief description added.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Client Name</p>
            <p className="mt-1 text-sm font-bold text-[#062552]">{caseRecord.clientName || 'Not provided'}</p>
          </div>

          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Phone Number (Editable)</p>
            <input
              type="tel"
              value={editingPhone}
              onChange={(e) => setEditingPhone(e.target.value)}
              disabled={savingCaseDetails}
              placeholder="Enter phone number"
              className="mt-1 w-full rounded-md border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-xs font-bold text-[#062552] outline-none focus:border-[#15a276]"
            />
          </div>

          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Address (Editable)</p>
            <input
              type="text"
              value={editingAddress}
              onChange={(e) => setEditingAddress(e.target.value)}
              disabled={savingCaseDetails}
              placeholder="Enter address"
              className="mt-1 w-full rounded-md border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-xs font-bold text-[#062552] outline-none focus:border-[#15a276]"
            />
          </div>

          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Starting Date</p>
            <p className="mt-1 text-sm font-bold text-[#062552]">
              {formatDate(caseRecord.startingDate || caseRecord.hearingDate) || 'Not provided'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSaveCaseDetails} disabled={savingCaseDetails} className="inline-flex items-center gap-1.5 rounded-lg bg-[#15a276] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#118460] disabled:cursor-not-allowed disabled:opacity-60">
            <FaCheck size={12} /> {savingCaseDetails ? 'Saving...' : 'Save Case Details'}
          </button>
          {caseDetailsMessage ? <p className="text-xs font-semibold text-[#118460]">{caseDetailsMessage}</p> : null}
          {caseDetailsError ? <p className="text-xs font-semibold text-red-600">{caseDetailsError}</p> : null}
        </div>
      </div>

      {/* Hearing History Table Section */}
      <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef5f8] pb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#15a276]">Hearing History</h4>
            <p className="text-xs text-[#5f7488] mt-0.5">Track all court hearing schedules and details.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddHearingRow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#15a276] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#118460]"
            >
              <FaPlus size={12} /> Add Hearing Row
            </button>
            <button
              type="button"
              onClick={handleSaveHearingHistory}
              disabled={savingHearingHistory}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#15a276] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#118460] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaCheck size={12} /> {savingHearingHistory ? 'Saving...' : 'Save Hearing History'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#d7e9ef] bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfc] border-b border-[#d7e9ef] text-[#5f7488] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 min-w-[160px]">Court Name</th>
                <th className="px-4 py-3 min-w-[140px]">Hearing Date</th>
                <th className="px-4 py-3 min-w-[200px]">Hearing Details</th>
                <th className="px-4 py-3 min-w-[140px]">Next Hearing</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef5f8] text-[#062552]">
              {localHearingHistory.map((row, index) => (
                <tr key={`hearing-row-${index}`} className="hover:bg-[#f8fbfc]">
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={row.courtName}
                      onChange={(e) => handleHearingHistoryChange(index, 'courtName', e.target.value)}
                      placeholder="Court name"
                      className="w-full rounded-md border border-[#d7e9ef] bg-white px-2.5 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="date"
                      value={row.hearingDate}
                      onChange={(e) => handleHearingHistoryChange(index, 'hearingDate', e.target.value)}
                      className="w-full rounded-md border border-[#d7e9ef] bg-white px-2 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={row.hearingDetails}
                      onChange={(e) => handleHearingHistoryChange(index, 'hearingDetails', e.target.value)}
                      placeholder="Hearing details"
                      className="w-full rounded-md border border-[#d7e9ef] bg-white px-2.5 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="date"
                      value={row.nextHearing}
                      onChange={(e) => handleHearingHistoryChange(index, 'nextHearing', e.target.value)}
                      className="w-full rounded-md border border-[#d7e9ef] bg-white px-2 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveHearingRow(index)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Remove row"
                    >
                      <FaTrash size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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
  const [showHearingsModal, setShowHearingsModal] = useState(false);
  const [nextHearings, setNextHearings] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMode, setTeamMode] = useState('create');
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamWorkspaceLoading, setTeamWorkspaceLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamMessage, setTeamMessage] = useState('');
  const [teamWorkspace, setTeamWorkspace] = useState(null);
  const [teamWorkspaces, setTeamWorkspaces] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const selectedTeamIdRef = useRef('');
  useEffect(() => {
    selectedTeamIdRef.current = selectedTeamId;
  }, [selectedTeamId]);
  const [activeTeamTab, setActiveTeamTab] = useState('my_team');
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
  const [selectedCaseForDetailsId, setSelectedCaseForDetailsId] = useState('');
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
      const requestedTeamId = searchParams.get('teamId');
      if (requestedTeamId) setSelectedTeamId(requestedTeamId);
      setTeamMode(requestedMode === 'join' ? 'join' : 'overview');
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

  const loadTeamWorkspace = useCallback(async (targetTeamId) => {
    try {
      setTeamWorkspaceLoading(true);
      const teamIdToFetch = targetTeamId !== undefined ? targetTeamId : selectedTeamIdRef.current;
      const params = teamIdToFetch ? { teamId: teamIdToFetch } : undefined;
      const { data } = await api.get('/teams/workspace', { params });
      const teams = Array.isArray(data?.teams) ? data.teams : data?.team ? [data.team] : [];
      const activeId = data?.activeTeamId || data?.team?.id || teamIdToFetch || teams[0]?.id || '';
      setTeamWorkspaces(teams);
      setSelectedTeamId(activeId ? String(activeId) : '');
      selectedTeamIdRef.current = activeId ? String(activeId) : '';
      setTeamWorkspace(data?.team || null);
    } catch (error) {
      console.error('Error loading team workspace:', error);
      setTeamWorkspace(null);
      setTeamWorkspaces([]);
    } finally {
      setTeamWorkspaceLoading(false);
    }
  }, []);

  const handleSwitchTeam = useCallback(async (newTeamId) => {
    const targetId = String(newTeamId || '');
    if (!targetId || targetId === String(selectedTeamIdRef.current)) return;

    selectedTeamIdRef.current = targetId;
    setSelectedTeamId(targetId);
    setSelectedCaseForDetailsId('');
    setSelectedTeamMemberId('');
    setShowTeamCaseForm(false);
    setTeamWorkspace(null);
    setNextHearings([]);
    setTeamMode('overview');
    setTeamError('');
    setTeamMessage('');

    await loadTeamWorkspace(targetId);
  }, [loadTeamWorkspace]);

  useEffect(() => {
    if (!showTeamModal) return;
    loadTeamWorkspace();
  }, [loadTeamWorkspace, showTeamModal]);

  useEffect(() => {
    if (user?.role !== 'lawyer') return;
    loadTeamWorkspace();
  }, [loadTeamWorkspace, user?.role]);

  useEffect(() => {
    if (!showTeamModal) return;
    refreshCurrentUser();
  }, [refreshCurrentUser, showTeamModal]);

  useEffect(() => {
    if (user?.role !== 'lawyer') return undefined;
    const refreshTeamWorkspace = (event) => {
      if (event?.teamId && selectedTeamId && String(event.teamId) !== String(selectedTeamId)) return;
      loadTeamWorkspace();
    };
    const events = ['team:created', 'team:member-joined', 'team:member-left', 'team:join-request-created', 'team:join-request-rejected', 'case:created', 'case:updated', 'case:deleted', 'case:status-changed', 'hearing:created', 'hearing:updated', 'hearing:deleted', 'case.created', 'case.updated', 'case.deleted', 'hearing.created', 'hearing.updated', 'hearing.deleted', 'client.updated'];
    events.forEach((event) => socket.on(event, refreshTeamWorkspace));
    return () => events.forEach((event) => socket.off(event, refreshTeamWorkspace));
  }, [loadTeamWorkspace, selectedTeamId, user?.role]);

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
      if (data?.user) {
        dispatch(updateUser(data.user));
      }
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

      const { data } = await api.post('/teams/join-requests', {
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

    try {
      setSavingTeamCase(true);
      setTeamError('');
      setTeamMessage('');

      const payload = {
        clientName: teamCaseForm.clientName.trim(),
        clientPhone: teamCaseForm.clientPhone.trim(),
        clientAddress: teamCaseForm.clientAddress.trim(),
        caseName: (teamCaseForm.caseName || teamCaseForm.caseTitle || '').trim(),
        caseTitle: (teamCaseForm.caseName || teamCaseForm.caseTitle || '').trim(),
        briefInfo: (teamCaseForm.briefInfo || teamCaseForm.caseDetails || '').trim(),
        caseDetails: (teamCaseForm.briefInfo || teamCaseForm.caseDetails || '').trim(),
        courtName: teamCaseForm.courtName.trim(),
        startingDate: teamCaseForm.startingDate || teamCaseForm.hearingDate || '',
        nextHearingDate: teamCaseForm.nextHearingDate || '',
        hearingDate: teamCaseForm.startingDate || teamCaseForm.hearingDate || '',
        status: teamCaseForm.status,
      };

      await api.post(`/teams/${displayTeam.id}/cases`, payload);
      await loadTeamWorkspace();
      setSelectedTeamMemberId(currentLawyerId);
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

      await api.patch(`/teams/${displayTeam.id}/cases/${teamCase.id}`, { status });
      await loadTeamWorkspace();
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

      const normalizedDecision = decision === 'accept' ? 'approve' : 'reject';
      // Send an explicit empty object: Axios otherwise omits the request body,
      // which is valid for this endpoint but should not be relied upon.
      const { data: response } = await api.patch(
        `/teams/${displayTeam.id}/join-requests/${request.id}/${normalizedDecision}`,
        {}
      );
      const data = response?.data;
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update team request');
      }
      setTeamWorkspace(data?.team || null);
      setTeamWorkspaces(Array.isArray(data?.teams) ? data.teams : []);
      // Keep the owner's pending-request list current even when Socket.IO is
      // unavailable or reconnecting.
      await loadTeamWorkspace();
      setTeamMessage(response.message || (decision === 'accept' ? 'Join request accepted.' : 'Join request rejected.'));
    } catch (error) {
      console.error('Error updating team request:', error);
      const detailMessage = error.response?.data?.message || error.message || 'Unable to update team request';
      setTeamError(detailMessage ? `Failed to update team request: ${detailMessage}` : 'Failed to update team request');
    } finally {
      setUpdatingTeamRequestId('');
    }
  };

  const handleDeleteTeamCase = async (teamCase) => {
    const caseName = teamCase.caseName || teamCase.caseTitle || teamCase.title || 'this case';
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${caseName}"?`);
    if (!confirmed) return;

    try {
      setTeamError('');
      setTeamMessage('');

      await api.delete(`/teams/${displayTeam.id}/cases/${teamCase.id}`);
      if (selectedCaseForDetailsId === String(teamCase.id)) {
        setSelectedCaseForDetailsId('');
      }
      await loadTeamWorkspace();
      setTeamMessage('Case deleted successfully.');
    } catch (error) {
      console.error('Error deleting case:', error);
      setTeamError(error.response?.data?.message || 'Failed to delete case');
    }
  };

  const handleRemoveTeamMember = async (member) => {
    const memberId = getEntityId(member.lawyerId || member.id);
    if (!memberId) return;

    const confirmed = window.confirm(`Remove ${member.name || 'this lawyer'} from the team?`);
    if (!confirmed) return;

    try {
      setRemovingTeamMemberId(String(memberId));
      setTeamError('');
      setTeamMessage('');

      const { data: response } = await api.delete(`/teams/${displayTeam.id}/members/${memberId}`, {
        // Keep this explicit so the API contract remains stable if a removal
        // reason field is added to the UI later.
        data: {},
      });
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to remove team member');
      }
      setSelectedTeamMemberId('');
      await loadTeamWorkspace();
      setTeamMessage(response.message || 'Team member removed.');
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
  const hasTeam = Boolean(teamWorkspace?.teamCode || teamWorkspaces.length);
  const displayTeam = teamWorkspace || {};
  const displayTeamRole = teamWorkspace?.role;
  const displayIsTeamOwner = displayTeamRole === 'owner';
  const teamMembers = Array.isArray(displayTeam?.members) ? displayTeam.members : [];
  const teamPendingRequests = Array.isArray(displayTeam?.pendingRequests) ? displayTeam.pendingRequests : [];
  const teamCases = Array.isArray(displayTeam?.cases) ? displayTeam.cases : [];
  const teamSize = hasTeam ? teamMembers.length + 1 : 0;
  const currentLawyerId = getEntityId(user);
  const currentLawyerName = getLawyerDisplayName(user);
  const normalizedTeamMembers = teamMembers.map((member) => {
    const memberId = getEntityId(member.lawyerId || member.id || member._id);
    return {
      ...member,
      id: memberId || member.email || member.phone || member.name,
      lawyerId: memberId,
      roleLabel: 'Team Member',
      isOwner: false,
    };
  });
  const currentActiveTeamTab = displayIsTeamOwner ? activeTeamTab : 'my_cases';

  // For Team Owners, visibleTeamDirectory contains ONLY junior/joined members (excluding owner self profile to eliminate duplication).
  // For Team Members, visibleTeamDirectory is empty (no team directory displayed).
  const visibleTeamDirectory = displayIsTeamOwner ? normalizedTeamMembers : [];

  const targetMember = (displayIsTeamOwner && selectedTeamMemberId)
    ? (visibleTeamDirectory.find((member) => String(member.id) === String(selectedTeamMemberId)) || null)
    : null;
  const activeTeamMember = displayIsTeamOwner ? targetMember : null;
  const activeTeamMemberCases = activeTeamMember
    ? teamCases.filter((teamCase) => {
        const memberId = getEntityId(activeTeamMember.lawyerId || activeTeamMember.id);
        const caseOwnerId = getEntityId(teamCase.addedBy);
        if (isSameId(caseOwnerId, memberId)) return true;
        const normCaseOwnerName = normalizeLawyerName(teamCase.addedByName);
        const normMemberName = normalizeLawyerName(activeTeamMember.name);
        return Boolean(normCaseOwnerName && normMemberName && normCaseOwnerName === normMemberName);
      })
    : [];
  const activeTeamMemberId = activeTeamMember ? getEntityId(activeTeamMember.lawyerId || activeTeamMember.id) : '';
  const canRemoveActiveTeamMember = displayIsTeamOwner
    && activeTeamMember
    && !activeTeamMember.isOwner
    && Boolean(activeTeamMember.lawyerId);

  const leaderId = getEntityId(
    displayTeam.seniorLawyer
    || displayTeam.seniorLawyerId
    || displayTeam.owner
    || displayTeam.ownerId
    || (displayIsTeamOwner ? currentLawyerId : '')
  );
  const normLeaderName = normalizeLawyerName(
    displayTeam.seniorLawyerName
    || (displayIsTeamOwner ? currentLawyerName : '')
  );

  const ownTeamCases = teamCases
    .map((teamCase) => ({ ...teamCase, teamName: displayTeam.firmName, teamCode: displayTeam.teamCode }))
    .filter((teamCase) => {
      const caseOwnerId = getEntityId(teamCase.addedBy);
      const normCaseOwnerName = normalizeLawyerName(teamCase.addedByName);

      if (displayIsTeamOwner) {
        if (caseOwnerId && leaderId) {
          return isSameId(caseOwnerId, leaderId);
        }
        if (normCaseOwnerName && normLeaderName) {
          return normCaseOwnerName === normLeaderName;
        }
        return !caseOwnerId && !normCaseOwnerName;
      }

      // Joined Team Member view: display all cases belonging/assigned to logged-in lawyer
      const normCurrentName = normalizeLawyerName(currentLawyerName);
      if (caseOwnerId && currentLawyerId) {
        return isSameId(caseOwnerId, currentLawyerId);
      }
      if (normCaseOwnerName && normCurrentName) {
        return normCaseOwnerName === normCurrentName;
      }
      return false;
    });
  useEffect(() => {
    if (!displayTeam?.id) { setNextHearings([]); return; }
    let active = true;
    api.get(`/teams/${displayTeam.id}/next-hearings`)
      .then(({ data }) => { if (active) setNextHearings(Array.isArray(data?.cases) ? data.cases : []); })
      .catch((error) => console.error('Error loading next hearings:', error));
    return () => { active = false; };
  }, [displayTeam?.id, teamWorkspace?.updatedAt]);

  const ownHearings = nextHearings;

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
      badge: ownHearings.length > 0 ? ownHearings.length : null,
      icon: <FaGavel className="text-4xl text-emerald-500" />,
      desc: 'Track hearing dates from your own team cases.',
      onClick: () => setShowHearingsModal(true),
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

  const hasActiveFeature = Boolean(
    showAppointmentsModal ||
    showClientsModal ||
    showHearingsModal ||
    showTeamModal ||
    showNoticeGenerator ||
    showStudentInteractionModal
  );

  const closeAllFeatures = () => {
    setShowAppointmentsModal(false);
    setShowClientsModal(false);
    setShowHearingsModal(false);
    setShowTeamModal(false);
    setShowNoticeGenerator(false);
    setShowStudentInteractionModal(false);
    setDrawer(emptyDrawerState);
    setResumePreview(null);
  };

  return (
    <div className="lawyer-theme lawyer-dashboard-workspace min-h-screen bg-[#f3f8fb] text-[#062552] relative">
      <AppHeader variant="lawyer" profileTo="/profile" showBrandName />

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {hasActiveFeature ? (
          <div>
            {showAppointmentsModal && (
              <ModalShell title="Incoming Appointments" icon={<FaCalendarPlus className="text-[#15a276]" />} onClose={closeAllFeatures}>
                {loadingAppointments ? (
                  <EmptyBlock icon={<FaCalendarPlus size={24} />} message="Loading appointment requests..." />
                ) : pendingAppointments.length === 0 ? (
                  <EmptyBlock icon={<FaCalendarPlus size={24} />} message="No pending or rejected appointment requests right now." />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingAppointments.slice().reverse().map((appt) => (
                      <div key={appt.id} className="bg-white border border-[#d7e9ef] hover:border-[#15a276]/50 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-all text-[#062552]">
                        <div>
                          <h3 className="font-bold text-lg text-[#062552]">{appt.userName}</h3>
                          <p className="text-xs text-[#5f7488] mb-2">Requested on: {new Date(appt.timestamp).toLocaleString()}</p>
                          <StatusPill status={appt.status} />
                        </div>
                        {appt.status === 'Pending' ? (
                          <div className="flex gap-3 w-full sm:w-auto mt-3 sm:mt-0 shadow-sm">
                            <button onClick={() => updateStatus(appt.id, 'Accepted')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#15a276] hover:bg-[#118b66] text-white rounded-xl font-bold transition-transform active:scale-95">
                              <FaCheck /> Accept
                            </button>
                            <button onClick={() => updateStatus(appt.id, 'Rejected')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold transition-transform active:scale-95 border border-red-200">
                              <FaTimes /> Reject
                            </button>
                          </div>
                        ) : appt.status === 'Rejected' ? (
                          <p className="text-xs text-red-600 font-medium">Request rejected</p>
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
                <div key={client.id} className="bg-white border border-[#d7e9ef] hover:border-[#15a276]/50 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-all text-[#062552]">
                  <div>
                    <h3 className="font-bold text-lg text-[#062552]">{client.userName}</h3>
                    <p className="text-xs text-[#5f7488] mb-2">Accepted on: {new Date(client.timestamp).toLocaleString()}</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <FaCircle className="text-[8px]" /> Accepted Client
                    </span>
                  </div>
                  <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                    <p className="text-xs text-[#5f7488] font-medium">Client communication unlocked</p>
                    <button
                      onClick={() => handleOpenChat(client)}
                      className="px-5 py-2 bg-[#15a276] hover:bg-[#118b66] text-white rounded-xl font-bold shadow transition-transform active:scale-95"
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

      {showHearingsModal && (
        <ModalShell title="Next Hearings" icon={<FaGavel className="text-[#062552]" />} onClose={() => setShowHearingsModal(false)}>
          <div className="lawyer-team-workspace space-y-4">
            <div className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#062552]">My Hearings</h3>
              <p className="mt-1 text-sm text-[#5f7488]">
                Hearing dates from cases added by you. Other team members' matters are not shown here.
              </p>
            </div>

            {ownHearings.length === 0 ? (
              <EmptyBlock icon={<FaGavel size={24} />} message="No hearings scheduled from your team cases yet." />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ownHearings.map((hearing) => (
                  <div key={`${hearing.id}-${hearing.teamCode || 'team'}`} className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm hover:border-[#15a276]/50 transition-all text-[#062552]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">{hearing.teamName || 'Team Case'}</p>
                        <h3 className="mt-2 text-xl font-bold text-[#062552]">{hearing.caseTitle || 'Untitled Case'}</h3>
                        <p className="mt-1 text-sm text-[#5f7488]">Client: {hearing.clientName || 'Not added'}</p>
                      </div>
                      <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                        {formatDate(hearing.hearingDate)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Court</p>
                        <p className="mt-1 font-semibold text-[#062552]">{hearing.courtName || 'Not added'}</p>
                      </div>
                      <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Status</p>
                        <p className="mt-1 font-semibold text-[#062552]">{getTeamCaseStatusLabel(hearing.status)}</p>
                      </div>
                      <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Team Code</p>
                        <p className="mt-1 font-mono font-semibold text-[#062552]">{hearing.teamCode || 'Not added'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {showTeamModal && (
        <ModalShell
          title="My Team"
          icon={<Users className="h-6 w-6 text-[#15a276]" />}
          onClose={() => setShowTeamModal(false)}
        >
          <div className="lawyer-team-workspace text-[#062552]">
            {hasTeam ? (
              <div className="space-y-5">
              <div className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
                      {displayIsTeamOwner ? 'Team you own' : 'Joined team'}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{displayTeam.firmName || 'My Team'}</h3>
                    <p className="mt-2 text-sm text-zinc-400">Team Owner: {displayTeam.seniorLawyerName || 'Not added'}</p>
                  </div>
                  <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-3 text-sm">
                    <p className="text-[#5f7488]">Team size</p>
                    <p className="mt-1 text-xl font-bold text-[#062552]">
                      {teamSize}/{displayTeam.maxTeamSize || teamSize}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-3">
                    <KeyRound className="h-5 w-5 shrink-0 text-[#15a276]" />
                    <span className="min-w-0 flex-1 font-mono text-lg font-bold tracking-wider text-[#062552]">
                      {displayTeam.teamCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTeamCode}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold px-5 py-3 transition border border-[#d6b85b] shadow-sm"
                  >
                    <Copy size={18} />
                    Copy Code
                  </button>
                </div>
              </div>

              {teamWorkspaceLoading ? (
                <p className="rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-semibold text-[#5f7488]">
                  Refreshing team workspace...
                </p>
              ) : null}

              <div className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#062552]">Your Teams</h3>
                    <p className="mt-1 text-xs text-[#5f7488]">Switch between teams, create another team, or request to join a team.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        setTeamMode('create');
                        setTeamError('');
                        setTeamMessage('');
                      }}
                      className="rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-4 py-2.5 text-sm font-bold transition shadow-sm border border-[#d6b85b]"
                    >
                      Create Team
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeamMode('join');
                        setTeamError('');
                        setTeamMessage('');
                      }}
                      className="rounded-xl border border-[#d7e9ef] bg-white px-4 py-2.5 text-sm font-bold text-[#062552] transition hover:bg-[#f3f8fb]"
                    >
                      Join Team
                    </button>
                  </div>
                </div>

                {teamWorkspaces.length ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {teamWorkspaces.map((team) => {
                      const isSelectedTeam = String(team.id) === String(displayTeam.id);
                      return (
                        <button
                          key={team.id || team.teamCode}
                          type="button"
                          onClick={() => handleSwitchTeam(team.id)}
                          className={`rounded-xl border p-4 text-left transition ${
                            isSelectedTeam
                              ? 'border-[#15a276] bg-[#e8f7f2] shadow-sm'
                              : 'border-[#d7e9ef] bg-white hover:border-[#15a276]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate font-bold text-[#062552]">{team.firmName || 'Lawyer Team'}</h4>
                              <p className="mt-1 text-xs font-semibold text-[#5f7488]">{team.role === 'owner' ? 'Created by you' : 'Joined team'}</p>
                            </div>
                            <span className="rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-2.5 py-1 text-[11px] font-bold text-[#5f7488]">
                              {team.teamCode}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {teamMode === 'create' ? (
                <form onSubmit={handleCreateTeam} className="space-y-4 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <input
                      name="firmName"
                      value={createTeamForm.firmName}
                      onChange={handleCreateTeamInput}
                      placeholder="Firm name"
                      className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                      required
                    />
                    <input
                      name="seniorLawyerName"
                      value={createTeamForm.seniorLawyerName}
                      onChange={handleCreateTeamInput}
                      placeholder="Team Owner name"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      required
                    />
                    <input
                      type="number"
                      min="2"
                      name="maxTeamSize"
                      value={createTeamForm.maxTeamSize}
                      onChange={handleCreateTeamInput}
                      className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15a276] px-5 py-3 font-bold text-white transition hover:bg-[#118b66] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Users size={18} />
                    {teamLoading ? 'Creating...' : 'Create Team'}
                  </button>
                </form>
              ) : null}

              {teamMode === 'join' ? (
                <form onSubmit={handleJoinTeam} className="space-y-4 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f7488]">Team code</label>
                    <input
                      name="teamCode"
                      value={joinTeamForm.teamCode}
                      onChange={handleJoinTeamInput}
                      placeholder="Enter team code"
                      className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15a276] px-5 py-3 font-bold text-white transition hover:bg-[#118b66] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus size={18} />
                        {teamLoading ? 'Sending...' : 'Request to Join'}
                  </button>
                </form>
              ) : null}

              {/* Sub-workspace Navigation Tabs */}
              <div className="rounded-2xl border border-[#d7e9ef] bg-white p-2 shadow-sm flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTeamTab('my_cases')}
                  className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                    currentActiveTeamTab === 'my_cases'
                      ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                      : 'bg-transparent text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'
                  }`}
                >
                  My Cases ({ownTeamCases.length})
                </button>

                {displayIsTeamOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTeamTab('my_team')}
                      className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                        currentActiveTeamTab === 'my_team'
                          ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                          : 'bg-transparent text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'
                      }`}
                    >
                      My Team ({visibleTeamDirectory.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTeamTab('join_requests')}
                      className={`relative rounded-xl px-5 py-3 text-sm font-bold transition ${
                        currentActiveTeamTab === 'join_requests'
                          ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                          : 'bg-transparent text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'
                      }`}
                    >
                      Join Requests
                      {teamPendingRequests.length > 0 ? (
                        <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                          {teamPendingRequests.length}
                        </span>
                      ) : null}
                    </button>
                  </>
                ) : null}
              </div>

              {/* My Cases Tab View (Shown when currentActiveTeamTab === 'my_cases') */}
              {currentActiveTeamTab === 'my_cases' ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#062552]">My Personal Cases</h3>
                      <p className="mt-1 text-sm text-[#5f7488]">
                        Cases added by you for this team.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTeamCaseForm((current) => !current)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition shadow-sm border ${
                        showTeamCaseForm
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                          : 'bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 border-[#d6b85b]'
                      }`}
                    >
                      {showTeamCaseForm ? <FaTimes /> : <FaPlus />}
                      {showTeamCaseForm ? 'Close Form' : 'Add Case'}
                    </button>
                  </div>

                  {showTeamCaseForm ? (
                    <form onSubmit={handleAddTeamCase} className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5 md:grid-cols-2">
                      <p className="text-sm font-semibold text-zinc-400 md:col-span-2">
                        This case will be saved under your lawyer profile in the team.
                      </p>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Name</label>
                        <input
                          name="clientName"
                          value={teamCaseForm.clientName}
                          onChange={handleTeamCaseInput}
                          placeholder="Client name"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Phone</label>
                        <input
                          name="clientPhone"
                          value={teamCaseForm.clientPhone}
                          onChange={handleTeamCaseInput}
                          placeholder="Client phone number"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Address</label>
                        <input
                          name="clientAddress"
                          value={teamCaseForm.clientAddress}
                          onChange={handleTeamCaseInput}
                          placeholder="Client address"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Case Name</label>
                        <input
                          name="caseName"
                          value={teamCaseForm.caseName}
                          onChange={handleTeamCaseInput}
                          placeholder="Case name"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Court Name</label>
                        <input
                          name="courtName"
                          value={teamCaseForm.courtName}
                          onChange={handleTeamCaseInput}
                          placeholder="Court name"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Starting Date</label>
                        <input
                          type="date"
                          name="startingDate"
                          value={teamCaseForm.startingDate}
                          onChange={handleTeamCaseInput}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Next Hearing Date</label>
                        <input
                          type="date"
                          name="nextHearingDate"
                          value={teamCaseForm.nextHearingDate}
                          onChange={handleTeamCaseInput}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Brief Info About the Case</label>
                        <textarea
                          name="briefInfo"
                          value={teamCaseForm.briefInfo}
                          onChange={handleTeamCaseInput}
                          placeholder="Brief info about the case"
                          rows="4"
                          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Status</label>
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
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={savingTeamCase}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-5 py-3 font-bold transition border border-[#d6b85b] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FaCheck />
                          {savingTeamCase ? 'Saving...' : 'Save Case'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {selectedCaseForDetailsId && ownTeamCases.some((item) => String(item.id) === String(selectedCaseForDetailsId)) ? (() => {
                    const selectedCase = ownTeamCases.find((item) => String(item.id) === String(selectedCaseForDetailsId));
                    return (
                      <CaseDetailsView
                        selectedCase={selectedCase}
                        displayTeam={displayTeam}
                        onBack={() => setSelectedCaseForDetailsId('')}
                        teamCaseStatuses={teamCaseStatuses}
                        updatingTeamCaseId={updatingTeamCaseId}
                        handleUpdateTeamCaseStatus={handleUpdateTeamCaseStatus}
                        handleDeleteTeamCase={handleDeleteTeamCase}
                        loadTeamWorkspace={loadTeamWorkspace}
                        formatDate={formatDate}
                      />
                    );
                  })() : ownTeamCases.length === 0 ? (
                    <EmptyBlock icon={<FaBriefcase size={24} />} message="No cases added by you yet." />
                  ) : (
                    <div className="space-y-4">
                      {ownTeamCases.map((teamCase) => (
                        <div
                          key={teamCase.id}
                          onClick={() => setSelectedCaseForDetailsId(String(teamCase.id))}
                          className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-[#15a276]"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-white group-hover:text-[#15a276] transition">
                                {teamCase.caseName || teamCase.caseTitle || teamCase.title || 'Untitled Case'}
                              </h4>
                              <p className="mt-1 text-sm text-zinc-400">
                                Client: <span className="font-semibold text-blue-300 underline">{teamCase.clientName || 'Not added'}</span>
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">Added on {formatDate(teamCase.createdAt) || 'recently'}</p>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
                          </div>

                          <p className="mt-4 text-sm leading-7 text-zinc-300">{teamCase.briefInfo || teamCase.caseDetails || 'No brief info added.'}</p>

                          <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 text-sm">
                            <div className="flex items-center gap-4 text-xs text-zinc-400">
                              <span>Court: <strong className="text-zinc-200">{teamCase.courtName || 'Not added'}</strong></span>
                              <span>Starting: <strong className="text-zinc-200">{formatDate(teamCase.startingDate || teamCase.hearingDate) || 'Not added'}</strong></span>
                            </div>
                            <span className="text-xs font-bold text-[#15a276] group-hover:underline flex items-center gap-1">
                              View Case Details &rarr;
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Tab 3: My Team (Owner Only Tab) */}
              {currentActiveTeamTab === 'my_team' && displayIsTeamOwner ? (
                !activeTeamMember ? (
                  /* Step 1: Full-Width Team Directory View */
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef5f8] pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-[#062552]">Team Directory</h3>
                          <p className="mt-1 text-sm text-[#5f7488]">
                            Select a lawyer to view their profile and assigned cases.
                          </p>
                        </div>
                        <span className="shrink-0 self-start sm:self-auto rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-1.5 text-sm font-bold text-[#5f7488]">
                          {visibleTeamDirectory.length} {visibleTeamDirectory.length === 1 ? 'Lawyer' : 'Lawyers'}
                        </span>
                      </div>

                      {visibleTeamDirectory.length === 0 ? (
                        <EmptyBlock icon={<UserPlus size={24} />} message="No team members in directory." />
                      ) : (
                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {visibleTeamDirectory.map((member) => {
                            const memberId = getEntityId(member.lawyerId || member.id);
                            const isSelfMember = isSameId(memberId, currentLawyerId);
                            const canViewMemberDetails = displayIsTeamOwner || isSelfMember;
                            const memberCasesCount = teamCases.filter((teamCase) => {
                              const caseOwnerId = getEntityId(teamCase.addedBy);
                              const caseOwnerName = String(teamCase.addedByName || '').trim().toLowerCase();
                              const memberName = String(member.name || '').replace(/\s*\(you\)$/i, '').trim().toLowerCase();
                              return (caseOwnerId && memberId && caseOwnerId === memberId)
                                || (caseOwnerName && memberName && caseOwnerName === memberName);
                            }).length;

                            return (
                              <div
                                key={member.id || member.phone || member.email}
                                onClick={canViewMemberDetails ? () => setSelectedTeamMemberId(String(member.id)) : undefined}
                                className={`rounded-2xl border p-5 shadow-sm transition ${
                                  canViewMemberDetails
                                    ? 'group cursor-pointer border-[#d7e9ef] bg-white hover:border-[#15a276] hover:shadow-md'
                                    : 'cursor-default border-[#e2edf1] bg-[#f8fbfc] opacity-90'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className={`truncate text-base font-bold transition ${
                                      canViewMemberDetails ? 'text-[#062552] group-hover:text-[#15a276]' : 'text-[#5f7488]'
                                    }`}>
                                      {member.name || 'Lawyer'}
                                    </h4>
                                    <p className="mt-1 truncate text-xs text-[#5f7488]">
                                      {member.email || member.phone || 'Contact not shared'}
                                    </p>
                                  </div>
                                  {canViewMemberDetails ? (
                                    <span className="shrink-0 rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-2.5 py-1 text-xs font-bold text-[#5f7488]">
                                      {memberCasesCount} {memberCasesCount === 1 ? 'case' : 'cases'}
                                    </span>
                                  ) : (
                                    <span className="shrink-0 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                      Private
                                    </span>
                                  )}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-[#f0f6f8] pt-3">
                                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                    {member.roleLabel}
                                  </span>
                                  {canViewMemberDetails ? (
                                    <span className="text-xs font-bold text-[#15a276] group-hover:underline flex items-center gap-1">
                                      View Cases &rarr;
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Step 2: Dedicated Member Details View */
                  <div className="space-y-5">
                    {/* Navigation Header with Back Button */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedTeamMemberId('')}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-2 text-xs font-bold text-[#062552] transition hover:bg-[#eef5f8] self-start sm:self-auto"
                      >
                        <FaArrowLeft />
                        Back to Team Directory
                      </button>

                      <div className="flex items-center gap-3">
                        {canRemoveActiveTeamMember ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMember(activeTeamMember)}
                            disabled={removingTeamMemberId === activeTeamMemberId}
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {removingTeamMemberId === activeTeamMemberId ? 'Removing...' : 'Remove Member'}
                          </button>
                        ) : null}
                        <span className="rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-xs font-bold text-[#5f7488]">
                          {activeTeamMemberCases.length} {activeTeamMemberCases.length === 1 ? 'case assigned' : 'cases assigned'}
                        </span>
                      </div>
                    </div>

                    {/* Member Profile Header */}
                    <div className="rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-[#062552]">{activeTeamMember.name || 'Lawyer'}</h3>
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              {activeTeamMember.roleLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#5f7488]">
                            Email: {activeTeamMember.email || 'Not shared'} | Phone: {activeTeamMember.phone || 'Not shared'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Cases List */}
                    <div className="space-y-4">
                      <h4 className="text-base font-bold text-[#062552]">Assigned Cases</h4>
                      {activeTeamMemberCases.length === 0 ? (
                        <EmptyBlock icon={<FaBriefcase size={24} />} message="No cases added by this lawyer yet." />
                      ) : (
                        <div className="space-y-4">
                          {activeTeamMemberCases.map((teamCase) => (
                            <div key={teamCase.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <h4 className="text-lg font-bold text-white">{teamCase.caseName || teamCase.caseTitle || 'Untitled Case'}</h4>
                                  <p className="mt-1 text-sm text-zinc-400">Client: {teamCase.clientName || 'Not added'}</p>
                                  <p className="mt-1 text-xs text-zinc-500">Added on {formatDate(teamCase.createdAt) || 'recently'}</p>
                                </div>
                                {teamCase.canEdit ? (
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
                                ) : (
                                  <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-400">
                                    {getTeamCaseStatusLabel(teamCase.status)}
                                  </span>
                                )}
                              </div>

                              <p className="mt-4 text-sm leading-7 text-zinc-300">{teamCase.briefInfo || teamCase.caseDetails || 'No brief info added.'}</p>

                              <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Court</p>
                                  <p className="mt-1 text-zinc-200">{teamCase.courtName || 'Not added'}</p>
                                </div>
                                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Starting Date</p>
                                  <p className="mt-1 text-zinc-200">{formatDate(teamCase.startingDate || teamCase.hearingDate) || 'Not added'}</p>
                                </div>
                                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Status</p>
                                  <p className="mt-1 text-zinc-200">{getTeamCaseStatusLabel(teamCase.status)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : null}

              {/* Tab 3: Join Requests (Owner Tab) */}
              {currentActiveTeamTab === 'join_requests' && displayIsTeamOwner ? (
                <div className="rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm max-w-3xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#062552]">Join Requests</h3>
                      <p className="mt-1 text-sm text-[#5f7488]">Review requests from lawyers wanting to join your team.</p>
                    </div>
                    <span className="rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-sm font-bold text-[#5f7488]">
                      {teamPendingRequests.length} pending
                    </span>
                  </div>
                  {teamPendingRequests.length === 0 ? (
                    <p className="mt-5 rounded-xl border border-dashed border-[#d7e9ef] bg-[#f8fbfc] p-6 text-center text-sm font-semibold text-[#5f7488]">
                      No pending join requests.
                    </p>
                  ) : (
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {teamPendingRequests.map((request) => (
                        <div key={request.id} className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-5">
                          <h4 className="font-bold text-[#062552] text-base">{request.name || 'Lawyer'}</h4>
                          <p className="mt-1 text-xs text-[#5f7488]">{request.email || request.phone || 'Contact not shared'}</p>
                          <p className="mt-2 text-xs text-[#5f7488]">Requested {formatDate(request.requestedAt) || 'recently'}</p>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleTeamRequestDecision(request, 'accept')}
                              disabled={updatingTeamRequestId === request.id}
                              className="rounded-lg bg-[#15a276] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#118b66] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingTeamRequestId === request.id ? 'Saving...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTeamRequestDecision(request, 'reject')}
                              disabled={updatingTeamRequestId === request.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Team Owner name</label>
                    <input
                      name="seniorLawyerName"
                      value={createTeamForm.seniorLawyerName}
                      onChange={handleCreateTeamInput}
                      placeholder="Team Owner name"
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
        <ModalShell
          title="Student Interaction"
          icon={<FaUserGraduate className="text-cyan-400" />}
          onClose={() => {
            setShowStudentInteractionModal(false);
            setDrawer(emptyDrawerState);
            setResumePreview(null);
          }}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#5f7488]">Create, manage, and track all student engagement from one dashboard module.</p>
            <div className="flex flex-col xl:flex-row min-h-[600px] border border-[#d7e9ef] rounded-2xl overflow-hidden bg-white shadow-sm text-[#062552]">
              <div className="w-full xl:w-64 border-b xl:border-b-0 xl:border-r border-[#d7e9ef] bg-[#f8fbfc] p-4">
                <button
                  type="button"
                  onClick={() => {
                    setStudentInteractionTab('internships');
                    setShowJamSessionForm(false);
                  }}
                  className={`w-full text-left rounded-xl px-4 py-4 font-semibold transition ${
                    studentInteractionTab === 'internships'
                      ? 'bg-[#f1d15f] text-zinc-950 font-bold border border-[#d6b85b] shadow-sm'
                      : 'bg-white text-[#43556a] hover:bg-[#e8f7f2] hover:text-[#15a276] border border-[#d7e9ef]'
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
                      ? 'bg-[#f1d15f] text-zinc-950 font-bold border border-[#d6b85b] shadow-sm'
                      : 'bg-white text-[#43556a] hover:bg-[#e8f7f2] hover:text-[#15a276] border border-[#d7e9ef]'
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
                      ? 'bg-[#f1d15f] text-zinc-950 font-bold border border-[#d6b85b] shadow-sm'
                      : 'bg-white text-[#43556a] hover:bg-[#e8f7f2] hover:text-[#15a276] border border-[#d7e9ef]'
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
                          <button type="submit" className="w-full rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold px-5 py-3 border border-[#d6b85b] shadow-sm transition">
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
                          <button type="submit" className="w-full rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold px-5 py-3 border border-[#d6b85b] shadow-sm transition">
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
        </ModalShell>
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
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <form onSubmit={handleGenerateNotice} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#062552] mb-2">Document Type</label>
                <select
                  name="documentType"
                  value={noticeForm.documentType}
                  onChange={handleNoticeInput}
                  className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                >
                  {noticeDocumentTypes.map((type) => (
                    <option key={type} value={type} className="text-[#062552]">{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#062552] mb-2">Basic Information</label>
                <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-2">
                  {selectedNoticeFields.map((field) => {
                    if (field.dependsOn && !noticeForm[field.dependsOn]) return null;

                    if (field.type === 'checkbox') {
                      return (
                        <label
                          key={field.id}
                          className="flex items-start gap-3 rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-semibold text-[#062552]"
                        >
                          <input
                            type="checkbox"
                            name={field.id}
                            checked={Boolean(noticeForm[field.id])}
                            onChange={handleNoticeInput}
                            className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#15a276]"
                          />
                          {field.label}
                        </label>
                      );
                    }

                    if (field.type === 'names') {
                      const names = noticeForm[field.id] || [''];

                      return (
                        <div key={field.id}>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f7488]">
                            {field.label}{field.required ? ' *' : ''}
                          </label>
                          <div className="space-y-2">
                            {names.map((name, index) => (
                              <div key={`${field.id}-${index}`} className="flex gap-2">
                                <input
                                  value={name}
                                  onChange={(event) => handleNoticeNameInput(field.id, index, event.target.value)}
                                  placeholder={`${field.label} ${index + 1}`}
                                  className="min-w-0 flex-1 rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                                />
                                {names.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeNoticeName(field.id, index)}
                                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d7e9ef] bg-white text-[#062552] transition hover:border-red-600 hover:bg-red-50 hover:text-red-700"
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
                            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#d7e9ef] bg-white px-3 py-2 text-xs font-bold text-[#062552] transition hover:border-[#15a276] hover:bg-[#e8f7f2]"
                          >
                            <FaPlus />
                            {field.addLabel || 'Add another name'}
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={field.id}>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f7488]">
                          {field.label}{field.required ? ' *' : ''}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            name={field.id}
                            value={noticeForm[field.id] || ''}
                            onChange={handleNoticeInput}
                            rows={field.rows || 3}
                            placeholder={field.placeholder || field.label}
                            className="w-full resize-none rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                          />
                        ) : (
                          <input
                            type={field.type}
                            name={field.id}
                            value={noticeForm[field.id] || ''}
                            onChange={handleNoticeInput}
                            placeholder={field.placeholder || field.label}
                            className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {noticeError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{noticeError}</p>
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
                  <label className="block text-sm font-bold text-[#062552]">Generated Draft</label>
                  <button
                    type="button"
                    onClick={handleCopyNotice}
                    disabled={!noticeDraft.trim()}
                    className="rounded-lg border border-[#d7e9ef] px-3 py-2 text-xs font-bold text-[#062552] transition hover:border-[#15a276] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  value={noticeDraft}
                  onChange={(event) => setNoticeDraft(event.target.value)}
                  rows="18"
                  placeholder="Your generated notice will appear here."
                  className="w-full resize-none rounded-xl border border-[#d7e9ef] bg-white px-4 py-4 font-mono text-sm leading-7 text-[#062552] outline-none focus:border-[#15a276]"
                />
              </div>

              <form onSubmit={handleEditNotice} className="space-y-3">
                <label className="block text-sm font-bold text-[#062552]">Edit With AI</label>
                <div className="flex flex-col gap-3 lg:flex-row">
                  <input
                    value={noticeEditPrompt}
                    onChange={(event) => setNoticeEditPrompt(event.target.value)}
                    placeholder="Example: make it stronger, add 15-day compliance deadline, simplify paragraph 3"
                    className="min-w-0 flex-1 rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                  />
                  <button
                    type="submit"
                    disabled={noticeEditing || !noticeDraft.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 border border-[#d6b85b] shadow-sm"
                  >
                    <FaMagic />
                    {noticeEditing ? 'Editing...' : 'Apply Edit'}
                  </button>
                </div>
              </form>

              {noticeMessage ? <p className="text-sm font-semibold text-[#15a276]">{noticeMessage}</p> : null}
            </div>
          </div>
        </ModalShell>
      ) : null}
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
                  className="relative bg-white border border-[#d7e9ef] p-6 rounded-2xl hover:border-[#15a276]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer shadow-sm text-[#062552]"
                >
                  {card.badge > 0 && (
                    <div className="absolute top-4 right-4 bg-[#15a276] text-white text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full shadow animate-pulse">
                      {card.badge}
                    </div>
                  )}
                  <div className="bg-[#e8f7f2] w-16 h-16 rounded-full flex items-center justify-center mb-6 text-[#15a276]">
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-[#062552]">{card.title}</h2>
                  <p className="text-[#5f7488] text-sm">{card.desc}</p>
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
                    <p className="text-sm text-[#5f7488] mt-1">Automatic hearing schedule for cases created by you in your team.</p>
                  </div>
                </div>
                {ownHearings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHearingsModal(true)}
                    className="text-xs font-bold text-[#15a276] hover:text-[#118b66] transition-colors cursor-pointer"
                  >
                    View All ({ownHearings.length})
                  </button>
                )}
              </div>

              <div className="mt-6">
                {ownHearings.length === 0 ? (
                  <EmptyBlock icon={<FaGavel size={24} />} message="No hearings scheduled for your cases yet. Add a new team case with a hearing date to automatically pull it here." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ownHearings.slice(0, 3).map((hearing) => (
                      <div key={`${hearing.id}-${hearing.teamCode || 'team'}`} className="rounded-2xl border border-[#d7e9ef] bg-white p-5 flex flex-col justify-between hover:border-[#15a276]/50 shadow-sm transition-all text-[#062552]">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
                              {hearing.teamName || 'Team Case'}
                            </span>
                            <span className="text-xs font-semibold text-[#5f7488]">{getTeamCaseStatusLabel(hearing.status)}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-[#062552] truncate">{hearing.caseTitle || 'Untitled Case'}</h3>
                          <p className="mt-1 text-sm text-[#5f7488] truncate">Client: {hearing.clientName || 'Not specified'}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#d7e9ef] flex items-center justify-between text-xs">
                          <div>
                            <p className="text-[#5f7488] font-medium">Hearing Date</p>
                            <p className="font-bold text-[#15a276] mt-0.5">{formatDate(hearing.hearingDate)}</p>
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
          </div>
        )}
      </div>

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

function FeaturePageShell({ title, icon, onClose, children }) {
  return (
    <div className="w-full animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#dbe2ef]">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-4 py-2.5 text-sm font-bold transition shadow-sm cursor-pointer border border-[#d6b85b]"
          >
            <FaArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-[#dbe2ef] hidden sm:block" />
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-[#062552]">
            {icon} {title}
          </h1>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="self-end sm:self-auto text-[#5f7488] hover:text-[#062552] bg-white border border-[#d7e9ef] hover:bg-gray-100 rounded-full transition p-2.5 shadow-sm cursor-pointer"
          aria-label="Close feature page"
        >
          <FaTimes size={18} />
        </button>
      </div>

      <div className="w-full">{children}</div>
    </div>
  );
}

const ModalShell = FeaturePageShell;

function EmptyBlock({ icon, message }) {
  return (
    <div className="text-center py-16 border border-dashed border-[#d7e9ef] rounded-2xl bg-white shadow-sm">
      <div className="w-16 h-16 bg-[#e8f7f2] text-[#15a276] rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="text-[#5f7488] font-medium">{message}</p>
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
