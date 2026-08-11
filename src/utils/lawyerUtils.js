export const normalizeStatus = (status) => {
  const formattedStatus = String(status || '').toLowerCase();

  if (formattedStatus === 'pending') return 'Pending';
  if (formattedStatus === 'accepted') return 'Accepted';
  if (formattedStatus === 'rejected') return 'Rejected';

  return status || 'Pending';
};

export const getUserName = (appointmentUser) => {
  if (!appointmentUser) return 'Client';

  const fullName = `${appointmentUser.firstName || ''} ${appointmentUser.lastName || ''}`.trim();
  return fullName || appointmentUser.name || appointmentUser.phone || 'Client';
};

export const applicantFilters = ['All', 'Pending', 'Accepted', 'Rejected'];
export const participantFilters = ['All', 'Joined'];

export const statCards = [
  { key: 'totalInternshipsPosted', label: 'Total internships posted', accent: 'text-[#19b98d]' },
  { key: 'activeInternships', label: 'Active internships', accent: 'text-emerald-400' },
  { key: 'totalApplicants', label: 'Total applicants', accent: 'text-cyan-400' },
  { key: 'totalJamSessions', label: 'Total jam sessions', accent: 'text-purple-400' },
  { key: 'totalParticipants', label: 'Total participants', accent: 'text-pink-400' },
];

export const initialStats = {
  totalInternshipsPosted: 0,
  activeInternships: 0,
  totalApplicants: 0,
  totalJamSessions: 0,
  totalParticipants: 0,
};

export const emptyDrawerState = {
  open: false,
  type: 'applicants',
  title: '',
  parentId: '',
  parentLabel: '',
  items: [],
};

export const initialCreateTeamForm = {
  firmName: '',
  seniorLawyerName: '',
  maxTeamSize: 5,
};

export const initialJoinTeamForm = {
  teamCode: '',
};

export const initialTeamCaseForm = {
  clientName: '',
  clientPhone: '',
  clientAddress: '',
  caseName: '',
  courtName: '',
  startingDate: '',
  hearingDate: '',
  hearingTime: '',
  briefInfo: '',
  status: 'new',
};

export const teamCaseStatuses = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'hearing_scheduled', label: 'Hearing Scheduled' },
  { value: 'closed', label: 'Closed' },
];

export const getTeamCaseStatusLabel = (status) => (
  teamCaseStatuses.find((item) => item.value === status)?.label || 'New'
);

export const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return String(value._id || value.id || value.lawyerId || '').trim();
  }
  return String(value).trim();
};

export const isSameId = (id1, id2) => {
  const s1 = getEntityId(id1);
  const s2 = getEntityId(id2);
  return Boolean(s1 && s2 && s1 === s2);
};

export const normalizeLawyerName = (name) => (
  String(name || '')
    .replace(/^(adv\.?|advocate|mr\.?|dr\.?)\s+/i, '')
    .replace(/\s*\(you\)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
);

export const getLawyerDisplayName = (lawyer) => {
  const fullName = `${lawyer?.firstName || ''} ${lawyer?.lastName || ''}`.trim();
  return fullName || lawyer?.name || lawyer?.phone || 'Lawyer';
};

export const noticeDocumentTypes = [
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

export const commonNoticeFields = [
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

export const noticeTypeFields = {
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

export const additionalNoticeFields = [
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

export const initialNoticeForm = {
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

export const getNoticeFields = (documentType) => [
  ...commonNoticeFields,
  ...(noticeTypeFields[documentType] || []),
  ...additionalNoticeFields,
];

export const isNoticeFieldFilled = (field, form) => {
  if (field.type === 'checkbox') return true;
  if (field.type === 'names') {
    return (form[field.id] || []).some((value) => String(value || '').trim());
  }
  return Boolean(String(form[field.id] || '').trim());
};

export const formatNoticeDetails = (documentType, form) => {
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

export const getNoticeRequestError = (error, fallbackMessage) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Unable to reach the server. Please check your connection and try again.';
  return fallbackMessage;
};

export function normalizeExternalUrl(url) {
  return String(url || '').startsWith('http') ? url : `https://${url}`;
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
}

export function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
}

export function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function toTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('hour')}:${part('minute')}`;
}

export function capitalize(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
