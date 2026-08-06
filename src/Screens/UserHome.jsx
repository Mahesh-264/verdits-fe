import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, Lightbulb, Scale, Send, X } from 'lucide-react';
import api from '../api/axios';
import AppHeader from '../components/AppHeader.jsx';

const UserHome = () => {
    const navigate = useNavigate();
    const scanInputRef = useRef(null);
    const uploadInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [selectedDocumentName, setSelectedDocumentName] = useState('');
    const [showDocumentOptions, setShowDocumentOptions] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showMyLawyers, setShowMyLawyers] = useState(false);
    const [myLawyers, setMyLawyers] = useState([]);
    const [isLoadingMyLawyers, setIsLoadingMyLawyers] = useState(false);
    const [myLawyersError, setMyLawyersError] = useState('');
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: 'Ask me anything related to law. I can explain legal sections, rights, procedures, and suggest matching lawyers when available.',
            lawyers: []
        }
    ]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

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

    const handleSendMessage = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        setMessages((prev) => [...prev, { sender: 'user', text: trimmedInput, lawyers: [] }]);
        setInput('');
        setIsLoading(true);

        try {
            const { data } = await api.post('/ai/chat', { message: trimmedInput });

            setMessages((prev) => [
                ...prev,
                {
                    sender: 'ai',
                    text: data?.reply || 'I could not process that legal query right now.',
                    lawyers: Array.isArray(data?.lawyers) ? data.lawyers : []
                }
            ]);
        } catch (error) {
            console.error('AI chat request failed:', error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'ai',
                    text: 'I could not process that legal query right now. Please try again in a moment.',
                    lawyers: []
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleOpenMyLawyers = async () => {
        setShowMyLawyers(true);
        setIsLoadingMyLawyers(true);
        setMyLawyersError('');

        try {
            const { data } = await api.get('/appointments/user/mine');
            setMyLawyers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading connected lawyers:', error);
            setMyLawyers([]);
            setMyLawyersError(error.response?.data?.message || 'Unable to load your connected lawyers right now.');
        } finally {
            setIsLoadingMyLawyers(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f8fb] pb-52">
            <AppHeader variant="user" profileTo="/profile" showBrandName />

            {/* Grid Menu */}
            <div className="mx-auto w-full max-w-md p-6 grid grid-cols-2 gap-6 mt-10">

                {/* Book a Lawyer */}
                <div
                    onClick={() => navigate('/book-lawyer')}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-[#d7e9ef] flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-[#062552]/30 transition text-center"
                >
                    <div className="user-home-icon h-14 w-14 rounded-full flex items-center justify-center shrink-0 shadow-inner">
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
                    className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition text-center border border-[#d7e9ef] hover:border-[#15a276]/40"
                >
                    <div className="user-home-icon h-14 w-14 rounded-full flex items-center justify-center shrink-0 shadow-inner">
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
                    className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition text-center border border-[#d7e9ef] hover:border-[#15a276]/40"
                >
                    <div className="user-home-icon h-14 w-14 rounded-full flex items-center justify-center">
                        <Lightbulb size={28} />
                    </div>
                    <span className="font-medium text-gray-800 text-center">Know Your Document</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                        {selectedDocumentName || 'Open camera to upload document'}
                    </span>
                </div>

                {/* My Lawyers */}
                <button
                    type="button"
                    onClick={handleOpenMyLawyers}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-[#d7e9ef] flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-[#062552]/30 transition"
                >
                    <div className="user-home-icon h-14 w-14 rounded-full flex items-center justify-center">
                        <Scale size={28} />
                    </div>
                    <span className="font-medium text-gray-800">My Lawyers</span>
                    <span className="text-[10px] text-gray-500 font-medium">Your accepted appointments</span>
                </button>

            </div>

            <div className="mx-auto w-full max-w-md px-4 mt-2">
                <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-4 space-y-3 max-h-[360px] overflow-y-auto">
                    {messages.map((message, index) => {
                        const isUser = message.sender === 'user';

                        return (
                            <div
                                key={`${message.sender}-${index}`}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[88%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                    <div
                                        className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser ? 'bg-[#f1d15f] text-[#062552] rounded-br-md' : 'bg-[#eef7f4] text-gray-800 rounded-bl-md'}`}
                                    >
                                        {message.text}
                                    </div>

                                    {!isUser && Array.isArray(message.lawyers) && message.lawyers.length > 0 && (
                                        <div className="w-full space-y-2">
                                            {message.lawyers.map((lawyer) => (
                                                <div key={lawyer._id} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                                                    <p className="font-semibold text-gray-900">{lawyer.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{lawyer.specialization}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/lawyer-profile/${lawyer._id}`)}
                                                        className="mt-3 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-4 py-2 text-sm font-bold border border-[#d6b85b] shadow-sm transition"
                                                    >
                                                        Book Appointment
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm text-gray-600 shadow-sm">
                                AI is typing...
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
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
                                className="w-full rounded-2xl bg-[#15a276] px-4 py-4 text-left font-semibold text-white hover:bg-[#118b66] transition"
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

            {showMyLawyers && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">My Lawyers</h2>
                                <p className="mt-1 text-sm text-gray-500">Lawyers who accepted your appointments.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMyLawyers(false)}
                                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                aria-label="Close My Lawyers"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-6 max-h-[55vh] space-y-3 overflow-y-auto">
                            {isLoadingMyLawyers ? (
                                <p className="py-8 text-center text-sm text-gray-500">Loading your lawyers...</p>
                            ) : myLawyersError ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-red-600">{myLawyersError}</p>
                                    <div className="mt-4 flex justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleOpenMyLawyers}
                                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                                        >
                                            Retry
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/book-lawyer')}
                                            className="rounded-xl bg-[#f1d15f] px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-[#d6a400]"
                                        >
                                            Connect with Lawyer
                                        </button>
                                    </div>
                                </div>
                            ) : myLawyers.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-base font-semibold text-gray-900">Please connect to a lawyer.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/book-lawyer')}
                                        className="mt-4 rounded-xl bg-[#f1d15f] px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-[#d6a400]"
                                    >
                                        Connect with Lawyer
                                    </button>
                                </div>
                            ) : (
                                myLawyers.map((appointment) => {
                                    const lawyer = appointment.lawyerId || {};
                                    const lawyerName = `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim() || lawyer.name || 'Lawyer';
                                    const specialization = lawyer.lawyerProfile?.specialization || 'Legal professional';

                                    return (
                                        <button
                                            key={appointment._id}
                                            type="button"
                                            onClick={() => navigate(`/lawyer-profile/${lawyer._id}`)}
                                            className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[#15a276] hover:shadow-md"
                                        >
                                            <p className="font-semibold text-gray-900">{lawyerName}</p>
                                            <p className="mt-1 text-sm text-gray-500">{specialization}</p>
                                            <p className="mt-2 text-xs font-medium text-[#15a276]">Appointment accepted</p>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Bot Input Area */}
            <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-[#062552] p-4 rounded-t-3xl">
                <h3 className="text-white text-sm mb-2 font-semibold">AI Legal Chat Bot</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Ask a question about law"
                        className="w-full p-3 rounded-xl bg-white text-gray-800 outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="h-12 w-12 rounded-xl bg-[#15a276] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserHome;
