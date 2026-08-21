import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { updateUser } from '../redux/authSlice.jsx';

const applicationStatusFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

const jamSessionFilters = [
  { value: 'all', label: 'All' },
  { value: 'joined', label: 'Joined' },
];

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
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'jamSessions' ? 'jamSessions' : 'internships';
  const requestedStatus = searchParams.get('status');
  const activeStatusFilter = applicationStatusFilters.some((filter) => filter.value === requestedStatus)
    ? requestedStatus
    : 'all';
  const requestedJamFilter = searchParams.get('jamFilter');
  const activeJamFilter = jamSessionFilters.some((filter) => filter.value === requestedJamFilter)
    ? requestedJamFilter
    : 'all';

  const [loading, setLoading] = useState(true);
  const [publishedInternships, setPublishedInternships] = useState([]);
  const [publishedJamSessions, setPublishedJamSessions] = useState([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [profileRes, internshipsRes, jamRes] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/auth/published-internships'),
          api.get('/auth/published-jam-sessions'),
        ]);

        if (!active) return;

        if (profileRes.status === 'fulfilled') {
          dispatch(updateUser(profileRes.value.data));
        }

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
  }, [dispatch]);

  const handleTabChange = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (tab === 'jamSessions') next.delete('status');
    else next.delete('jamFilter');
    setSearchParams(next, { replace: true });
  };

  const handleStatusFilterChange = (status) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'internships');
    if (status === 'all') next.delete('status');
    else next.set('status', status);
    setSearchParams(next, { replace: true });
  };

  const handleJamFilterChange = (filter) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'jamSessions');
    if (filter === 'all') next.delete('jamFilter');
    else next.set('jamFilter', filter);
    setSearchParams(next, { replace: true });
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
          isJoined: true,
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
          isJoined: true,
        });
      }
    });

    return combined.sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0));
  }, [user?.studentProfile?.joinedJamSessions, publishedJamSessions]);

  const allJamSessionsList = useMemo(() => (
    publishedJamSessions.map((session) => ({
      id: String(session.id || session._id || ''),
      title: session.title || 'Jam Session',
      lawyerName: session.lawyerName || session.author || 'Lawyer',
      profileImage: session.profileImage || '',
      avatar: session.avatar || (session.lawyerName || session.author || 'L').charAt(0).toUpperCase(),
      topic: session.topic || 'Legal Case Discussion',
      schedule: session.schedule || session.time || 'Scheduled',
      location: session.location || 'Online / TBA',
      summary: session.summary || session.content || '',
      participantCount: session.participantCount || 0,
      joinedAt: session.joinedAt || session.createdAt,
      isJoined: Boolean(session.joined),
    }))
  ), [publishedJamSessions]);

  const filteredInternshipApplications = useMemo(() => (
    activeStatusFilter === 'all'
      ? internshipApplicationsList
      : internshipApplicationsList.filter((application) => (
        String(application.status || 'pending').toLowerCase() === activeStatusFilter
      ))
  ), [activeStatusFilter, internshipApplicationsList]);

  const filteredJamSessions = activeJamFilter === 'joined' ? joinedJamSessionsList : allJamSessionsList;

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
        <div className="student-application-tabs flex items-center gap-3 border-b border-[#dbe2ef] pb-4">
          <button
            type="button"
            onClick={() => handleTabChange('internships')}
            className={`inline-flex items-center gap-2 rounded-2xl px-3 py-3 text-base font-bold transition-all sm:px-5 ${
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
            className={`inline-flex items-center gap-2 rounded-2xl px-3 py-3 text-base font-bold transition-all sm:px-5 ${
              activeTab === 'jamSessions'
                ? 'bg-[#f1d15f] text-zinc-950 border border-[#d6b85b] shadow-sm'
                : 'bg-white text-[#5e6c87] border border-[#dbe2ef] hover:bg-[#f8faff] hover:text-[#0b1f44]'
            }`}
          >
            <Users size={18} />
            Jam Sessions ({joinedJamSessionsList.length})
          </button>
        </div>

        {activeTab === 'internships' ? (
          <div className="flex flex-wrap items-center gap-2" aria-label="Filter internship applications by status">
            {applicationStatusFilters.map((filter) => {
              const count = filter.value === 'all'
                ? internshipApplicationsList.length
                : internshipApplicationsList.filter((application) => String(application.status || 'pending').toLowerCase() === filter.value).length;
              const isActive = activeStatusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleStatusFilterChange(filter.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    isActive
                      ? 'border-[#d6b85b] bg-[#f1d15f] text-zinc-950'
                      : 'border-[#dbe2ef] bg-white text-[#5e6c87] hover:border-[#d6b85b] hover:text-[#0b1f44]'
                  }`}
                >
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>
        ) : null}

        {activeTab === 'jamSessions' ? (
          <div className="flex flex-wrap items-center gap-2" aria-label="Filter jam sessions">
            {jamSessionFilters.map((filter) => {
              const count = filter.value === 'all' ? allJamSessionsList.length : joinedJamSessionsList.length;
              const isActive = activeJamFilter === filter.value;
              return (
                <button key={filter.value} type="button" onClick={() => handleJamFilterChange(filter.value)} className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${isActive ? 'border-[#d6b85b] bg-[#f1d15f] text-zinc-950' : 'border-[#dbe2ef] bg-white text-[#5e6c87] hover:border-[#d6b85b] hover:text-[#0b1f44]'}`}>
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Content Section */}
        {loading ? (
          <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 text-[#5e6c87] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            Loading your applications...
          </div>
        ) : activeTab === 'internships' ? (
          filteredInternshipApplications.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-10 text-center shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4bf] text-[#755617]">
                <FileText size={32} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#0b1f44]">
                {internshipApplicationsList.length === 0 ? "You haven't applied to any internships yet." : `No ${activeStatusFilter} applications.`}
              </h2>
              <p className="mt-2 text-[#5e6c87]">
                {internshipApplicationsList.length === 0
                  ? 'Explore open internship opportunities from verified lawyers and firms to get started.'
                  : 'Choose another status filter to view your other applications.'}
              </p>
              {internshipApplicationsList.length === 0 ? (
                <Link to="/student-explore?tab=internships" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-6 py-3 font-bold border border-[#d6b85b] shadow-sm transition-colors">
                  <BriefcaseBusiness size={18} /> Explore Internships
                </Link>
              ) : (
                <button type="button" onClick={() => handleStatusFilterChange('all')} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-6 py-3 font-bold border border-[#d6b85b] shadow-sm transition-colors">
                  Show All Applications
                </button>
              )}
            </div>
          ) : (
            <div className="student-application-card-grid space-y-6">
              {filteredInternshipApplications.map((app) => {
                const badge = getStatusBadge(app.status);

                return (
                  <article
                    key={app.id}
                    className="student-internship-application-card rounded-[28px] border border-[#dbe2ef] bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(11,31,68,0.06)]"
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
          filteredJamSessions.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-10 text-center shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4bf] text-[#755617]">
                <Users size={32} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#0b1f44]">
                {activeJamFilter === 'joined' ? "You haven't joined any jam sessions yet." : 'No jam sessions are available right now.'}
              </h2>
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
            <div className="student-application-card-grid space-y-6">
              {filteredJamSessions.map((session) => (
                <article
                  key={session.id}
                  className="student-jam-application-card rounded-[28px] border border-[#dbe2ef] bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(11,31,68,0.06)]"
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
                            {session.isJoined ? (
                              <span className="rounded-full bg-[#f1d15f]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#755617] border border-[#d6b85b]/40">
                                Joined
                              </span>
                            ) : null}
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
                        {session.isJoined ? 'Joined' : 'Published'} on {formatAppliedTime(session.joinedAt)}
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
