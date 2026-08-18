import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    fetchConversations, fetchHistory, setActivePartner,
    receiveMessage, fetchAllLawyers, markMessagesAsRead,
    deleteBatchMessages, toggleMessageSelection,
    clearSelection, removeMessageLocally, sendMediaMessage
} from '../redux/chatSlice';
import api from '../api/axios';
import globalSocket from '../utils/socket.jsx';
import useSessionLogout from '../hooks/useSessionLogout';
import {
    FaEllipsisV, FaPaperPlane, FaTimes, FaPhone, FaVideo, FaCommentDots,
    FaPaperclip, FaSignOutAlt, FaSearch, FaCheckDouble,
    FaTrash, FaMicrophone, FaCheckCircle, FaCircle, FaStop, FaExternalLinkAlt, FaArrowLeft,
    FaFileAlt, FaFilePdf, FaDownload
} from 'react-icons/fa';

const hasAcceptedAppointment = (appointments, lawyerId, clientId) =>
    appointments.some((appointment) =>
        String(appointment.lawyerId?._id || appointment.lawyerId) === String(lawyerId) &&
        String(appointment.userId?._id || appointment.userId) === String(clientId) &&
        String(appointment.status).toLowerCase() === 'accepted'
    );

const getAppointmentStatus = (appointments, lawyerId, clientId) => {
    const matchedAppointment = appointments.find((appointment) =>
        String(appointment.lawyerId?._id || appointment.lawyerId) === String(lawyerId) &&
        String(appointment.userId?._id || appointment.userId) === String(clientId)
    );

    return String(matchedAppointment?.status || '').toLowerCase();
};

const getParticipantName = (participant) => {
    if (!participant) return 'Contact';
    const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (participant.name) return participant.name;
    return String(participant.role || '').toLowerCase() === 'lawyer' ? 'Lawyer' : (participant.phone || 'Client');
};

const getMessageDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const isSameDay = (first, second) =>
    first?.getFullYear() === second?.getFullYear() &&
    first?.getMonth() === second?.getMonth() &&
    first?.getDate() === second?.getDate();

