import React, { useCallback } from 'react';
import { FileText, ChevronRight } from 'lucide-react';

const DocumentGeneratorButton = React.memo(({ onOpen }) => {
    const handleClick = useCallback(() => {
        onOpen();
    }, [onOpen]);

    return (
        <button
            onClick={handleClick}
            className="w-full max-w-md bg-white mt-2 p-4 shadow-sm hover:shadow-md transition flex items-center gap-3 border-b border-gray-100"
        >
            <FileText className="text-[#15a276] shrink-0" size={24} />
            <div className="text-left flex-1">
                <h4 className="font-bold text-gray-900">Document Generator</h4>
                <p className="text-xs text-gray-500">Create legal documents with AI assistance</p>
            </div>
            <ChevronRight className="text-gray-400 shrink-0" size={20} />
        </button>
    );
});

DocumentGeneratorButton.displayName = 'DocumentGeneratorButton';

export default DocumentGeneratorButton;
