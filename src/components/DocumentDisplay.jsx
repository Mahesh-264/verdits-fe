import React, { useCallback } from 'react';
import { X, Download, Copy } from 'lucide-react';
import { downloadDocument, copyToClipboard } from '../utils/lawyerProfileHelpers';

const DocumentDisplay = React.memo(({
    isOpen,
    document,
    onClose,
    onCreateAnother
}) => {
    const handleDownload = useCallback(() => {
        if (document?.content) {
            downloadDocument(document.content, document.type);
        }
    }, [document]);

    const handleCopy = useCallback(async () => {
        if (document?.content) {
            const success = await copyToClipboard(document.content);
            if (success) {
                alert('Document copied to clipboard!');
            }
        }
    }, [document]);

    if (!isOpen || !document) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Document Generated</h2>
                        <p className="text-xs text-gray-500 mt-1">{document.type}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="sticky top-14 bg-gray-50 border-b border-gray-200 p-4 flex gap-3 z-10">
                    <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#15a276] hover:bg-[#118b66] text-white font-bold py-2 rounded-lg transition"
                        aria-label="Download document"
                    >
                        <Download size={18} />
                        Download
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 rounded-lg transition"
                        aria-label="Copy document"
                    >
                        <Copy size={18} />
                        Copy
                    </button>
                </div>

                {/* Document Content */}
                <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed max-h-96 overflow-y-auto">
                        {document.content}
                    </div>
                </div>

                {/* Create Another Button */}
                <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
                    <button
                        onClick={onCreateAnother}
                        className="w-full bg-[#062552] hover:bg-[#0b3b70] text-white font-bold py-3 rounded-lg transition"
                    >
                        Create Another Document
                    </button>
                </div>
            </div>
        </div>
    );
});

DocumentDisplay.displayName = 'DocumentDisplay';

export default DocumentDisplay;
