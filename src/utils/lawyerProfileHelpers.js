// Utility helper functions
export const normalizeStatus = (status) => {
    if (!status) return null;
    const formattedStatus = String(status).toLowerCase();
    return {
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected'
    }[formattedStatus] || status;
};

export const getAppointmentUserId = (appointment) => 
    appointment?.userId?._id || appointment?.userId;

export const downloadDocument = (content, fileName) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
};

export const validateAnswer = (answer, isRequired) => {
    if (!isRequired) return true;
    return Boolean(answer?.trim?.());
};

export const formatDocumentDetails = (questions, answers) => {
    return questions
        .map(q => `${q.label}: ${answers[q.id] || 'N/A'}`)
        .join('\n\n');
};

export const getProfileImageUrl = (lawyer) => {
    return lawyer?.profileImage || '';
};

export const extractInitials = (name) => {
    return name?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U';
};
