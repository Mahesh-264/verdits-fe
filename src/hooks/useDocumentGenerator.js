import { useState, useCallback } from 'react';
import api from '../api/axios';
import { formatDocumentDetails, validateAnswer } from '../utils/lawyerProfileHelpers';

export const useDocumentGenerator = () => {
    const [showDocGenerator, setShowDocGenerator] = useState(false);
    const [docTypeSearch, setDocTypeSearch] = useState('');
    const [selectedDocType, setSelectedDocType] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDocument, setGeneratedDocument] = useState(null);
    const [generationError, setGenerationError] = useState('');

    const resetDocumentGenerator = useCallback(() => {
        setShowDocGenerator(false);
        setDocTypeSearch('');
        setSelectedDocType(null);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setGeneratedDocument(null);
        setGenerationError('');
    }, []);

    const openDocGenerator = useCallback(() => {
        setShowDocGenerator(true);
        setDocTypeSearch('');
        setGeneratedDocument(null);
    }, []);

    const selectDocType = useCallback((docType) => {
        setSelectedDocType(docType);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setGenerationError('');
    }, []);

    const updateAnswer = useCallback((questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    }, []);

    const generateDocument = useCallback(async () => {
        if (!selectedDocType) return;

        try {
            setIsGenerating(true);
            setGenerationError('');

            const details = formatDocumentDetails(selectedDocType.questions, answers);

            const response = await api.post('/ai/notice/generate', {
                documentType: selectedDocType.name,
                details
            });

            if (response.data?.draft) {
                setGeneratedDocument({
                    type: selectedDocType.name,
                    content: response.data.draft,
                    timestamp: new Date().toLocaleString()
                });
                setSelectedDocType(null);
                setAnswers({});
            } else {
                setGenerationError('Failed to generate document');
            }
        } catch (error) {
            console.error('Document generation error:', error);
            setGenerationError(
                error.response?.data?.message || 'Failed to generate document. Please try again.'
            );
        } finally {
            setIsGenerating(false);
        }
    }, [selectedDocType, answers]);

    const goToNextQuestion = useCallback(() => {
        if (!selectedDocType) return;

        const currentQuestion = selectedDocType.questions[currentQuestionIndex];

        if (!validateAnswer(answers[currentQuestion.id], currentQuestion.required)) {
            setGenerationError(`${currentQuestion.label} is required`);
            return;
        }

        setGenerationError('');

        if (currentQuestionIndex < selectedDocType.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            generateDocument();
        }
    }, [selectedDocType, currentQuestionIndex, answers, generateDocument]);

    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setGenerationError('');
        }
    }, [currentQuestionIndex]);

    const closeDocument = useCallback(() => {
        setGeneratedDocument(null);
        setShowDocGenerator(false);
    }, []);

    const startNewDocument = useCallback(() => {
        setGeneratedDocument(null);
        setShowDocGenerator(true);
        setDocTypeSearch('');
    }, []);

    return {
        // State
        showDocGenerator,
        docTypeSearch,
        selectedDocType,
        currentQuestionIndex,
        answers,
        isGenerating,
        generatedDocument,
        generationError,

        // Actions
        openDocGenerator,
        resetDocumentGenerator,
        selectDocType,
        updateAnswer,
        goToNextQuestion,
        goToPreviousQuestion,
        generateDocument,
        closeDocument,
        startNewDocument,
        setDocTypeSearch,
        setGeneratedDocument
    };
};
