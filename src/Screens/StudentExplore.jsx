import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios.jsx';
import StudentLayout from './StudentLayout.jsx';
import StudentOpportunityCard from '../components/student/StudentOpportunityCard.jsx';
import { InternshipApplicationModal, JamJoinModal } from '../components/student/StudentActionModals.jsx';
import {
  createInitialApplicationForm,
  createInitialInternshipFilters,
  DISCOVERY_TABS,
  buildInternshipApplicationFormData,
  extractNumericValue,
  internshipSortOptions,
  matchesCollectionSearch,
  uniqueOptions,
} from '../components/student/studentDiscoveryUtils.js';
import { updateUser } from '../redux/authSlice.jsx';

const getDisplayName = (lawyer) => (
  `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim() || lawyer.name || 'Lawyer'
);

const normalizeLawyerCard = (lawyer) => ({
  id: lawyer._id || lawyer.id,
  name: getDisplayName(lawyer),
  profileImage: lawyer.profileImage || '',
  avatar: getDisplayName(lawyer).charAt(0).toUpperCase(),
  specialization: lawyer.lawyerProfile?.specialization || lawyer.specialization || 'General Practice',
  location: lawyer.address?.city || lawyer.address?.district || lawyer.address?.state || 'India',
  verified: Boolean(lawyer.lawyerProfile?.isVerified || lawyer.verified),
});

// Student discovery loads opportunities directly without requiring student location.
export default function StudentExplore() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'internships');
  const [searchTerm, setSearchTerm] = useState('');
  const [internshipFilters, setInternshipFilters] = useState(createInitialInternshipFilters());
  const [discovery, setDiscovery] = useState({ internships: [], jamSessions: [], lawyers: [] });
  const hasActiveInternshipFilters = Object.entries(internshipFilters).some(([key, value]) => (
    value !== createInitialInternshipFilters()[key]
  ));

  const clearInternshipFilters = () => {
    setInternshipFilters(createInitialInternshipFilters());
  };
  const [loading, setLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [applicationTarget, setApplicationTarget] = useState(null);
  const [joinTarget, setJoinTarget] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [joiningSession, setJoiningSession] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (DISCOVERY_TABS.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadDiscovery = async () => {
      try {
        setLoading(true);
        setDiscoveryError('');
        const [internshipsResponse, jamSessionsResponse, lawyersResponse] = await Promise.all([
          api.get('/auth/published-internships'),
          api.get('/auth/published-jam-sessions'),
          api.get('/auth/lawyers'),
        ]);

        const rawInternships = Array.isArray(internshipsResponse.data?.internships)
          ? internshipsResponse.data.internships
          : Array.isArray(internshipsResponse.data)
            ? internshipsResponse.data
            : [];

        const rawJamSessions = Array.isArray(jamSessionsResponse.data?.jamSessions)
          ? jamSessionsResponse.data.jamSessions
          : Array.isArray(jamSessionsResponse.data)
            ? jamSessionsResponse.data
            : [];

        const rawLawyers = Array.isArray(lawyersResponse.data?.lawyers)
          ? lawyersResponse.data.lawyers
          : Array.isArray(lawyersResponse.data)
            ? lawyersResponse.data
            : [];

        const internshipsData = rawInternships.map((item) => ({
          ...item,
          lawyerName: item.lawyerName || item.creatorName || item.author || 'Lawyer',
          specialization: Array.isArray(item.specialization)
            ? item.specialization
            : item.specialization
              ? [String(item.specialization)]
              : [],
        }));

        const jamSessionsData = rawJamSessions.map((item) => ({
          ...item,
          lawyerName: item.lawyerName || item.creatorName || item.author || 'Lawyer',
        }));

        setDiscovery({
          internships: internshipsData,
          jamSessions: jamSessionsData,
          lawyers: rawLawyers.map(normalizeLawyerCard),
        });
      } catch (error) {
        console.error('Error loading student discovery data:', error);
        setDiscoveryError(error.response?.data?.message || 'Unable to load opportunities right now.');
        setDiscovery({ internships: [], jamSessions: [], lawyers: [] });
      } finally {
        setLoading(false);
      }
    };

    loadDiscovery();
  }, []);

  const locationOptions = useMemo(
    () => uniqueOptions(discovery.internships.map((item) => item.location), 'All locations'),
    [discovery.internships]
  );
  const specializationOptions = useMemo(
    () => uniqueOptions(discovery.internships.flatMap((item) => item.specialization || []), 'All specializations'),
    [discovery.internships]
  );
  const durationOptions = useMemo(
    () => uniqueOptions(discovery.internships.map((item) => item.duration), 'All durations'),
    [discovery.internships]
  );
  const stipendOptions = useMemo(
    () => uniqueOptions(discovery.internships.map((item) => item.stipend), 'All stipends'),
    [discovery.internships]
  );

  const filteredInternships = useMemo(() => {
    const filtered = discovery.internships.filter((internship) => {
      const matchesSearch = matchesCollectionSearch(
        [
          internship.title,
          internship.lawyerName,
          internship.location,
          ...(internship.specialization || []),
        ],
        searchTerm
      );

      const matchesLocation =
        internshipFilters.location === 'All locations' || internship.location === internshipFilters.location;
      const matchesSpecialization =
        internshipFilters.specialization === 'All specializations' ||
        internship.specialization?.includes(internshipFilters.specialization);
      const matchesDuration =
        internshipFilters.duration === 'All durations' || internship.duration === internshipFilters.duration;
      const matchesStipend =
        internshipFilters.stipend === 'All stipends' || internship.stipend === internshipFilters.stipend;

      return matchesSearch && matchesLocation && matchesSpecialization && matchesDuration && matchesStipend;
    });

    return filtered.sort((first, second) => {
      if (internshipFilters.sortBy === 'highestStipend') {
        return extractNumericValue(second.stipend) - extractNumericValue(first.stipend);
      }

      return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
    });
  }, [discovery.internships, internshipFilters, searchTerm]);

  const filteredJamSessions = useMemo(() => {
    return discovery.jamSessions.filter((session) =>
      matchesCollectionSearch(
        [session.title, session.lawyerName, session.location, session.schedule, session.topic],
        searchTerm
      )
    );
  }, [discovery.jamSessions, searchTerm]);

  const filteredLawyers = useMemo(() => {
    return discovery.lawyers.filter((lawyer) =>
      matchesCollectionSearch([lawyer.name, lawyer.specialization, lawyer.location], searchTerm)
    );
  }, [discovery.lawyers, searchTerm]);

  const handleApply = async (values) => {
    if (!applicationTarget) return;

    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'collegeName',
      'degree',
      'yearOfStudy',
    ];

    if (requiredFields.some((field) => !String(values[field] || '').trim())) {
      setActionError('Please complete all required fields before submitting.');
      return;
    }

    if (!values.skills.length) {
      setActionError('Please add at least one skill.');
      return;
    }

    try {
      setSubmittingApplication(true);
      setActionError('');
      const { data } = await api.post(
        `/auth/student/internships/${applicationTarget.id}/apply`,
        buildInternshipApplicationFormData(values),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      dispatch(updateUser(data.user));
      setDiscovery((current) => ({
        ...current,
        internships: current.internships.map((post) =>
          post.id === applicationTarget.id ? { ...post, applied: true, applicationCount: (post.applicationCount || 0) + 1 } : post
        ),
      }));
      setApplicationTarget(null);
    } catch (error) {
      console.error('Error submitting internship application:', error);
      setActionError(error.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleJoin = async (values) => {
    if (!joinTarget) return;

    if (!String(values.name || '').trim()) {
      setActionError('Please enter your name to join the session.');
      return;
    }

    try {
      setJoiningSession(true);
      setActionError('');
      const { data } = await api.post(`/auth/student/jam-sessions/${joinTarget.id}/join`, values);
      dispatch(updateUser(data.user));
      setDiscovery((current) => ({
        ...current,
        jamSessions: current.jamSessions.map((post) =>
          post.id === joinTarget.id
            ? { ...post, joined: true, participantCount: data.participantCount ?? post.participantCount }
            : post
        ),
      }));
      setJoinTarget(null);
    } catch (error) {
      console.error('Error joining jam session:', error);
      setActionError(error.response?.data?.message || 'Failed to join session.');
    } finally {
      setJoiningSession(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0b1f44] sm:text-4xl md:text-5xl">Explore Opportunities</h1>
          <p className="mt-3 text-base text-[#5e6c87] sm:text-lg">
            Search across internships, jam sessions, and lawyers from one place.
          </p>
        </div>

        <section className="min-w-0 rounded-[28px] border border-[#dbe2ef] bg-white p-4 shadow-[0_2px_12px_rgba(11,31,68,0.04)] sm:p-6">
          {discoveryError ? (
            <p className="mb-5 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm font-medium text-[#c2410c]">
              {discoveryError}
            </p>
          ) : null}

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              {DISCOVERY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-[#f1d15f] text-zinc-950 font-bold border border-[#d6b85b] shadow-sm'
                      : 'bg-[#f4f6fb] text-[#44516d] hover:bg-[#e8f7f2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f4f6fb] px-4 py-4">
                <Search className="text-[#93a0b6]" size={20} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="text"
                  placeholder="Search titles, lawyer names, specializations, or locations..."
                  className="w-full bg-transparent outline-none text-[#0b1f44] placeholder:text-[#7f8ba2]"
                />
              </div>

              {activeTab === 'internships' ? (
                <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-6">
                  <FilterSelect
                    icon={<SlidersHorizontal size={18} className="text-[#7f8ba2]" />}
                    value={internshipFilters.location}
                    options={locationOptions}
                    onChange={(value) => setInternshipFilters((current) => ({ ...current, location: value }))}
                  />
                  <FilterSelect
                    value={internshipFilters.specialization}
                    options={specializationOptions}
                    onChange={(value) => setInternshipFilters((current) => ({ ...current, specialization: value }))}
                  />
                  <FilterSelect
                    value={internshipFilters.duration}
                    options={durationOptions}
                    onChange={(value) => setInternshipFilters((current) => ({ ...current, duration: value }))}
                  />
                  <FilterSelect
                    value={internshipFilters.stipend}
                    options={stipendOptions}
                    onChange={(value) => setInternshipFilters((current) => ({ ...current, stipend: value }))}
                  />
                  <FilterSelect
                    value={internshipFilters.sortBy}
                    options={internshipSortOptions.map((item) => item.id)}
                    labels={Object.fromEntries(internshipSortOptions.map((item) => [item.id, item.label]))}
                    onChange={(value) => setInternshipFilters((current) => ({ ...current, sortBy: value }))}
                  />
                  <button
                    type="button"
                    onClick={clearInternshipFilters}
                    disabled={!hasActiveInternshipFilters}
                    className="rounded-2xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-bold text-[#062552] transition hover:border-[#15a276] hover:bg-[#e8f7f2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <p className="text-[18px] text-[#44516d]">
          {activeTab === 'internships'
            ? `${filteredInternships.length} internships found`
            : activeTab === 'jamSessions'
              ? `${filteredJamSessions.length} jam sessions found`
              : `${filteredLawyers.length} lawyers found`}
        </p>

        {loading ? (
          <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            Loading discovery data...
          </div>
        ) : activeTab === 'internships' ? (
          <div className="space-y-6">
            {filteredInternships.length === 0 ? (
              <EmptyState message="No internships match your current search and filters." />
            ) : (
              filteredInternships.map((internship) => (
                <StudentOpportunityCard
                  key={internship.id}
                  post={internship}
                  mode="explore"
                  onApply={(target) => {
                    setActionError('');
                    setApplicationTarget(target);
                  }}
                />
              ))
            )}
          </div>
        ) : activeTab === 'jamSessions' ? (
          <div className="space-y-6">
            {filteredJamSessions.length === 0 ? (
              <EmptyState message="No jam sessions match your current search." />
            ) : (
              filteredJamSessions.map((session) => (
                <StudentOpportunityCard
                  key={session.id}
                  post={session}
                  mode="explore"
                  onJoin={(target) => {
                    setActionError('');
                    setJoinTarget(target);
                  }}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredLawyers.length === 0 ? (
              <div className="col-span-full">
                <EmptyState message="No lawyers match your current search." />
              </div>
            ) : (
              filteredLawyers.map((lawyer) => (
                <article
                  key={lawyer.id}
                  className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]"
                >
                  <div className="flex items-start gap-4">
                    {lawyer.profileImage ? (
                      <img src={lawyer.profileImage} alt={lawyer.name} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#244ed8] to-[#6ca6ff] text-xl font-bold text-white">
                        {lawyer.avatar}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-[20px] font-semibold text-[#0b1f44]">{lawyer.name}</h2>
                        {lawyer.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ebfff4] px-3 py-1 text-xs font-semibold text-[#0e8f5b]">
                            <ShieldCheck size={14} />
                            Verified
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-[15px] text-[#33415c]">{lawyer.specialization}</p>
                      <p className="mt-2 text-[14px] text-[#6d7a92]">{lawyer.location}</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>

      <InternshipApplicationModal
        key={applicationTarget?.id || 'application-closed'}
        open={Boolean(applicationTarget)}
        internship={applicationTarget}
        initialValues={createInitialApplicationForm(user)}
        submitting={submittingApplication}
        error={actionError}
        onClose={() => {
          setApplicationTarget(null);
          setActionError('');
        }}
        onSubmit={handleApply}
      />

      <JamJoinModal
        key={joinTarget?.id || 'join-closed'}
        open={Boolean(joinTarget)}
        session={joinTarget}
        defaultName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
        defaultEmail={user?.email || ''}
        submitting={joiningSession}
        error={actionError}
        onClose={() => {
          setJoinTarget(null);
          setActionError('');
        }}
        onSubmit={handleJoin}
      />
    </StudentLayout>
  );
}

function FilterSelect({ icon, value, options, labels = {}, onChange }) {
  return (
    <div className="relative min-w-0">
      {icon ? <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">{icon}</div> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full min-w-0 appearance-none rounded-xl bg-[#f4f6fb] py-3 text-xs sm:rounded-2xl sm:py-4 sm:text-sm ${
          icon ? 'pl-12' : 'pl-4'
        } pr-12 text-sm font-medium text-[#0b1f44] outline-none`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a1acc0]" size={18} />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
      {message}
    </div>
  );
}