const formatConversationTimestamp = (value) => {
    const date = getMessageDate(value);
    if (!date) return '';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (isSameDay(date, yesterday)) {
        return 'Yesterday';
    }

    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const formatMessageTimestamp = (value) => {
    const date = getMessageDate(value);
    if (!date) return '';

    return date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatMessageDateLabel = (value) => {
    const date = getMessageDate(value);
    if (!date) return '';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';

    return date.toLocaleDateString([], {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getAttachmentType = (file) => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'document';
};

export default function Chat() {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const { user } = useSelector(state => state.auth);
    const { conversations, availableLawyers, messages, activePartner, selectedMessages } = useSelector(state => state.chat);
    const lawyerList = useMemo(
        () => (Array.isArray(availableLawyers) ? availableLawyers : []),
        [availableLawyers]
    );
    const handleLogout = useSessionLogout(user?.role);
    const [lockedPartnerId, setLockedPartnerId] = useState(
        location.state?.selectedPartner?._id || location.state?.selectedPartner?.id || searchParams.get('partnerId') || null
    );

    const [canChat, setCanChat] = useState(true);
    const [isCheckingChatAccess, setIsCheckingChatAccess] = useState(false);
    const [appointmentStatus, setAppointmentStatus] = useState('');

    useEffect(() => {
        const checkChatAccess = async () => {
            if (!activePartner || !user) {
                setCanChat(true);
                setAppointmentStatus('');
                return;
            }

            if (user.role === 'lawyer' && activePartner.role === 'lawyer') {
                setCanChat(true);
                setAppointmentStatus('');
                return;
            }

            try {
                setIsCheckingChatAccess(true);

                const userId = user._id || user.id;
                const partnerId = activePartner._id || activePartner.id;

                const isUserLawyer = user.role === 'lawyer';
                const lawyerId = isUserLawyer ? userId : partnerId;
                const clientId = isUserLawyer ? partnerId : userId;

                const { data } = await api.get(`/appointments/${lawyerId}`);
                const status = getAppointmentStatus(data, lawyerId, clientId);
                setAppointmentStatus(status);
                setCanChat(hasAcceptedAppointment(data, lawyerId, clientId));
            } catch (error) {
                console.error('Error checking appointment access:', error);
                setAppointmentStatus('');
                setCanChat(false);
            } finally {
                setIsCheckingChatAccess(false);
            }
        }

        checkChatAccess();
    }, [activePartner, user]);

    const [text, setText] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [pendingAttachment, setPendingAttachment] = useState(null);

    const socketRef = useRef(null);
    const scrollRef = useRef();
    const fileInputRef = useRef();
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const discardRecordingRef = useRef(false);

    const activePartnerRef = useRef(null);
    const userIdRef = useRef(null);

    // Keep Refs synced instantly without causing re-renders
    useEffect(() => {
        activePartnerRef.current = activePartner?._id || activePartner?.id;
    }, [activePartner]);
    useEffect(() => { userIdRef.current = user?._id || user?.id; }, [user]);

    useEffect(() => () => {
        if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    }, [pendingAttachment]);

    // 0. Handle incoming chat request from profiles
    useEffect(() => {
        if (location.state?.selectedPartner) {
            console.log("➡️ [Router] Arrived from Profile! Setting partner.");
            const selectedPartner = location.state.selectedPartner;
            setLockedPartnerId(selectedPartner._id || selectedPartner.id);
            dispatch(setActivePartner(selectedPartner));
            // Keep the partner identifier in the address bar so direct-chat
            // mode survives a browser refresh.
            navigate(`${location.pathname}${location.search}`, {
                replace: true,
                state: { returnTo: location.state.returnTo },
            });
        }
    }, [location.pathname, location.search, location.state, dispatch, navigate]);

    useEffect(() => {
        const partnerId = searchParams.get('partnerId');
        if (partnerId) {
            setLockedPartnerId(partnerId);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!lockedPartnerId) return;

        const normalizedLockedPartnerId = String(lockedPartnerId);
        const syncedPartner =
            conversations.find((conversation) => String(conversation.contact?._id || conversation._id) === normalizedLockedPartnerId)?.contact ||
            lawyerList.find((lawyer) => String(lawyer._id || lawyer.id) === normalizedLockedPartnerId);

        if (syncedPartner && String(activePartner?._id || activePartner?.id) !== normalizedLockedPartnerId) {
            dispatch(setActivePartner(syncedPartner));
        }
    }, [lockedPartnerId, conversations, lawyerList, activePartner, dispatch]);

    // 🟢 1. THE FLAWLESS SOCKET CONNECTION (React 18 Strict Mode Safe)
    useEffect(() => {
        const userId = user?._id || user?.id;

        if (!userId) return;

        // Use the global socket instance that's already connected at app startup
        if (!globalSocket.connected) {
            console.log(`🔌 [Chat] Connecting global socket...`);
            globalSocket.connect();
        }

        // Sync local ref to the global socket so handleSend can use it
        socketRef.current = globalSocket;

        // Define exactly what to do when events happen
        const onConnect = () => console.log("✅ [Chat] Socket Connected! ID:", globalSocket.id);
        const onNewMessage = (msg) => {
            console.log("📨 [Chat EVENT] Live message received:", msg);

            const currentMyId = userIdRef.current;
            dispatch(receiveMessage({ msg, myId: currentMyId }));

            const currentPartnerId = String(activePartnerRef.current);
            const senderId = String(msg.sender?._id || msg.sender?.id || msg.sender);

            if (senderId === currentPartnerId && currentPartnerId !== "undefined") {
                dispatch(markMessagesAsRead(currentPartnerId));
            }
        };
        const onMessageDeleted = (id) => dispatch(removeMessageLocally(id));
        const onDisconnect = () => console.log("🛑 [Chat] Socket Disconnected from server.");

        // Attach listeners to the global socket
        globalSocket.on("connect", onConnect);
        globalSocket.on("newMessage", onNewMessage);
        globalSocket.on("messageDeleted", onMessageDeleted);
        globalSocket.on("disconnect", onDisconnect);

        // If the socket connected incredibly fast before the listener was attached
        if (globalSocket.connected) {
            console.log("✅ [Chat] Socket Already connected! ID:", globalSocket.id);
        }

        // 🚨 CLEANUP: Do NOT disconnect the socket! Just remove the listeners.
        // This stops React from murdering the connection when you switch pages!
        return () => {
            console.log("🧹 [Chat] Component unmounting. Removing listeners (Socket stays alive).");
            globalSocket.off("connect", onConnect);
            globalSocket.off("newMessage", onNewMessage);
            globalSocket.off("messageDeleted", onMessageDeleted);
            globalSocket.off("disconnect", onDisconnect);
        };
    }, [dispatch, user?._id, user?.id]); // Stable dependency array

    // Destroy socket fully ONLY if user logs out
    useEffect(() => {
        if (!user && globalSocket.connected) {
            console.log("🚪 [Chat] User logged out. Disconnecting socket.");
            globalSocket.disconnect();
        }
    }, [user]);

    // 2. Data Fetching
    useEffect(() => {
        if (user?._id || user?.id) {
            if (user.role === 'user') dispatch(fetchAllLawyers());
            dispatch(fetchConversations());
        }
    }, [dispatch, user?._id, user?.id, user?.role]);

    // 3. Chat Switching & History Fetching
    useEffect(() => {
        const partnerId = activePartner?._id || activePartner?.id;
        if (partnerId) {
            dispatch(fetchHistory(partnerId));
            dispatch(markMessagesAsRead(partnerId));
            dispatch(clearSelection());
        }
    }, [activePartner, dispatch]);

    // 4. Scroll to Bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const renderAvatar = (partner, sizeClasses = "w-10 h-10", textClasses = "text-xl") => {
        if (partner?.profileImage) return <img src={partner.profileImage} alt="User" className={`${sizeClasses} rounded-full object-cover border-2 border-white shadow-md`} />;
        let icon = '👤';
        if (partner?.role === 'lawyer' || partner?.role === 'vendor' || partner?.role === 'doctor') icon = partner?.role === 'doctor' ? '🩺' : '⚖️';
        return <div className={`${sizeClasses} rounded-full bg-[#15a276] text-white flex items-center justify-center ${textClasses} border-2 border-white shadow-md`}>{icon}</div>;
    };

    const renderMessageText = (content) => {
        if (!content) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <div key={i} className="my-2 p-3 bg-[#f3f8fb] rounded-xl border border-[#dbe2ef] flex flex-col gap-2 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-[#e8f7f2]">
                                <FaExternalLinkAlt className="text-[#15a276] text-[10px]" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] font-bold text-[#5e6c87] uppercase tracking-wide">Web Link</span>
                                <span className="text-[12px] text-[#243b67] truncate w-44 underline">{part}</span>
                            </div>
                        </div>
                        <a href={part} target="_blank" rel="noopener noreferrer" className="chat-link-card text-center py-1.5 rounded-lg text-[11px] font-semibold transition-colors mt-1">
                            Open
                        </a>
                    </div>
                );
            }
            return part;
        });
    };

    const stageAttachment = (file) => {
        const type = getAttachmentType(file);
        const previewUrl = ['image', 'video', 'audio'].includes(type) ? URL.createObjectURL(file) : '';
        setPendingAttachment({ file, type, previewUrl });
    };

    const clearPendingAttachment = () => setPendingAttachment(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const file = new File([new Blob(audioChunksRef.current)], "voice.mp3", { type: 'audio/mpeg' });
                stream.getTracks().forEach(t => t.stop());
                if (!discardRecordingRef.current) stageAttachment(file);
                discardRecordingRef.current = false;
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) {
            console.error("Microphone permission failed:", err);
            alert("Mic required");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        discardRecordingRef.current = true;
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        clearInterval(timerRef.current);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file || !activePartner) return;
        stageAttachment(file);
    };

    const sendPendingAttachment = async () => {
        if (!pendingAttachment || !activePartner || isUploading) return;
        const formData = new FormData();
        formData.append("receiverId", activePartner._id || activePartner.id);
        formData.append("messageType", pendingAttachment.type);
        formData.append("file", pendingAttachment.file);
        try {
            setIsUploading(true);
            await dispatch(sendMediaMessage(formData)).unwrap();
            clearPendingAttachment();
        } catch (error) {
            console.error('Media upload failed:', error);
            alert('Unable to send this attachment. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!text.trim() || !activePartner) return;

        const receiverId = activePartner._id || activePartner.id;
        const content = text.trim();
        setText("");

        if (!socketRef.current || !socketRef.current.connected) {
            console.error("🚨 Socket is offline! Forcing reconnect before sending...");
            globalSocket.connect();
            socketRef.current = globalSocket;
        }

        console.log(`🚀 [Component] Emitting 'sendMessage' -> Text: "${text}"`);
        if (socketRef.current?.connected) {
            socketRef.current.emit("sendMessage", { receiverId, content, messageType: "text" });
            return;
        }

        try {
            const { data } = await api.post('/chat/send', {
                receiverId,
                content,
                messageType: 'text',
            });
            if (data?.message) {
                dispatch(receiveMessage({ msg: data.message, myId: user?._id || user?.id }));
            }
        } catch (error) {
            console.error('HTTP fallback message send failed:', error);
            setText(content);
            alert(error.response?.data?.message || 'Message failed to send. Please try again.');
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Delete ${selectedMessages.length} selected messages?`)) {
            dispatch(deleteBatchMessages(selectedMessages));
        }
    };

    let baseList = [];
    if (user?.role === 'user') {
        const activeConvos = conversations.map(c => ({
            ...(c.contact || {}), unreadCount: c.unreadCount || 0, lastMessage: c.lastMessage || 'Tap to view chat', timestamp: c.timestamp, originalId: c._id
        }));
        const activeLawyerIds = activeConvos.map(c => String(c._id));
        const remainingLawyers = lawyerList
            .filter(l => !activeLawyerIds.includes(String(l._id)))
            .map(l => ({
                ...l, unreadCount: 0, lastMessage: l.lawyerProfile?.specialization || 'Tap to start chat', timestamp: null, originalId: l._id
            }));
        baseList = [...activeConvos, ...remainingLawyers];
    } else {
        baseList = conversations.map(c => ({
            ...(c.contact || {}), unreadCount: c.unreadCount || 0, lastMessage: c.lastMessage || 'Tap to view chat', timestamp: c.timestamp, originalId: c._id
        }));
    }

    const displayList = baseList.filter(item => {
        const nameMatch = (item.name || "").toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = (item.phone || "").includes(searchTerm);
        return nameMatch || phoneMatch;
    });

    const isSelectionMode = selectedMessages.length > 0;
    const isDirectChatMode = Boolean(lockedPartnerId);
    const showAcceptedContactOptions = user?.role === 'user' && activePartner?.role === 'lawyer' && appointmentStatus === 'accepted';

    const handleContactOptionClick = (type) => {
        if (type === 'chat') return;
        alert(`${type} calling is available only after accepted appointment. Call integration is not connected yet.`);
    };

    const handleBackToPreviousPage = () => {
        navigate(location.state?.returnTo || (user?.role === 'lawyer' ? '/lawyer-dash' : '/user-home'));
    };

    return (
        <div className="chat-page flex h-screen bg-[#f3f8fb] text-[#0b1f44] overflow-hidden font-sans select-none">
            {/* SIDEBAR */}
            <div className={`w-full md:w-[30%] min-w-[320px] max-w-[420px] border-r border-[#dbe2ef] flex flex-col bg-white ${isDirectChatMode ? 'hidden' : activePartner ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-3 bg-[#062552] flex justify-between items-center border-b border-[#0b3b70]">
                    <div className="flex items-center gap-3">
                        {renderAvatar(user, "w-10 h-10", "text-lg")}
                        <div className="flex flex-col">
                            <span className="text-[15px] font-semibold text-white">{user?.name || "My Account"}</span>
                            <span className="text-[11px] text-[#8de2c6] font-medium uppercase tracking-wider">{user?.role}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-[#b8c8dc] hover:text-white p-2 transition-colors" aria-label="Log out"><FaSignOutAlt size={18} /></button>
                </div>

                <div className="p-2 border-b border-[#dbe2ef]">
                    <div className="bg-[#f3f8fb] flex items-center px-4 py-2 rounded-lg border border-[#dbe2ef] focus-within:border-[#15a276]">
                        <FaSearch className="text-[#7f8ba2] mr-4 text-sm" />
                        <input placeholder="Search or start new chat" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent text-[14px] w-full outline-none text-[#062552] placeholder-[#8a95ab]" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {displayList.map((item) => (
                        <div key={item._id || Math.random()} onClick={() => dispatch(setActivePartner(item))} className={`px-3 py-3 flex items-center gap-3 cursor-pointer transition-colors ${String(activePartner?._id || activePartner?.id) === String(item._id || item.id) ? 'bg-[#e8f7f2]' : 'hover:bg-[#f3f8fb]'}`}>
                            <div className="relative shrink-0">
                                {renderAvatar(item, "w-12 h-12", "text-2xl")}
                                {item.unreadCount > 0 && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#15a276] border-2 border-white rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0 border-b border-[#e4ebf5] pb-3 pt-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className="text-[16px] font-medium text-[#0b1f44] truncate">{getParticipantName(item)}</h4>
                                    {item.timestamp && <span className={`text-[12px] shrink-0 ${item.unreadCount > 0 ? 'text-[#15a276] font-semibold' : 'text-[#7f8ba2]'}`}>{formatConversationTimestamp(item.timestamp)}</span>}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-[13px] truncate ${item.unreadCount > 0 ? 'text-[#243b67] font-medium' : 'text-[#7f8ba2]'}`}>{item.lastMessage}</p>
                                    {item.unreadCount > 0 && <span className="bg-[#15a276] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.unreadCount}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col bg-[#f3f8fb] relative">
                {activePartner ? (
                    <>
                        {isSelectionMode && (
                            <div className="absolute top-0 left-0 w-full h-[60px] bg-[#062552] z-50 flex items-center justify-between px-6 border-b border-[#0b3b70] shadow-md">
                                <div className="flex items-center gap-6">
                                    <FaTimes className="cursor-pointer text-xl text-[#b8c8dc] hover:text-white" onClick={() => dispatch(clearSelection())} />
                                    <span className="text-white font-medium text-[16px]">{selectedMessages.length} selected</span>
                                </div>
                                <FaTrash className="cursor-pointer text-lg text-[#b8c8dc] hover:text-white transition-colors" onClick={handleDeleteSelected} />
                            </div>
                        )}

                        <div className="h-[60px] px-4 bg-[#062552] flex justify-between items-center border-l border-[#0b3b70] z-10 shadow-sm text-white">
                            <div className="flex items-center gap-3">
                                {isDirectChatMode && (
                                    <button
                                        type="button"
                                        onClick={handleBackToPreviousPage}
                                        className="chat-back-button flex h-9 w-9 items-center justify-center rounded-full text-[#b8c8dc] transition-colors hover:bg-white/10 hover:text-white"
                                        aria-label="Back to previous page"
                                        title="Back"
                                    >
                                        <FaArrowLeft size={17} />
                                    </button>
                                )}
                                {renderAvatar(activePartner, "w-10 h-10", "text-xl")}
                                <div className="flex flex-col justify-center">
                                    <h3 className="text-[16px] text-white font-medium leading-tight">{getParticipantName(activePartner)}</h3>
                                    <p className="text-[12px] text-[#b8c8dc] truncate">{String(activePartner.role || '').toLowerCase() === 'user' ? 'Client Account' : (activePartner.lawyerProfile?.specialization || activePartner.specialization || 'Lawyer')}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 text-[#b8c8dc] text-lg items-center">
                                {showAcceptedContactOptions && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleContactOptionClick('Voice')}
                                            className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                            title="Voice call"
                                        >
                                            <FaPhone size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContactOptionClick('Video')}
                                            className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                            title="Video call"
                                        >
                                            <FaVideo size={14} />
                                        </button>
                                        <div
                                            className="w-9 h-9 rounded-full border border-[#15a276] bg-[#15a276] text-white flex items-center justify-center"
                                            title="Chat"
                                        >
                                            <FaCommentDots size={14} />
                                        </div>
                                    </>
                                )}
                                <FaEllipsisV className="hover:text-white cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:px-[8%] space-y-1.5 scroll-smooth custom-scrollbar relative"
                            style={{ backgroundColor: '#f3f8fb' }}>
                            <div className="absolute inset-0 bg-[#f3f8fb] z-0"></div>
                            <div className="relative z-10 space-y-2 pb-4">
                                {messages.map((m, i) => {
                                    const isMe = String(m.sender?._id || m.sender) === String(user?._id);
                                    const isSelected = selectedMessages.includes(m._id);
                                    const currentDateLabel = formatMessageDateLabel(m.timestamp);
                                    const previousDateLabel = i > 0 ? formatMessageDateLabel(messages[i - 1]?.timestamp) : '';
                                    const showDateSeparator = currentDateLabel && currentDateLabel !== previousDateLabel;
                                    const messageTimestamp = formatMessageTimestamp(m.timestamp);
                                    // Cloudinary's secure_url is already the final delivery URL.
                                    // Prefer the new attachment metadata and retain mediaUrl for old messages.
                                    const attachmentUrl = m.attachment?.url || m.mediaUrl;
                                    const attachmentName = m.attachment?.originalName || 'Attachment';
                                    const attachmentSize = formatFileSize(m.attachment?.size);
                                    const isPdf = m.attachment?.mimeType === 'application/pdf' || attachmentName.toLowerCase().endsWith('.pdf');

                                    return (
                                        <React.Fragment key={m._id || i}>
                                            {showDateSeparator && (
                                                <div className="flex justify-center py-2">
                                                    <span className="rounded-full border border-[#dbe2ef] bg-white px-3 py-1 text-[11px] font-semibold text-[#5e6c87] shadow-sm">
                                                        {currentDateLabel}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                                                <div onClick={() => dispatch(toggleMessageSelection(m._id))} className={`cursor-pointer transition-all duration-200 ${isSelectionMode || isMe ? 'opacity-100 scale-100' : 'opacity-0 scale-0 w-0'}`}>
                                                    {isSelected ? <FaCheckCircle className="text-[#15a276] text-lg shadow-sm" /> : <FaCircle className="text-[#a8b5c9] text-lg" />}
                                                </div>
                                                <div onDoubleClick={() => dispatch(toggleMessageSelection(m._id))}
                                                    className={`max-w-[85%] md:max-w-[65%] rounded-2xl shadow-sm relative pt-1.5 pb-2 px-3 border ${isMe ? 'chat-sender-bubble rounded-br-md' : 'chat-receiver-bubble rounded-bl-md'} ${isSelected ? 'ring-2 ring-[#15a276] scale-[0.99]' : ''}`}>
                                                    {attachmentUrl && m.messageType === 'image' && <div className="chat-attachment-surface mb-1 overflow-hidden rounded-xl p-1"><img src={attachmentUrl} alt={attachmentName} className="max-h-64 w-full rounded-lg object-cover cursor-pointer" onClick={() => !isSelectionMode && window.open(attachmentUrl, '_blank', 'noopener,noreferrer')} /></div>}
                                                    {attachmentUrl && m.messageType === 'video' && <div className="chat-attachment-surface mb-1 overflow-hidden rounded-xl p-1"><video controls className="max-h-64 w-full rounded-lg"><source src={attachmentUrl} /></video></div>}
                                                    {attachmentUrl && m.messageType === 'audio' && <div className="chat-attachment-surface mb-1 flex items-center gap-2 rounded-xl p-2"><FaMicrophone className="text-[#15a276]" /><audio controls className="h-8 min-w-0 flex-1"><source src={attachmentUrl} /></audio></div>}
                                                    {attachmentUrl && (m.messageType === 'document' || m.attachment?.mimeType === 'application/pdf') && (
                                                        <div className="chat-attachment-surface mb-1 rounded-xl p-3">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                {isPdf ? <FaFilePdf className="shrink-0 text-xl text-red-600" /> : <FaFileAlt className="shrink-0 text-xl text-[#15a276]" />}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-bold text-[#0f172a]">{attachmentName}</p>
                                                                    {attachmentSize && <p className="text-xs text-[#475569]">{attachmentSize}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 flex gap-2">
                                                                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="chat-attachment-primary">Open</a>
                                                                <a href={attachmentUrl} download={attachmentName} className="chat-attachment-secondary"><FaDownload /> Download</a>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {m.content && <div className="text-[14.2px] leading-relaxed break-words whitespace-pre-wrap">{renderMessageText(m.content)}</div>}
                                                    <div className={`text-[10px] text-right mt-0.5 flex justify-end items-center gap-1 float-right ml-3 pt-1 ${isMe ? 'text-[#b8c8dc]' : 'text-[#7f8ba2]'}`}>
                                                        {messageTimestamp}
                                                        {isMe && <FaCheckDouble className={`text-[12px] ml-0.5 ${m.read ? 'text-[#8de2c6]' : 'text-[#b8c8dc]'}`} />}
                                                    </div>
                                                    <div className="clear-both"></div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </div>

                        <div className="min-h-[62px] p-3 bg-white flex items-center gap-2 border-t border-[#dbe2ef]">
                            {isCheckingChatAccess ? (
                                <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-[#dbe2ef] bg-[#f3f8fb] text-[#5e6c87] font-semibold text-sm">
                                    Checking appointment access...
                                </div>
                            ) : appointmentStatus === 'rejected' ? (
                                <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-semibold text-sm">
                                    <FaTimes /> Appointment request has been rejected by the lawyer.
                                </div>
                            ) : appointmentStatus === 'pending' ? (
                                <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-semibold text-sm">
                                    Waiting for the lawyer to accept your appointment request.
                                </div>
                            ) : !canChat ? (
                                <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-[#dbe2ef] bg-[#f3f8fb] text-[#5e6c87] font-semibold text-sm">
                                    <FaTimes /> Messaging is locked. An accepted appointment is required.
                                </div>
                            ) : isRecording ? (
                                <div className="flex-1 flex items-center justify-between bg-[#e8f7f2] p-2.5 px-5 rounded-lg border border-[#15a276]/30">
                                    <div className="flex items-center gap-3 text-[#062552] font-bold"><FaMicrophone className="animate-pulse text-[#15a276]" />{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</div>
                                    <span className="text-[#5e6c87] text-[13px] tracking-wide">Recording audio...</span>
                                    <button onClick={cancelRecording} className="text-[#5e6c87] hover:text-[#062552] transition-colors text-[13px] font-semibold">Cancel</button>
                                </div>
                            ) : pendingAttachment ? (
                                <div className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#dbe2ef] bg-[#f8fafc] p-2">
                                    {pendingAttachment.type === 'image' && <img src={pendingAttachment.previewUrl} alt="Selected attachment preview" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
                                    {pendingAttachment.type === 'video' && <video src={pendingAttachment.previewUrl} className="h-14 w-20 shrink-0 rounded-lg bg-slate-900 object-cover" />}
                                    {pendingAttachment.type === 'audio' && <FaMicrophone className="ml-2 shrink-0 text-xl text-[#15a276]" />}
                                    {pendingAttachment.type === 'document' && (pendingAttachment.file.type === 'application/pdf' ? <FaFilePdf className="ml-2 shrink-0 text-2xl text-red-600" /> : <FaFileAlt className="ml-2 shrink-0 text-2xl text-[#15a276]" />)}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-[#0f172a]">{pendingAttachment.file.name}</p>
                                        <p className="text-xs text-[#475569]">{formatFileSize(pendingAttachment.file.size)} · Ready to send</p>
                                    </div>
                                    <button type="button" onClick={clearPendingAttachment} disabled={isUploading} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-200 disabled:opacity-60">Cancel</button>
                                    <button type="button" onClick={sendPendingAttachment} disabled={isUploading} className="chat-attachment-primary shrink-0 disabled:opacity-60">{isUploading ? 'Uploading…' : 'Send'}</button>
                                </div>
                            ) : (
                                <>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,video/*,audio/*" />
                                    <div className="p-2 cursor-pointer text-[#5e6c87] hover:text-[#15a276] transition-colors" onClick={() => !isUploading && fileInputRef.current.click()}>
                                        <FaPaperclip className={`text-xl ${isUploading ? 'animate-spin text-white' : ''}`} />
                                    </div>
                                    <form onSubmit={handleSend} className="flex-1">
                                        <input value={text} onChange={e => setText(e.target.value)} placeholder={isUploading ? "Uploading media..." : "Type a message"} disabled={isUploading}
                                            className="w-full bg-[#f3f8fb] border border-[#dbe2ef] focus:border-[#15a276] py-2.5 px-4 rounded-xl text-[15px] outline-none text-[#062552] placeholder-[#8a95ab]" />
                                    </form>
                                </>
                            )}
                            {!canChat || isCheckingChatAccess || pendingAttachment ? null : (
                                <button onClick={text.trim() ? handleSend : isRecording ? stopRecording : startRecording}
                                    className={`p-3 rounded-full flex items-center justify-center transition-all ${text.trim() ? 'bg-[#15a276] text-white hover:bg-[#118b66]' : isRecording ? 'bg-[#15a276] text-white animate-pulse' : 'text-[#5e6c87] hover:text-[#15a276]'}`}>
                                    {text.trim() ? <FaPaperPlane className="ml-1" size={16} /> : isRecording ? <FaStop size={18} /> : <FaMicrophone size={20} />}
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-[#f3f8fb] text-center px-4 border-b-[6px] border-[#15a276]">
                        <div className="w-[300px] mb-8 opacity-80">
                            <svg viewBox="0 0 100 100" fill="none" className="text-[#15a276]/15">
                                <path fill="currentColor" d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm20 70H30c-5.5 0-10-4.5-10-10V40c0-5.5 4.5-10 10-10h40c5.5 0 10 4.5 10 10v20c0 5.5-4.5 10-10 10zm-5-35H35v5h30v-5zm0 15H35v5h30v-5z" />
                            </svg>
                        </div>
                        <h2 className="text-[#062552] text-3xl font-semibold mb-4">LegalChat Web</h2>
                        <p className="text-[#5e6c87] text-[14px]">Send and receive messages in a simple one-to-one chat experience.</p>
                        <div className="mt-10 flex items-center gap-2 text-[#5e6c87] text-[13px] bg-white py-1.5 px-4 rounded-full border border-[#dbe2ef] shadow-sm">
                            🔒 End-to-end encrypted
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
