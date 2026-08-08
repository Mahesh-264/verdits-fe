import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus, TrendingUp, Users } from 'lucide-react';
import api from '../api/axios.jsx';
import ReactionBar from '../components/feed/ReactionBar.jsx';
import StudentLayout from './StudentLayout.jsx';

export default function StudentJamSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const loadPublishedJamSessions = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/auth/published-jam-sessions');
        setSessions(Array.isArray(data) ? data : (Array.isArray(data?.jamSessions) ? data.jamSessions : []));
      } catch (error) {
        console.error('Error loading jam sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPublishedJamSessions();
  }, []);

  const trendingTopics = useMemo(() => {
    return [...new Set(sessions.map((session) => session.topic).filter(Boolean))].slice(0, 5);
  }, [sessions]);

  const handleJamLike = async (session) => {
    const { data } = await api.post(`/auth/jam-sessions/${session.id}/like`);
    return data;
  };

  const handleJamComment = async (session, text) => {
    const { data } = await api.post(`/auth/jam-sessions/${session.id}/comments`, { text });
    return data;
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Jam Sessions</h1>
            <p className="text-[#5e6c87] text-lg mt-3">
              Discuss legal cases and share insights with fellow law students
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-6 py-4 text-[18px] font-bold border border-[#d6b85b] shadow-sm transition"
          >
            <Plus size={20} />
            Start New Session
          </button>
        </div>

        <section className="rounded-[28px] border border-[#dbe2ef] bg-gradient-to-r from-[#eef5ff] to-[#f9f0ff] p-8 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-[#15a276]" size={24} />
            <h2 className="text-[22px] font-semibold">Trending Topics</h2>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            {(trendingTopics.length > 0 ? trendingTopics : ['No topics yet']).map((topic) => (
              <button
                key={topic}
                type="button"
                className="rounded-full bg-white px-4 py-2 text-[16px] font-medium text-[#0b1f44] hover:bg-[#f6f9ff] transition"
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          {loading ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              Loading jam sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              No jam sessions have been posted yet. When a student or lawyer posts a jam session, it will appear here.
            </div>
          ) : sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-[28px] border border-[#dbe2ef] bg-white shadow-[0_2px_12px_rgba(11,31,68,0.04)] overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {session.profileImage ? (
                      <img src={session.profileImage} alt={session.author} className="h-16 w-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#1e293b] to-[#334155] text-white text-xl font-bold flex items-center justify-center shrink-0">
                        {session.avatar}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[20px] font-semibold">{session.author}</h3>
                      <p className="text-[#44516d] text-[18px] mt-1">{session.meta}</p>
                      <p className="text-[#7f8ba2] text-[16px] mt-2">{session.time}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#f0e3ff] px-4 py-2 text-sm font-medium text-[#8c2bff]">
                    {session.topic}
                  </span>
                </div>

                <h2 className="text-[22px] md:text-[26px] font-semibold mt-10">{session.title}</h2>
                <p className="mt-6 text-[18px] leading-9 text-[#243b67]">{session.summary}</p>

                <div className="mt-8 flex flex-wrap items-center gap-8 text-[#5e6c87] text-[18px]">
                  <div className="inline-flex items-center gap-2">
                    <Users size={18} />
                    {session.participants}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <MessageSquare size={18} />
                    {session.commentsLabel || `${session.commentsCount || 0} comments`}
                  </div>
                </div>

                <div className="mt-6">
                  <ReactionBar
                    item={session}
                    itemLabel="jam session"
                    onLike={handleJamLike}
                    onComment={handleJamComment}
                  />
                </div>
              </div>

              <div className="border-t border-[#e3e8f3] px-6 py-5 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button type="button" className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#062552] hover:text-[#d6a400] transition">
                  <Users size={18} />
                  Join Session
                </button>
                <button type="button" className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#062552] hover:text-[#d6a400] transition">
                  <MessageSquare size={18} />
                  View Comments
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
