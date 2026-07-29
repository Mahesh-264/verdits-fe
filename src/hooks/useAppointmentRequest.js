import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { normalizeStatus, getAppointmentUserId } from '../utils/lawyerProfileHelpers';

export const useAppointmentRequest = (lawyer, user) => {
    const [requestStatus, setRequestStatus] = useState(null);
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadExistingRequest = async () => {
            if (!lawyer || !user) {
                setLoading(false);
                return;
            }

            try {
                const lawyerId = lawyer._id || lawyer.id || lawyer?._doc?._id;
                const userId = user._id || user.id;
                const { data } = await api.get(`/appointments/${lawyerId}`);
                const existing = data.find(
                    appointment => String(getAppointmentUserId(appointment)) === String(userId)
                );

                setRequestStatus(existing ? normalizeStatus(existing.status) : null);
            } catch (error) {
                console.error('Error fetching appointment status:', error);
            } finally {
                setLoading(false);
            }
        };

        loadExistingRequest();
    }, [lawyer, user]);

    const sendRequest = useCallback(async () => {
        if (!lawyer || !user || isSendingRequest) return;

        try {
            setIsSendingRequest(true);

            const lawyerId = lawyer._id || lawyer.id || lawyer?._doc?._id;
            if (!lawyerId) {
                alert('The lawyer profile is missing its ID. Please refresh the page and try again.');
                return;
            }
            const { data } = await api.post('/appointments', { lawyerId });

            setRequestStatus(normalizeStatus(data?.status) || 'Pending');
        } catch (error) {
            console.error('Error sending appointment request:', error);
            alert(error.response?.data?.message || 'Failed to send appointment request');
        } finally {
            setIsSendingRequest(false);
        }
    }, [lawyer, user, isSendingRequest]);

    return {
        requestStatus,
        isSendingRequest,
        loading,
        sendRequest
    };
};
