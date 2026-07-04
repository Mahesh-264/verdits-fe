import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { DOCUMENT_TYPES } from '../constants/documentTypes';
import { useDocumentGenerator } from '../hooks/useDocumentGenerator';
import { useAppointmentRequest } from '../hooks/useAppointmentRequest';

// Components
import PageHeader from '../components/PageHeader';
import ProfileHeader from '../components/ProfileHeader';
import StatsSection from '../components/StatsSection';
import AboutSection from '../components/AboutSection';
import CredentialsSection from '../components/CredentialsSection';
import DocumentGeneratorButton from '../components/DocumentGeneratorButton';
import DocumentTypeSelector from '../components/DocumentTypeSelector';
import DocumentQuestionForm from '../components/DocumentQuestionForm';
import DocumentDisplay from '../components/DocumentDisplay';
import AppointmentActions from '../components/AppointmentActions';
import { LoadingState, ErrorState } from '../components/StateComponents';

const LawyerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);

    // Custom hooks
    const documentGenerator = useDocumentGenerator();
    const appointmentRequest = useAppointmentRequest(lawyer, user?.role === 'user' ? user : null);
    const profile = useMemo(() => lawyer?.lawyerProfile || {}, [lawyer]);

    // Fetch lawyer data
    useEffect(() => {
        const fetchLawyer = async () => {
            try {
                const res = await api.get(`/auth/lawyers/${id}`);
                setLawyer(res.data);
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
            navigate('/chat', { state: { selectedPartner: lawyer } });
        } else {
            console.log('Initiating', type);
        }
    }, [lawyer, navigate]);

    const handleDocGenOpen = useCallback(() => {
        documentGenerator.openDocGenerator();
    }, [documentGenerator]);

    const handleSelectDocType = useCallback((docType) => {
        documentGenerator.selectDocType(docType);
    }, [documentGenerator]);

    const handleAnswerChange = useCallback((value) => {
        const currentQuestion = documentGenerator.selectedDocType?.questions[documentGenerator.currentQuestionIndex];
        if (currentQuestion) {
            documentGenerator.updateAnswer(currentQuestion.id, value);
        }
    }, [documentGenerator]);

    const handleCloseDocTypeSelector = useCallback(() => {
        documentGenerator.setShowDocGenerator(false);
        documentGenerator.setDocTypeSearch('');
    }, [documentGenerator]);

    const handleCloseDocForm = useCallback(() => {
        documentGenerator.selectDocType(null);
    }, [documentGenerator]);

    const handleCloseDocDisplay = useCallback(() => {
        documentGenerator.closeDocument();
    }, [documentGenerator]);

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

            <DocumentGeneratorButton onOpen={handleDocGenOpen} />

            <StatsSection profile={profile} />

            <AboutSection profile={profile} />

            <CredentialsSection profile={profile} />

            {/* Document Generator Modals */}
            <DocumentTypeSelector
                isOpen={documentGenerator.showDocGenerator && !documentGenerator.selectedDocType && !documentGenerator.generatedDocument}
                searchQuery={documentGenerator.docTypeSearch}
                onSearchChange={documentGenerator.setDocTypeSearch}
                documentTypes={DOCUMENT_TYPES}
                onSelectDocType={handleSelectDocType}
                onClose={handleCloseDocTypeSelector}
            />

            <DocumentQuestionForm
                isOpen={Boolean(documentGenerator.selectedDocType && !documentGenerator.generatedDocument)}
                selectedDocType={documentGenerator.selectedDocType}
                currentQuestionIndex={documentGenerator.currentQuestionIndex}
                answers={documentGenerator.answers}
                error={documentGenerator.generationError}
                isGenerating={documentGenerator.isGenerating}
                onAnswerChange={handleAnswerChange}
                onNext={documentGenerator.goToNextQuestion}
                onPrevious={documentGenerator.goToPreviousQuestion}
                onClose={handleCloseDocForm}
            />

            <DocumentDisplay
                isOpen={Boolean(documentGenerator.generatedDocument)}
                document={documentGenerator.generatedDocument}
                onClose={handleCloseDocDisplay}
                onCreateAnother={documentGenerator.startNewDocument}
            />

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
