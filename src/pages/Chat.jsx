import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    fetchConversations, fetchHistory, setActivePartner,
    receiveMessage, fetchAllLawyers, markMessagesAsRead,
    deleteMessage, deleteBatchMessages, toggleMessageSelection,
    clearSelection, removeMessageLocally, sendMediaMessage
} from '../redux/chatSlice';
import { logout } from '../redux/authSlice';
import api from '../api/axios';
import { io } from "socket.io-client";
import {
    FaPhone, FaVideo, FaEllipsisV, FaPaperPlane, FaTimes,
    FaPaperclip, FaSignOutAlt, FaSearch, FaCheckDouble,
    FaTrash, FaMicrophone, FaCheckCircle, FaCircle, FaStop, FaExternalLinkAlt
} from 'react-icons/fa';

// 🌟 THE SILVER BULLET: Global socket instance outside the component!
// This makes the connection invincible against React's re-renders and unmounts.
let globalSocket = null;

const hasAcceptedAppointment = (appointments, lawyerId, clientId) =>
    appointments.some((appointment) =>
        String(appointment.lawyerId?._id || appointment.lawyerId) === String(lawyerId) &&
        String(appointment.userId?._id || appointment.userId) === String(clientId) &&
        String(appointment.status).toLowerCase() === 'accepted'
    );

