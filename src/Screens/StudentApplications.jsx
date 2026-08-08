import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  IndianRupee,
  MapPin,
  Users,
} from 'lucide-react';
import api from '../api/axios.jsx';
import StudentLayout from './StudentLayout.jsx';

const formatAppliedTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusBadge = (status) => {
  const normalized = String(status || 'pending').toLowerCase();

  if (normalized === 'accepted') {
    return {
      label: 'Accepted ✓',
      className: 'bg-[#e8f7f2] text-[#15a276] border border-[#a2e3ce]',
    };
  }

  if (normalized === 'rejected') {
    return {
      label: 'Rejected',
      className: 'bg-[#fff4f4] text-[#b13e3e] border border-[#ffd9d9]',
    };
  }

  return {
    label: 'Pending Approval',
    className: 'bg-[#fffde6] text-[#755617] border border-[#ead79c]',
  };
};

export default function StudentApplications() {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'jamSessions' ? 'jamSessions' : 'internships';

  const [loading, setLoading] = useState(true);
  const [publishedInternships, setPublishedInternships] = useState([]);
  const [publishedJamSessions, setPublishedJamSessions] = useState([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [internshipsRes, jamRes] = await Promise.allSettled([
          api.get('/auth/published-internships'),
          api.get('/auth/published-jam-sessions'),
        ]);

        if (!active) return;

        if (internshipsRes.status === 'fulfilled') {
          const list = internshipsRes.value.data?.internships || [];
          setPublishedInternships(Array.isArray(list) ? list : []);
        }

        if (jamRes.status === 'fulfilled') {
          const list = jamRes.value.data?.jamSessions || [];
          setPublishedJamSessions(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error('Error loading applications data:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleTabChange = (tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  // 1. Process Internship Applications
  const internshipApplicationsList = useMemo(() => {
    const rawApplications = user?.studentProfile?.internshipApplications || [];
    const mapByPostId = new Map();

    publishedInternships.forEach((item) => {
      mapByPostId.set(String(item.id || item._id), item);
    });

    return rawApplications.map((app) => {
      const postId = String(app.postId || app.internshipId || '');
      const publishedMatch = mapByPostId.get(postId);

      return {
        id: app._id || app.id || postId,
        postId,
        title: publishedMatch?.title || app.title || 'Internship Application',
        lawyerName: publishedMatch?.lawyerName || app.lawyerName || 'Lawyer / Firm',
        profileImage: publishedMatch?.profileImage || '',
        avatar: publishedMatch?.avatar || (publishedMatch?.lawyerName || app.lawyerName || 'L').charAt(0).toUpperCase(),
        location: publishedMatch?.location || (app.address?.city || app.address?.district) || 'Not specified',
        duration: publishedMatch?.duration || 'Not specified',
        stipend: publishedMatch?.stipend || 'Not specified',
        description: publishedMatch?.description || publishedMatch?.content || app.coverMessage || '',
        skills: publishedMatch?.skills || publishedMatch?.specialization || app.skills || [],
        status: app.status || 'pending',
        appliedAt: app.appliedAt || app.createdAt || publishedMatch?.createdAt,
        resumeLink: app.resumeLink || '',
        resumeFileUrl: app.resumeFileUrl || '',
        coverMessage: app.coverMessage || '',
      };
    }).sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
  }, [user?.studentProfile?.internshipApplications, publishedInternships]);

  // 2. Process Joined Jam Sessions
  const joinedJamSessionsList = useMemo(() => {
    const rawJoined = user?.studentProfile?.joinedJamSessions || [];
    const joinedMap = new Map();

    rawJoined.forEach((item) => {
      const idKey = String(item.sessionId || item._id || '');
      if (idKey) joinedMap.set(idKey, item);
    });

    // Also include any published jam sessions marked joined === true by the backend
    const combined = [];
    const seenIds = new Set();

    publishedJamSessions.forEach((session) => {
      const sessionIdStr = String(session.id || session._id || '');
      const studentRecord = joinedMap.get(sessionIdStr);

      if (session.joined || studentRecord) {
        seenIds.add(sessionIdStr);
        combined.push({
          id: sessionIdStr,
          title: session.title || studentRecord?.title || 'Jam Session',
          lawyerName: session.lawyerName || session.author || 'Lawyer',
          profileImage: session.profileImage || '',
          avatar: session.avatar || (session.lawyerName || 'L').charAt(0).toUpperCase(),
          topic: session.topic || 'Legal Case Discussion',
          schedule: session.schedule || session.time || 'Scheduled',
          location: session.location || 'Online / TBA',
          summary: session.summary || session.content || '',
          participantCount: session.participantCount || 1,
          joinedAt: studentRecord?.joinedAt || session.createdAt,
        });
      }
    });

    // Add any rawJoined items not found in published array
    rawJoined.forEach((item) => {
      const idKey = String(item.sessionId || item._id || '');
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        combined.push({
          id: idKey,
          title: item.title || 'Jam Session',
          lawyerName: 'Host Lawyer',
          profileImage: '',
          avatar: 'J',
          topic: 'Case Discussion',
          schedule: 'Scheduled',
          location: 'Online / TBA',
          summary: '',
          participantCount: 1,
          joinedAt: item.joinedAt,
        });
      }
    });

    return combined.sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0));
  }, [user?.studentProfile?.joinedJamSessions, publishedJamSessions]);

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0b1f44]">Your Applications</h1>
          <p className="mt-2 text-base md:text-lg text-[#5e6c87]">
            Track and manage all your internship applications and joined jam sessions in one place.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#dbe2ef] pb-4">
          <button
            type="button"
            onClick={() => handleTabChange('internships')}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-base font-bold transition-all ${
              activeTab === 'internships'
                ? 'bg-[#f1d15f] text-zinc-950 border border-[#d6b85b] shadow-sm'
                : 'bg-white text-[#5e6c87] border border-[#dbe2ef] hover:bg-[#f8faff] hover:text-[#0b1f44]'
            }`}
          >
            <BriefcaseBusiness size={18} />
            Internships ({internshipApplicationsList.length})
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('jamSessions')}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-base font-bold transition-all ${
              activeTab === 'jamSessions'
                ? 'bg-[#f1d15f] text-zinc-950 border border-[#d6b85b] shadow-sm'
                : 'bg-white text-[#5e6c87] border border-[#dbe2ef] hover:bg-[#f8faff] hover:text-[#0b1f44]'
            }`}
          >
            <Users size={18} />
            Jam Sessions ({joinedJamSessionsList.length})
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 text-[#5e6c87] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            Loading your applications...
          </div>
        ) : activeTab === 'internships' ? (
          internshipApplicationsList.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-10 text-center shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4bf] text-[#755617]">
                <FileText size={32} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#0b1f44]">You haven't applied to any internships yet.</h2>
              <p className="mt-2 text-[#5e6c87]">
                Explore open internship opportunities from verified lawyers and firms to get started.
              </p>
              <Link
                to="/student-explore?tab=internships"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-6 py-3 font-bold border border-[#d6b85b] shadow-sm transition-colors"
              >
                <BriefcaseBusiness size={18} />
                Explore Internships
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {internshipApplicationsList.map((app) => {
                const badge = getStatusBadge(app.status);

                return (
                  <article
                    key={app.id}
                    className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(11,31,68,0.06)]"
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          {app.profileImage ? (
                            <img src={app.profileImage} alt={app.lawyerName} className="h-16 w-16 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#779bf6] to-[#456be8] text-xl font-bold text-white shrink-0">
                              {app.avatar}
                            </div>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="text-2xl font-bold text-[#0b1f44]">{app.title}</h2>
                              <span className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="mt-1 text-base font-semibold text-[#44516d]">{app.lawyerName}</p>
                            {app.appliedAt ? (
                              <p className="mt-1 text-xs text-[#7d8aa5]">
                                Applied on {formatAppliedTime(app.appliedAt)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {app.description ? (
                        <p className="text-base leading-7 text-[#243b67]">{app.description}</p>
                      ) : null}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-[#f7f9fd] p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7d8aa5]">
                            <MapPin size={15} /> Location
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#0b1f44]">{app.location}</p>
                        </div>
                        <div className="rounded-2xl bg-[#f7f9fd] p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7d8aa5]">
                            <CalendarDays size={15} /> Duration
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#0b1f44]">{app.duration}</p>
                        </div>
                        <div className="rounded-2xl bg-[#f7f9fd] p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7d8aa5]">
                            <IndianRupee size={15} /> Stipend
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#0b1f44]">{app.stipend}</p>
                        </div>
                      </div>

                      {app.skills?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#7d8aa5]">Required Skills</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {app.skills.map((skill) => (
                              <span key={skill} className="rounded-full border border-[#dbe2ef] bg-[#fbfcff] px-3 py-1.5 text-xs font-semibold text-[#0b1f44]">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.coverMessage ? (
                        <div className="rounded-2xl border border-[#e3e8f3] bg-[#fcfdff] p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#7d8aa5]">Your Cover Message</p>
                          <p className="mt-1 text-sm leading-6 text-[#44516d]">{app.coverMessage}</p>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          joinedJamSessionsList.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-10 text-center shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4bf] text-[#755617]">
                <Users size={32} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#0b1f44]">You haven't joined any jam sessions yet.</h2>
              <p className="mt-2 text-[#5e6c87]">
                Join live case discussions and interactive sessions with experienced lawyers and peers.
              </p>
              <Link
                to="/student-explore?tab=jamSessions"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-6 py-3 font-bold border border-[#d6b85b] shadow-sm transition-colors"
              >
                <Users size={18} />
                Explore Jam Sessions
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {joinedJamSessionsList.map((session) => (
                <article
                  key={session.id}
                  className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(11,31,68,0.06)]"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        {session.profileImage ? (
                          <img src={session.profileImage} alt={session.lawyerName} className="h-16 w-16 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1e293b] to-[#334155] text-xl font-bold text-white shrink-0">
                            {session.avatar}
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold text-[#0b1f44]">{session.title}</h2>
                            <span className="rounded-full bg-[#f1d15f]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#755617] border border-[#d6b85b]/40">
                              Joined ✓
                            </span>
                          </div>
                          <p className="mt-1 text-base font-semibold text-[#44516d]">Hosted by {session.lawyerName}</p>
                        </div>
                      </div>

                      <span className="rounded-full bg-[#f0e3ff] px-4 py-1.5 text-xs font-bold text-[#8c2bff] self-start">
                        {session.topic}
                      </span>
                    </div>

                    {session.summary ? (
                      <p className="text-base leading-7 text-[#243b67]">{session.summary}</p>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-[#f7f9fd] p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7d8aa5]">
                          <Clock3 size={15} /> Schedule
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[#0b1f44]">{session.schedule}</p>
                      </div>
                      <div className="rounded-2xl bg-[#f7f9fd] p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7d8aa5]">
                          <MapPin size={15} /> Format / Location
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[#0b1f44]">{session.location}</p>
                      </div>
                      <div className="rounded-2xl bg-[#f7f9fd] p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7d8aa5]">
                          <Users size={15} /> Participants
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[#0b1f44]">{session.participantCount} joined</p>
                      </div>
                    </div>

                    <div className="border-t border-[#e3e8f3] pt-4">
                      <span className="text-xs text-[#7d8aa5]">
                        Joined on {formatAppliedTime(session.joinedAt)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </div>
    </StudentLayout>
  );
}
