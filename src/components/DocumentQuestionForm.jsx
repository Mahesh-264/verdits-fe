import React, { useMemo } from 'react';
import { X, ChevronRight } from 'lucide-react';

const DocumentQuestionForm = React.memo(({
    isOpen,
    selectedDocType,
    currentQuestionIndex,
    answers,
    error,
    isGenerating,
    onAnswerChange,
    onNext,
    onPrevious,
    onClose
}) => {
    const currentQuestion = useMemo(() => {
        if (!selectedDocType || !selectedDocType.questions[currentQuestionIndex]) {
            return null;
        }
        return selectedDocType.questions[currentQuestionIndex];
    }, [selectedDocType, currentQuestionIndex]);

    const isLastQuestion = useMemo(() => {
        return selectedDocType && currentQuestionIndex === selectedDocType.questions.length - 1;
    }, [selectedDocType, currentQuestionIndex]);

    const progressPercentage = useMemo(() => {
        if (!selectedDocType) return 0;
        return ((currentQuestionIndex + 1) / selectedDocType.questions.length) * 100;
    }, [selectedDocType, currentQuestionIndex]);

    if (!isOpen || !selectedDocType || !currentQuestion) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{selectedDocType.name}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Question {currentQuestionIndex + 1} of {selectedDocType.questions.length}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-200">
                    <div
                        className="h-full bg-[#15a276] transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                {/* Question Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                            {currentQuestion.label}
                            {currentQuestion.required && <span className="text-red-500">*</span>}
                        </label>

                        {currentQuestion.type === 'textarea' ? (
                            <textarea
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => onAnswerChange(e.target.value)}
                                placeholder="Enter your answer here..."
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#15a276] min-h-[150px] resize-none"
                            />
                        ) : (
                            <input
                                type="text"
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => onAnswerChange(e.target.value)}
                                placeholder="Enter your answer here..."
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#15a276]"
                            />
                        )}

                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onPrevious}
                            disabled={currentQuestionIndex === 0}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-lg transition"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={isGenerating}
                            className="flex-1 bg-[#15a276] hover:bg-[#118b66] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Generating...
                                </>
                            ) : isLastQuestion ? (
                                <>
                                    Generate <ChevronRight size={18} />
                                </>
                            ) : (
                                <>
                                    Next <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

DocumentQuestionForm.displayName = 'DocumentQuestionForm';

export default DocumentQuestionForm;