export default function Chat() {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useSelector(state => state.auth);
    const { conversations, availableLawyers, messages, activePartner, selectedMessages } = useSelector(state => state.chat);

    const [canChat, setCanChat] = useState(true);
    const [isCheckingChatAccess, setIsCheckingChatAccess] = useState(false);

    useEffect(() => {
        const checkChatAccess = async () => {
            if (!activePartner || !user) {
                setCanChat(true);
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
                setCanChat(hasAcceptedAppointment(data, lawyerId, clientId));
            } catch (error) {
                console.error('Error checking appointment access:', error);
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

    const socket = useRef(null);
    const scrollRef = useRef();
    const fileInputRef = useRef();
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const activePartnerRef = useRef(null);
    const userIdRef = useRef(null);

    // Keep Refs synced instantly without causing re-renders
    useEffect(() => { activePartnerRef.current = activePartner?._id; }, [activePartner]);
    useEffect(() => { userIdRef.current = user?._id || user?.id; }, [user]);

    // 0. Handle incoming chat request from profiles
    useEffect(() => {
        if (location.state?.selectedPartner) {
            console.log("➡️ [Router] Arrived from Profile! Setting partner.");
            dispatch(setActivePartner(location.state.selectedPartner));
            // Silently clear router state so it doesn't cause mounting loops
            window.history.replaceState({}, document.title);
        }
    }, [location.state, dispatch]);

    // 🟢 1. THE FLAWLESS SOCKET CONNECTION (React 18 Strict Mode Safe)
    useEffect(() => {
        const userId = user?._id || user?.id;
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || user?.token || "";

        if (!userId || !token) return;

        // Only create the socket if it doesn't exist yet
        if (!globalSocket) {
            console.log(`🔌 [Socket] Creating NEW GLOBAL connection for user: ${userId}`);
            globalSocket = io("/", { auth: { token } });
        } else if (globalSocket.disconnected) {
            console.log(`🔌 [Socket] Reconnecting existing GLOBAL socket...`);
            globalSocket.auth = { token };
            globalSocket.connect();
        }

        // Sync local ref to the global socket so handleSend can use it
        socket.current = globalSocket;

        // Define exactly what to do when events happen
        const onConnect = () => console.log("✅ [Socket] Connected! ID:", globalSocket.id);
        const onNewMessage = (msg) => {
            console.log("📨 [Socket EVENT] Live message received:", msg);

            const currentMyId = userIdRef.current;
            dispatch(receiveMessage({ msg, myId: currentMyId }));

            const currentPartnerId = String(activePartnerRef.current);
            const senderId = String(msg.sender?._id || msg.sender?.id || msg.sender);

            if (senderId === currentPartnerId && currentPartnerId !== "undefined") {
                dispatch(markMessagesAsRead(currentPartnerId));
            }
        };
        const onMessageDeleted = (id) => dispatch(removeMessageLocally(id));
        const onDisconnect = () => console.log("🛑 [Socket] Disconnected from server.");

        // Attach listeners to the global socket
        globalSocket.on("connect", onConnect);
        globalSocket.on("newMessage", onNewMessage);
        globalSocket.on("messageDeleted", onMessageDeleted);
        globalSocket.on("disconnect", onDisconnect);

        // If the socket connected incredibly fast before the listener was attached
        if (globalSocket.connected) {
            console.log("✅ [Socket] Already connected! ID:", globalSocket.id);
        }

        // 🚨 CLEANUP: Do NOT disconnect the socket! Just remove the listeners.
        // This stops React from murdering the connection when you switch pages!
        return () => {
            console.log("🧹 [Socket] Component unmounting. Removing listeners (Socket stays alive).");
            globalSocket.off("connect", onConnect);
            globalSocket.off("newMessage", onNewMessage);
            globalSocket.off("messageDeleted", onMessageDeleted);
            globalSocket.off("disconnect", onDisconnect);
        };
    }, [dispatch, user?._id, user?.id]); // Stable dependency array

    // Destroy socket fully ONLY if user logs out
    useEffect(() => {
        if (!user && globalSocket) {
            console.log("🚪 [Socket] User logged out. Destroying socket.");
            globalSocket.disconnect();
            globalSocket = null;
        }
    }, [user]);

    // 2. Data Fetching
    useEffect(() => {
        if (user?._id) {
            if (user.role === 'user') dispatch(fetchAllLawyers());
            dispatch(fetchConversations());
        }
    }, [dispatch, user?._id, user?.role]);

    // 3. Chat Switching & History Fetching
    useEffect(() => {
        if (activePartner?._id) {
            dispatch(fetchHistory(activePartner._id));
            dispatch(markMessagesAsRead(activePartner._id));
            dispatch(clearSelection());
        }
    }, [activePartner, dispatch]);

    // 4. Scroll to Bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const renderAvatar = (partner, sizeClasses = "w-10 h-10", textClasses = "text-xl") => {
        if (partner?.profileImage) return <img src={partner.profileImage} alt="User" className={`${sizeClasses} rounded-full object-cover border border-zinc-700 shadow-md`} />;
        let icon = '👤';
        if (partner?.role === 'lawyer' || partner?.role === 'vendor' || partner?.role === 'doctor') icon = partner?.role === 'doctor' ? '🩺' : '⚖️';
        return <div className={`${sizeClasses} rounded-full bg-zinc-800 flex items-center justify-center ${textClasses} border border-zinc-700 shadow-md`}>{icon}</div>;
    };

    const renderMessageText = (content) => {
        if (!content) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                const isMeeting = part.includes('zoom.us') || part.includes('meet.google.com');
                return (
                    <div key={i} className="my-2 p-3 bg-black/20 rounded-xl border border-white/10 flex flex-col gap-2 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isMeeting ? 'bg-blue-500' : 'bg-zinc-600'}`}>
                                {isMeeting ? <FaVideo className="text-white text-[10px]" /> : <FaExternalLinkAlt className="text-white text-[10px]" />}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">{isMeeting ? 'Video Meeting' : 'Web Link'}</span>
                                <span className="text-[12px] text-blue-300 truncate w-44 underline">{part}</span>
                            </div>
                        </div>
                        <a href={part} target="_blank" rel="noopener noreferrer" className="bg-zinc-800/80 hover:bg-zinc-700 text-white text-center py-1.5 rounded-lg text-[11px] font-semibold transition-colors mt-1">
                            {isMeeting ? 'Join' : 'Open'}
                        </a>
                    </div>
                );
            }
            return part;
        });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = async () => {
                const file = new File([new Blob(audioChunksRef.current)], "voice.mp3", { type: 'audio/mpeg' });
                const formData = new FormData();
                formData.append("receiverId", activePartner._id);
                formData.append("messageType", 'audio');
                formData.append("file", file);
                setIsUploading(true);
                await dispatch(sendMediaMessage(formData));
                setIsUploading(false);
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) { alert("Mic required"); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !activePartner) return;
        const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
        const formData = new FormData();
        formData.append("receiverId", activePartner._id);
        formData.append("messageType", type);
        formData.append("file", file);
        setIsUploading(true);
        await dispatch(sendMediaMessage(formData));
        setIsUploading(false);
    };

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!text.trim() || !activePartner) return;

        if (!socket.current || !socket.current.connected) {
            console.error("🚨 Socket is offline! Forcing reconnect before sending...");
            if (globalSocket) globalSocket.connect();
        }

        console.log(`🚀 [Component] Emitting 'sendMessage' -> Text: "${text}"`);
        socket.current.emit("sendMessage", { receiverId: activePartner._id, content: text, messageType: "text" });
        setText("");
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
        const remainingLawyers = availableLawyers
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

    return (
        <div className="flex h-screen bg-[#111b21] text-[#e9edef] overflow-hidden font-sans select-none">
            {/* SIDEBAR */}
            <div className={`w-full md:w-[30%] min-w-[320px] max-w-[420px] border-r border-[#222d34] flex flex-col bg-[#111b21] ${activePartner ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-3 bg-[#202c33] flex justify-between items-center border-b border-[#222d34]">
                    <div className="flex items-center gap-3">
                        {renderAvatar(user, "w-10 h-10", "text-lg")}
                        <div className="flex flex-col">
                            <span className="text-[15px] font-semibold text-white">{user?.name || "My Account"}</span>
                            <span className="text-[11px] text-[#00a884] font-medium uppercase tracking-wider">{user?.role}</span>
                        </div>
                    </div>
                    <button onClick={() => dispatch(logout())} className="text-[#aebac1] hover:text-red-500 p-2 transition-colors"><FaSignOutAlt size={18} /></button>
                </div>

                <div className="p-2 border-b border-[#222d34]">
                    <div className="bg-[#202c33] flex items-center px-4 py-2 rounded-lg">
                        <FaSearch className="text-[#aebac1] mr-4 text-sm" />
                        <input placeholder="Search or start new chat" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent text-[14px] w-full outline-none text-[#d1d7db] placeholder-[#aebac1]" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {displayList.map((item) => (
                        <div key={item._id || Math.random()} onClick={() => dispatch(setActivePartner(item))} className={`px-3 py-3 flex items-center gap-3 cursor-pointer transition-colors ${activePartner?._id === item._id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}>
                            <div className="relative shrink-0">
                                {renderAvatar(item, "w-12 h-12", "text-2xl")}
                                {item.unreadCount > 0 && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0 border-b border-[#222d34] pb-3 pt-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className="text-[16px] font-normal text-[#e9edef] truncate">{item.name || item.phone || "Client"}</h4>
                                    {item.timestamp && <span className={`text-[12px] ${item.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-[13px] truncate ${item.unreadCount > 0 ? 'text-[#e9edef] font-medium' : 'text-[#8696a0]'}`}>{item.lastMessage}</p>
                                    {item.unreadCount > 0 && <span className="bg-[#00a884] text-[#111b21] text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.unreadCount}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col bg-[#0b141a] relative">
                {activePartner ? (
                    <>
                        {isSelectionMode && (
                            <div className="absolute top-0 left-0 w-full h-[60px] bg-[#202c33] z-50 flex items-center justify-between px-6 border-b border-[#222d34] shadow-md">
                                <div className="flex items-center gap-6">
                                    <FaTimes className="cursor-pointer text-xl text-[#aebac1] hover:text-white" onClick={() => dispatch(clearSelection())} />
                                    <span className="text-[#e9edef] font-medium text-[16px]">{selectedMessages.length} selected</span>
                                </div>
                                <FaTrash className="cursor-pointer text-lg text-[#aebac1] hover:text-red-500 transition-colors" onClick={handleDeleteSelected} />
                            </div>
                        )}

                        <div className="h-[60px] px-4 bg-[#202c33] flex justify-between items-center border-l border-[#222d34] z-10 shadow-sm">
                            <div className="flex items-center gap-3">
                                <button onClick={() => dispatch(setActivePartner(null))} className="md:hidden text-2xl text-[#aebac1] mr-1 hover:text-white">←</button>
                                {renderAvatar(activePartner, "w-10 h-10", "text-xl")}
                                <div className="flex flex-col justify-center">
                                    <h3 className="text-[16px] text-[#e9edef] font-medium leading-tight">{activePartner.name || activePartner.phone || "Client"}</h3>
                                    <p className="text-[12px] text-[#8696a0] truncate">{activePartner.role === 'user' ? 'Client Account' : (activePartner.lawyerProfile?.specialization || 'Professional Account')}</p>
                                </div>
                            </div>
                            <div className="flex gap-6 text-[#aebac1] text-lg items-center">
                                {canChat && !isCheckingChatAccess ? (
                                    <>
                                        <FaVideo className="hover:text-white cursor-pointer" />
                                        <FaPhone className="hover:text-white cursor-pointer" />
                                    </>
                                ) : (
                                    <>
                                        <FaVideo className="opacity-30 cursor-not-allowed" />
                                        <FaPhone className="opacity-30 cursor-not-allowed" />
                                    </>
                                )}
                                <FaEllipsisV className="hover:text-white cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:px-[8%] space-y-1.5 scroll-smooth custom-scrollbar relative"
                            style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'contain', opacity: 0.9 }}>
                            <div className="absolute inset-0 bg-[#0b141a]/90 z-0"></div>
                            <div className="relative z-10 space-y-2 pb-4">
                                {messages.map((m, i) => {
                                    const isMe = String(m.sender?._id || m.sender) === String(user?._id);
                                    const isSelected = selectedMessages.includes(m._id);

                                    return (
                                        <div key={i} className={`flex items-center gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                                            <div onClick={() => dispatch(toggleMessageSelection(m._id))} className={`cursor-pointer transition-all duration-200 ${isSelectionMode || isMe ? 'opacity-100 scale-100' : 'opacity-0 scale-0 w-0'}`}>
                                                {isSelected ? <FaCheckCircle className="text-[#00a884] text-lg shadow-sm" /> : <FaCircle className="text-[#aebac1] text-lg" />}
                                            </div>
                                            <div onDoubleClick={() => dispatch(toggleMessageSelection(m._id))}
                                                className={`max-w-[85%] md:max-w-[65%] rounded-lg shadow-sm relative pt-1.5 pb-2 px-2.5 ${isSelected ? 'bg-emerald-900/40 ring-1 ring-[#00a884] scale-[0.99]' : isMe ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}`}>
                                                {m.mediaUrl && m.messageType === 'image' && <img src={m.mediaUrl} alt="sent" className="rounded-md max-h-64 w-full object-cover mb-1 cursor-pointer" onClick={() => !isSelectionMode && window.open(m.mediaUrl, '_blank')} />}
                                                {m.mediaUrl && m.messageType === 'video' && <video controls className="rounded-md max-h-64 w-full mb-1"><source src={m.mediaUrl} /></video>}
                                                {m.mediaUrl && m.messageType === 'audio' && <div className="flex items-center gap-2 p-1 bg-black/20 rounded-md"><FaMicrophone className="text-[#00a884]" /><audio controls className="h-8 w-full"><source src={m.mediaUrl} /></audio></div>}
                                                {m.content && <div className="text-[14.2px] leading-relaxed break-words whitespace-pre-wrap">{renderMessageText(m.content)}</div>}
                                                <div className="text-[10px] text-[#aebac1] text-right mt-0.5 flex justify-end items-center gap-1 float-right ml-3 pt-1">
                                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <FaCheckDouble className={`text-[12px] ml-0.5 ${m.read ? 'text-[#53bdeb]' : 'text-[#aebac1]'}`} />}
                                                </div>
                                                <div className="clear-both"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </div>

                        <div className="min-h-[62px] p-3 bg-[#202c33] flex items-center gap-2 border-t border-[#222d34]">
                            {isCheckingChatAccess ? (
                                <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-zinc-700 bg-[#111b21] text-[#aebac1] font-semibold text-sm">
                                    Checking appointment access...
                                </div>
                            ) : !canChat ? (
                                <div className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold text-sm">
                                    <FaTimes className="text-amber-500" /> Messaging is locked. An accepted appointment is required.
                                </div>
                            ) : isRecording ? (
                                <div className="flex-1 flex items-center justify-between bg-[#2a3942] p-2.5 px-5 rounded-lg border border-red-500/30">
                                    <div className="flex items-center gap-3 text-red-500 font-bold"><FaMicrophone className="animate-pulse" />{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</div>
                                    <span className="text-[#aebac1] text-[13px] tracking-wide">Recording audio...</span>
                                    <button onClick={() => { setIsRecording(false); clearInterval(timerRef.current); }} className="text-red-400 hover:text-red-300 transition-colors text-[13px] font-semibold">Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*" />
                                    <div className="p-2 cursor-pointer text-[#aebac1] hover:text-[#d1d7db] transition-colors" onClick={() => !isUploading && fileInputRef.current.click()}>
                                        <FaPaperclip className={`text-xl ${isUploading ? 'animate-spin text-[#00a884]' : ''}`} />
                                    </div>
                                    <form onSubmit={handleSend} className="flex-1">
                                        <input value={text} onChange={e => setText(e.target.value)} placeholder={isUploading ? "Uploading media..." : "Type a message"} disabled={isUploading}
                                            className="w-full bg-[#2a3942] py-2.5 px-4 rounded-lg text-[15px] outline-none text-[#d1d7db] placeholder-[#8696a0]" />
                                    </form>
                                </>
                            )}
                            {!canChat || isCheckingChatAccess ? null : (
                                <button onClick={text.trim() ? handleSend : isRecording ? stopRecording : startRecording}
                                    className={`p-3 rounded-full flex items-center justify-center transition-all ${text.trim() ? 'bg-[#00a884] text-[#111b21] hover:bg-[#00c99f]' : isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-[#aebac1] hover:text-[#d1d7db]'}`}>
                                    {text.trim() ? <FaPaperPlane className="ml-1" size={16} /> : isRecording ? <FaStop size={18} /> : <FaMicrophone size={20} />}
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-[#222e35] text-center px-4 border-b-[6px] border-[#00a884]">
                        <div className="w-[300px] mb-8 opacity-80">
                            <svg viewBox="0 0 100 100" fill="none" className="text-[#aebac1]/20">
                                <path fill="currentColor" d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm20 70H30c-5.5 0-10-4.5-10-10V40c0-5.5 4.5-10 10-10h40c5.5 0 10 4.5 10 10v20c0 5.5-4.5 10-10 10zm-5-35H35v5h30v-5zm0 15H35v5h30v-5z" />
                            </svg>
                        </div>
                        <h2 className="text-[#d1d7db] text-3xl font-light mb-4">LegalChat Web</h2>
                        <p className="text-[#8696a0] text-[14px]">Send and receive messages without keeping your phone online.<br />Use LegalChat on up to 4 linked devices and 1 phone.</p>
                        <div className="mt-10 flex items-center gap-2 text-[#8696a0] text-[13px] bg-[#111b21] py-1.5 px-4 rounded-full">
                            🔒 End-to-end encrypted
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
