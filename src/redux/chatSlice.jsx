import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios"; // Adjust path if needed

export const fetchAllLawyers = createAsyncThunk("chat/fetchAllLawyers", async () => {
    const res = await api.get("/auth/lawyers");
    return Array.isArray(res.data?.lawyers) ? res.data.lawyers : [];
});
export const fetchConversations = createAsyncThunk("chat/fetchConversations", async () => { const res = await api.get("/chat/conversations"); return res.data.chatList; });
export const fetchHistory = createAsyncThunk("chat/fetchHistory", async (partnerId) => { const res = await api.get(`/chat/history/${partnerId}`); return res.data.messages; });
export const markMessagesAsRead = createAsyncThunk("chat/markAsRead", async (partnerId) => { await api.put(`/chat/read-all/${partnerId}`); return partnerId; });
export const sendMediaMessage = createAsyncThunk("chat/sendMedia", async (formData) => { const res = await api.post("/chat/send", formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return res.data.message; });
export const deleteMessage = createAsyncThunk("chat/deleteMessage", async (messageId) => { await api.delete(`/chat/${messageId}`); return messageId; });
export const deleteBatchMessages = createAsyncThunk("chat/deleteBatch", async (ids) => { await api.post(`/chat/delete-batch`, { ids }); return ids; });

const chatSlice = createSlice({
    name: "chat",
    initialState: { conversations: [], availableLawyers: [], messages: [], selectedMessages: [], activePartner: null, loadingHistory: false },
    reducers: {
        setActivePartner: (state, action) => {
            console.log("🛠️ [Redux] setActivePartner:", action.payload);
            state.activePartner = action.payload;
            state.messages = [];
            state.selectedMessages = [];
        },
        toggleMessageSelection: (state, action) => {
            const id = action.payload;
            state.selectedMessages = state.selectedMessages.includes(id) ? state.selectedMessages.filter(mId => mId !== id) : [...state.selectedMessages, id];
        },
        clearSelection: (state) => { state.selectedMessages = []; },
        removeMessageLocally: (state, action) => { state.messages = state.messages.filter(m => String(m._id) !== String(action.payload)); },

        receiveMessage: (state, action) => {
            console.log("🛠️ [Redux] receiveMessage triggered!");
            const { msg, myId } = action.payload;

            console.log("🛠️ [Redux] Payload Received -> msg:", msg, " | myId:", myId);

            if (!myId) {
                console.error("🚨 [Redux ERROR] myId is undefined! Cannot process message.");
                return;
            }

            const senderId = String(msg.sender?._id || msg.sender);
            const receiverId = String(msg.receiver?._id || msg.receiver);
            const stringMyId = String(myId);

            console.log(`🛠️ [Redux] Parsed IDs -> Sender: ${senderId}, Receiver: ${receiverId}, Me: ${stringMyId}`);

            const partnerId = senderId === stringMyId ? receiverId : senderId;
            const activePartnerId = state.activePartner
                ? String(state.activePartner._id || state.activePartner.id)
                : null;

            console.log(`🛠️ [Redux] Partner Calculated: ${partnerId}, Active Open Chat: ${activePartnerId}`);

            // 1. Add to active chat window
            if (activePartnerId === partnerId) {
                const exists = state.messages.some(m => String(m._id) === String(msg._id));
                if (!exists) {
                    console.log("✅ [Redux] Pushing message to current chat window!");
                    state.messages.push(msg);
                } else {
                    console.log("⚠️ [Redux] Message already in window, skipping duplicate.");
                }
            } else {
                console.log("ℹ️ [Redux] Message is for a different chat, not pushing to main window.");
            }

            // 2. Update Sidebar list
            const index = state.conversations.findIndex(c => String(c.contact?._id || c._id) === partnerId);
            const previewText = msg.messageType === 'text' ? msg.content : `📎 ${msg.messageType}`;

            console.log(`🛠️ [Redux] Sidebar check -> Found existing conversation at index: ${index}`);

            if (index !== -1) {
                console.log("✅ [Redux] Updating existing sidebar conversation.");
                state.conversations[index].lastMessage = previewText;
                state.conversations[index].timestamp = msg.timestamp;
                if (receiverId === stringMyId && activePartnerId !== partnerId) {
                    state.conversations[index].unreadCount = (state.conversations[index].unreadCount || 0) + 1;
                }
                const [convo] = state.conversations.splice(index, 1);
                state.conversations.unshift(convo);
            } else {
                console.log("🌟 [Redux] Brand NEW conversation! Creating sidebar entry.");
                const contactData = senderId === stringMyId ? msg.receiver : msg.sender;
                console.log("🌟 [Redux] Using contact data for sidebar:", contactData);

                state.conversations.unshift({
                    _id: partnerId,
                    contact: contactData,
                    lastMessage: previewText,
                    timestamp: msg.timestamp,
                    unreadCount: (receiverId === stringMyId && activePartnerId !== partnerId) ? 1 : 0
                });
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.fulfilled, (state, action) => { state.conversations = action.payload; })
            .addCase(fetchAllLawyers.fulfilled, (state, action) => { state.availableLawyers = action.payload; })
            .addCase(fetchHistory.pending, (state) => { state.loadingHistory = true; })
            .addCase(fetchHistory.fulfilled, (state, action) => {
                console.log("📥 [Redux API] fetchHistory fulfilled! Data:", action.payload);
                state.loadingHistory = false;
                const fetchedIds = new Set(action.payload.map(m => String(m._id)));
                const liveMessages = state.messages.filter(m => !fetchedIds.has(String(m._id)));
                state.messages = [...action.payload, ...liveMessages];
            })
            .addCase(markMessagesAsRead.fulfilled, (state, action) => {
                const index = state.conversations.findIndex(c => String(c.contact?._id || c._id) === String(action.payload));
                if (index !== -1) state.conversations[index].unreadCount = 0;
            })
            .addCase(deleteMessage.fulfilled, (state, action) => { state.messages = state.messages.filter(m => String(m._id) !== String(action.payload)); })
            .addCase(deleteBatchMessages.fulfilled, (state, action) => {
                const deletedIds = action.payload.map(id => String(id));
                state.messages = state.messages.filter(m => !deletedIds.includes(String(m._id)));
                state.selectedMessages = [];
            });
    }
});

export const { setActivePartner, receiveMessage, removeMessageLocally, toggleMessageSelection, clearSelection } = chatSlice.actions;
export default chatSlice.reducer;
