// Document types configuration with categories and questions
export const DOCUMENT_TYPES = [
    {
        id: 'legal_notice',
        name: 'Legal Notice',
        category: 'notices',
        description: 'Formal notice to any person or entity',
        questions: [
            { id: 'recipient_name', label: 'Recipient Name', type: 'text', required: true },
            { id: 'recipient_address', label: 'Recipient Address', type: 'textarea', required: true },
            { id: 'reason', label: 'Reason for Notice', type: 'textarea', required: true },
            { id: 'issue_description', label: 'Detailed Issue Description', type: 'textarea', required: true },
            { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: true }
        ]
    },
    {
        id: 'demand_letter',
        name: 'Demand Letter',
        category: 'letters',
        description: 'Letter demanding payment or action',
        questions: [
            { id: 'recipient_name', label: 'Recipient Name', type: 'text', required: true },
            { id: 'recipient_address', label: 'Recipient Address', type: 'textarea', required: true },
            { id: 'demand_amount', label: 'Amount Demanded (if any)', type: 'text', required: false },
            { id: 'reason', label: 'Reason for Demand', type: 'textarea', required: true },
            { id: 'timeline', label: 'Timeline for Compliance', type: 'text', required: true }
        ]
    },
    {
        id: 'rent_agreement',
        name: 'Rent Agreement',
        category: 'agreements',
        description: 'Property rental agreement',
        questions: [
            { id: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
            { id: 'tenant_name', label: 'Tenant Name', type: 'text', required: true },
            { id: 'property_details', label: 'Property Details', type: 'textarea', required: true },
            { id: 'monthly_rent', label: 'Monthly Rent Amount', type: 'text', required: true },
            { id: 'lease_period', label: 'Lease Period (in months)', type: 'text', required: true },
            { id: 'deposit_amount', label: 'Security Deposit Amount', type: 'text', required: true }
        ]
    },
    {
        id: 'employment_agreement',
        name: 'Employment Agreement',
        category: 'agreements',
        description: 'Employment contract',
        questions: [
            { id: 'employer_name', label: 'Employer Name', type: 'text', required: true },
            { id: 'employee_name', label: 'Employee Name', type: 'text', required: true },
            { id: 'position', label: 'Position/Designation', type: 'text', required: true },
            { id: 'salary', label: 'Salary Package', type: 'text', required: true },
            { id: 'responsibilities', label: 'Key Responsibilities', type: 'textarea', required: true },
            { id: 'duration', label: 'Employment Duration', type: 'text', required: true }
        ]
    },
    {
        id: 'separation_agreement',
        name: 'Separation Agreement',
        category: 'family',
        description: 'Mutual separation agreement',
        questions: [
            { id: 'party1_name', label: 'First Party Name', type: 'text', required: true },
            { id: 'party2_name', label: 'Second Party Name', type: 'text', required: true },
            { id: 'marriage_date', label: 'Marriage Date', type: 'text', required: true },
            { id: 'separation_reason', label: 'Reason for Separation', type: 'textarea', required: true },
            { id: 'custody_arrangement', label: 'Custody Arrangement (if children)', type: 'textarea', required: false },
            { id: 'asset_division', label: 'Asset Division Terms', type: 'textarea', required: true }
        ]
    },
    {
        id: 'non_disclosure',
        name: 'Non-Disclosure Agreement',
        category: 'agreements',
        description: 'Confidentiality agreement',
        questions: [
            { id: 'party1_name', label: 'Disclosing Party Name', type: 'text', required: true },
            { id: 'party2_name', label: 'Receiving Party Name', type: 'text', required: true },
            { id: 'confidential_info', label: 'Type of Confidential Information', type: 'textarea', required: true },
            { id: 'duration', label: 'Confidentiality Duration (in years)', type: 'text', required: true },
            { id: 'consequences', label: 'Consequences of Breach', type: 'textarea', required: true }
        ]
    }
];

export const STATUS_MAP = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected'
};

export const CONSULTATION_RATES = {
    call: { icon: 'Phone', price: '₹15/min', label: 'Call' },
    chat: { icon: 'MessageSquare', price: 'Free', label: 'Chat' }
};
