import React, { useEffect, useRef, useState } from 'react';
import { FaPaperclip, FaPaperPlane, FaTimes, FaUser } from 'react-icons/fa';
import api from '../../api/axios';

const CaseFloatingChat = ({
  selectedCase,
  displayTeam,
  currentUserId,
  onClose,
  formatDate,
}) => {
  const caseId = selectedCase?.id || selectedCase?._id;
  const teamId = displayTeam?.id || 'personal';
  const caseName = selectedCase?.caseName || selectedCase?.caseTitle || selectedCase?.title || 'Case Chat';

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showHearingPicker, setShowHearingPicker] = useState(false);
  const [activeHearingRef, setActiveHearingRef] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/teams/${teamId}/cases/${caseId}/messages`);
      if (data?.success) {
        setMessages(data.messages || []);
        const otherParticipants = (data.participants || []).filter(
          (p) => String(p.id) !== String(currentUserId)
        );
        setParticipants(otherParticipants);
        if (otherParticipants.length > 0 && !selectedRecipientId) {
          setSelectedRecipientId(otherParticipants[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching case messages:', err);
      setError(err.response?.data?.message || 'Unable to load chat messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [caseId, teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text && !activeHearingRef) return;

    try {
      setSending(true);
      setError('');
      const payload = {
        message: text || (activeHearingRef ? `Inquiring about hearing on ${formatDate(activeHearingRef.hearingDate) || 'scheduled date'}` : 'Case update'),
        receiverId: selectedRecipientId || null,
        hearingRef: activeHearingRef || null,
      };

      const { data } = await api.post(`/teams/${teamId}/cases/${caseId}/messages`, payload);
      if (data?.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputMessage('');
        setActiveHearingRef(null);
        setShowHearingPicker(false);
      }
    } catch (err) {
      console.error('Error sending case message:', err);
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const hearings = Array.isArray(selectedCase?.hearingHistory) ? selectedCase.hearingHistory : [];

  const handleSelectHearing = (hearing) => {
    setActiveHearingRef({
      hearingDate: hearing.hearingDate,
      courtName: hearing.courtName || selectedCase?.courtName || '',
      hearingDetails: hearing.hearingDetails || '',
      nextHearingDate: hearing.nextHearingDate || null,
    });
    setShowHearingPicker(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl border border-[#d7e9ef] bg-[#fffdf0] shadow-2xl transition-all sm:w-96">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#eef5f8] bg-[#f1d15f] px-4 py-3 text-[#062552]">
        <div className="min-w-0 flex-1 pr-2">
          <h4 className="truncate text-sm font-bold">{caseName}</h4>
          <p className="truncate text-[11px] font-medium text-[#4a3b00]">
            Client: {selectedCase?.clientName || 'Not added'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#062552] transition hover:bg-black/10"
          title="Close Chat"
          aria-label="Close Chat"
        >
          <FaTimes size={14} />
        </button>
      </div>


      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        {loading ? (
          <p className="py-8 text-center text-[#5f7488]">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-[#5f7488]">
            <p className="font-semibold text-[#062552]">No messages yet</p>
            <p className="mt-1 text-[11px]">Start a conversation about this case or hearing.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = String(msg.senderId?.id || msg.senderId?._id || msg.senderId) === String(currentUserId);
            return (
              <div
                key={msg.id || msg._id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div className="mb-0.5 text-[10px] font-semibold text-[#5f7488]">
                  {isMine ? 'You' : msg.senderId?.name || 'Lawyer'}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    isMine
                      ? 'rounded-tr-none bg-[#f1d15f] text-zinc-950 font-medium'
                      : 'rounded-tl-none border border-[#d7e9ef] bg-white text-[#062552]'
                  }`}
                >
                  {/* Embedded Hearing Reference Card */}
                  {msg.hearingRef && (msg.hearingRef.hearingDate || msg.hearingRef.courtName) ? (
                    <div className="mb-2 rounded-xl border border-[#e0c765] bg-[#fff9db] p-2 text-[11px] text-[#062552]">
                      <div className="font-bold text-[#8a6d05] uppercase tracking-wide text-[9px]">
                        📍 Hearing Reference
                      </div>
                      {msg.hearingRef.hearingDate ? (
                        <div><span className="font-semibold">Date:</span> {formatDate(msg.hearingRef.hearingDate)}</div>
                      ) : null}
                      {msg.hearingRef.courtName ? (
                        <div><span className="font-semibold">Court:</span> {msg.hearingRef.courtName}</div>
                      ) : null}
                      {msg.hearingRef.nextHearingDate ? (
                        <div><span className="font-semibold">Next Date:</span> {formatDate(msg.hearingRef.nextHearingDate)}</div>
                      ) : null}
                      {msg.hearingRef.hearingDetails ? (
                        <div className="mt-0.5 truncate text-[10px] text-[#5f7488]">{msg.hearingRef.hearingDetails}</div>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                </div>
                <span className="mt-1 text-[9px] text-[#8aa0b4]">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? (
        <div className="bg-red-50 px-3 py-1 text-center text-[11px] font-semibold text-red-600 border-t border-red-200">
          {error}
        </div>
      ) : null}

      {/* Selected Hearing Reference Chip */}
      {activeHearingRef ? (
        <div className="flex items-center justify-between border-t border-[#eef5f8] bg-[#fff9db] px-3 py-1.5 text-xs text-[#062552]">
          <span className="truncate font-semibold text-[#8a6d05]">
            📍 Ref: {formatDate(activeHearingRef.hearingDate) || 'Hearing'} ({activeHearingRef.courtName || 'Court'})
          </span>
          <button
            type="button"
            onClick={() => setActiveHearingRef(null)}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            <FaTimes size={12} />
          </button>
        </div>
      ) : null}

      {/* Hearing Picker Dropdown Overlay */}
      {showHearingPicker ? (
        <div className="border-t border-[#d7e9ef] bg-[#fffdf0] p-2 shadow-lg">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-[#062552]">Select Hearing to Reference:</span>
            <button type="button" onClick={() => setShowHearingPicker(false)} className="text-[#5f7488] hover:text-[#062552]">
              <FaTimes size={11} />
            </button>
          </div>
          {hearings.length === 0 ? (
            <p className="p-2 text-center text-[11px] text-[#5f7488]">No hearing records for this case.</p>
          ) : (
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {hearings.map((h, i) => (
                <button
                  key={h.id || h._id || i}
                  type="button"
                  onClick={() => handleSelectHearing(h)}
                  className="w-full text-left rounded-lg border border-[#e0c765] bg-white p-1.5 text-[11px] text-[#062552] transition hover:bg-[#fff9db]"
                >
                  <div className="font-bold text-[#15a276]">{formatDate(h.hearingDate) || 'Hearing Date'}</div>
                  <div className="text-[10px] text-[#5f7488]">Court: {h.courtName || 'Not set'}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Bottom Input Controls */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-[#eef5f8] bg-white p-2.5">
        <button
          type="button"
          onClick={() => setShowHearingPicker((prev) => !prev)}
          className={`rounded-lg border p-2 text-xs transition ${
            activeHearingRef || showHearingPicker
              ? 'border-[#f1d15f] bg-[#fff9db] text-[#8a6d05]'
              : 'border-[#d7e9ef] bg-[#f8fbfc] text-[#5f7488] hover:text-[#062552]'
          }`}
          title="Reference Hearing Details"
        >
          <FaPaperclip size={13} />
        </button>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type message..."
          className="min-w-0 flex-1 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-2 text-xs text-[#062552] outline-none focus:border-[#f1d15f]"
        />
        <button
          type="submit"
          disabled={sending || (!inputMessage.trim() && !activeHearingRef)}
          className="inline-flex items-center justify-center rounded-xl bg-[#f1d15f] p-2.5 text-xs font-bold text-zinc-950 transition hover:bg-[#e0c04f] disabled:cursor-not-allowed disabled:opacity-50"
          title="Send message"
        >
          <FaPaperPlane size={13} />
        </button>
      </form>
    </div>
  );
};

export default CaseFloatingChat;
