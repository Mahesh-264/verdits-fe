import React, { useMemo } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';

const DocumentTypeSelector = React.memo(({
    isOpen,
    searchQuery,
    onSearchChange,
    documentTypes,
    onSelectDocType,
    onClose
}) => {
    const filteredDocTypes = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return documentTypes.filter(doc =>
            doc.name.toLowerCase().includes(query) ||
            doc.description.toLowerCase().includes(query) ||
            doc.category.toLowerCase().includes(query)
        );
    }, [searchQuery, documentTypes]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900">Select Document Type</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15a276]"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Document Types List */}
                <div className="p-4 space-y-3">
                    {filteredDocTypes.length > 0 ? (
                        filteredDocTypes.map((docType) => (
                            <button
                                key={docType.id}
                                onClick={() => onSelectDocType(docType)}
                                className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg p-4 transition flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="font-bold text-gray-900">{docType.name}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{docType.description}</p>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded mt-2 inline-block">
                                        {docType.questions.length} questions
                                    </span>
                                </div>
                                <ChevronRight className="text-gray-400 shrink-0" size={20} />
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No documents found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

DocumentTypeSelector.displayName = 'DocumentTypeSelector';

export default DocumentTypeSelector;
