import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { useAppointmentRequest } from '../hooks/useAppointmentRequest';

// Components
import PageHeader from '../components/PageHeader';
import ProfileHeader from '../components/ProfileHeader';
import AboutSection from '../components/AboutSection';
import CredentialsSection from '../components/CredentialsSection';
import AppointmentActions from '../components/AppointmentActions';
import { LoadingState, ErrorState } from '../components/StateComponents';

const LawyerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);

    // Custom hooks
    const appointmentRequest = useAppointmentRequest(lawyer, user?.role === 'user' ? user : null);
    const profile = useMemo(() => lawyer?.lawyerProfile || {}, [lawyer]);

    // Fetch lawyer data
    useEffect(() => {
        const fetchLawyer = async () => {
            try {
                const res = await api.get(`/auth/lawyers/${id}`);
                // Supports profile responses produced before the backend
                // sends lean/plain objects, while using the normal response
                // shape for all new requests.
                setLawyer(res.data?._doc || res.data);
            } catch (error) {
                console.error('Error fetching lawyer:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLawyer();
    }, [id]);

    const handleConnect = useCallback((type) => {
        if (type === 'chat') {
            const partnerId = lawyer?._id || lawyer?.id;
            if (!partnerId) return;

            navigate(`/chat?partnerId=${encodeURIComponent(partnerId)}`, {
                state: { selectedPartner: lawyer, returnTo: `/lawyer-profile/${id}` },
            });
        } else {
            console.log('Initiating', type);
        }
    }, [id, lawyer, navigate]);

    // Loading and error states
    if (loading) {
        return <LoadingState />;
    }

    if (!lawyer) {
        return <ErrorState />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-32 relative">
            <PageHeader />

            <ProfileHeader lawyer={lawyer} profile={profile} />

            <AboutSection profile={profile} />

            <CredentialsSection profile={profile} />

            {user?.role === 'user' ? (
                <AppointmentActions
                    requestStatus={appointmentRequest.requestStatus}
                    isSendingRequest={appointmentRequest.isSendingRequest}
                    onSendRequest={appointmentRequest.sendRequest}
                    onConnect={handleConnect}
                />
            ) : null}
        </div>
    );
};

export default LawyerProfile;
