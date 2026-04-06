import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, Lightbulb, MoreHorizontal, User } from 'lucide-react';

const UserHome = () => {
    const navigate = useNavigate();
    const scanInputRef = useRef(null);
    const uploadInputRef = useRef(null);
    const [selectedDocumentName, setSelectedDocumentName] = useState('');
    const [showDocumentOptions, setShowDocumentOptions] = useState(false);

    const handleDocumentCardClick = () => {
        setShowDocumentOptions(true);
    };

    const handleDocumentSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedDocumentName(file.name);
        setShowDocumentOptions(false);
    };

    const handleScanDocument = () => {
        scanInputRef.current?.click();
    };

    const handleUploadDocument = () => {
        uploadInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-black text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-8" /> {/* Add your logo */}
                    <span className="text-xl font-bold tracking-wide">Nyaya Setu</span>
                </div>
                <User className="h-6 w-6" onClick={() => navigate('/profile')} />
            </div>

            {/* Grid Menu */}
            <div className="w-full max-w-md p-6 grid grid-cols-2 gap-6 mt-10">

                {/* Book a Lawyer */}
                <div
                    onClick={() => navigate('/book-lawyer')}
                    className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition text-center"
                >
                    <div className="h-14 w-14 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <span className="font-bold text-gray-800 block">Book a Lawyer</span>
                        <span className="text-[10px] text-gray-500 font-medium mt-1">Appt requests, calls & chat</span>
                    </div>
                </div>

                {/* Consult a Lawyer */}
                <div 
                    onClick={() => navigate('/instant-consult')}
                    className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition text-center border border-transparent hover:border-green-200"
                >
                    <div className="h-14 w-14 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner">
                        <MessageSquare size={28} />
                    </div>
                    <div>
                        <span className="font-bold text-gray-800 block">Consult a Lawyer</span>
                        <span className="text-[10px] text-gray-500 font-medium mt-1">Online lawyers for instant consult</span>
                    </div>
                </div>

                {/* Know Your Document */}
                <div
                    onClick={handleDocumentCardClick}
                    className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition text-center border border-transparent hover:border-yellow-200"
                >
                    <div className="h-14 w-14 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                        <Lightbulb size={28} />
                    </div>
                    <span className="font-medium text-gray-800 text-center">Know Your Document</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                        {selectedDocumentName || 'Open camera to upload document'}
                    </span>
                </div>

                {/* Other */}
                <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition">
                    <div className="h-14 w-14 bg-purple-500 rounded-full flex items-center justify-center text-white">
                        <MoreHorizontal size={28} />
                    </div>
                    <span className="font-medium text-gray-800">Other</span>
                </div>

            </div>

            <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleDocumentSelect}
                className="hidden"
            />

            <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleDocumentSelect}
                className="hidden"
            />

            {showDocumentOptions && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900">Know Your Document</h2>
                        <p className="mt-2 text-sm text-gray-500">Choose how you want to continue.</p>

                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={handleScanDocument}
                                className="w-full rounded-2xl bg-yellow-500 px-4 py-4 text-left font-semibold text-white hover:bg-yellow-600 transition"
                            >
                                Scan your document
                            </button>

                            <button
                                type="button"
                                onClick={handleUploadDocument}
                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition"
                            >
                                Upload your document
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowDocumentOptions(false)}
                            className="mt-4 w-full rounded-2xl bg-gray-100 px-4 py-3 font-medium text-gray-600 hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Bot Input Area (Visual Only as per image) */}
            <div className="w-full max-w-md fixed bottom-0 bg-black p-4 rounded-t-3xl">
                <h3 className="text-white text-sm mb-2 font-semibold">AI Legal Chat Bot</h3>
                <input
                    type="text"
                    placeholder="Ask a legal question"
                    className="w-full p-3 rounded-xl bg-white text-gray-800 outline-none"
                />
            </div>
        </div>
    );
};

export default UserHome;
