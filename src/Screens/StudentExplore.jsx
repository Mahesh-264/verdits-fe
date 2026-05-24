import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios.jsx';
import LocationSearchCard from '../components/location/LocationSearchCard.jsx';
import StudentLayout from './StudentLayout.jsx';
import StudentOpportunityCard from '../components/student/StudentOpportunityCard.jsx';
import { InternshipApplicationModal, JamJoinModal } from '../components/student/StudentActionModals.jsx';
import useSearchLocation from '../hooks/useSearchLocation.js';
import {
  createInitialApplicationForm,
  createInitialInternshipFilters,
  DISCOVERY_TABS,
  extractNumericValue,
  internshipSortOptions,
  matchesCollectionSearch,
  uniqueOptions,
} from '../components/student/studentDiscoveryUtils.js';
import { formatDistanceLabel, getRadiusValue, RADIUS_FILTERS } from '../utils/lawyerDiscovery.js';
import { updateUser } from '../redux/authSlice.jsx';

// Student discovery now prioritizes nearby lawyers and their opportunities.
export default function StudentExplore() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('internships');
  const [searchTerm, setSearchTerm] = useState('');
  const [internshipFilters, setInternshipFilters] = useState(createInitialInternshipFilters());
  const [discovery, setDiscovery] = useState({ internships: [], jamSessions: [], lawyers: [] });
  const [loading, setLoading] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState('25');
  const [discoveryError, setDiscoveryError] = useState('');
  const [applicationTarget, setApplicationTarget] = useState(null);
  const [joinTarget, setJoinTarget] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [joiningSession, setJoiningSession] = useState(false);
  const [actionError, setActionError] = useState('');
  const locationState = useSearchLocation();

  useEffect(() => {
    const loadDiscovery = async () => {
      if (!locationState.location) return;

      try {
        setLoading(true);
        setDiscoveryError('');
        const radiusKm = getRadiusValue(selectedRadius);
        const { data } = await api.get('/auth/student/discovery', {
          params: {
            latitude: locationState.location.latitude,
            longitude: locationState.location.longitude,
            radiusKm: radiusKm === 'all' ? 'all' : radiusKm,
            limit: 36,
          },
        });
        setDiscovery({
          internships: Array.isArray(data?.internships) ? data.internships : [],
          jamSessions: Array.isArray(data?.jamSessions) ? data.jamSessions : [],
          lawyers: Array.isArray(data?.lawyers) ? data.lawyers : [],
        });
      } catch (error) {
        console.error('Error loading student discovery data:', error);
        setDiscoveryError(error.response?.data?.message || 'Unable to load nearby opportunities right now.');
        setDiscovery({ internships: [], jamSessions: [], lawyers: [] });
      } finally {
        setLoading(false);
      }
    };

    loadDiscovery();
  }, [locationState.location, selectedRadius]);

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
      const { data } = await api.post(`/auth/student/internships/${applicationTarget.id}/apply`, values);
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
          post.id === joinTarget.id ? { ...post, joined: true, participantCount: (post.participantCount || 0) + 1 } : post
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
          <h1 className="text-4xl font-bold tracking-tight text-[#0b1f44] md:text-5xl">Explore Opportunities</h1>
          <p className="mt-3 text-lg text-[#5e6c87]">
            Search across internships, jam sessions, and lawyers from one place.
          </p>
        </div>

        <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          <LocationSearchCard
            title="Nearby Opportunities"
            description="Student discovery now prioritizes nearby lawyers, internships, and mentor sessions."
            error={discoveryError || locationState.error}
            loading={locationState.status === 'requesting'}
            location={locationState.location}
            needsCityFallback={locationState.needsCityFallback}
            onRequestLocation={locationState.requestBrowserLocation}
            onSelectFallbackCity={locationState.selectFallbackCity}
          />

          <div className="mt-5 flex flex-wrap gap-3">
            {RADIUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedRadius(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedRadius === filter.id
                    ? 'bg-[#0d1024] text-white'
                    : 'bg-[#f4f6fb] text-[#44516d] hover:bg-[#eaf1ff]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              {DISCOVERY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-[#0d1024] text-white'
                      : 'bg-[#f4f6fb] text-[#44516d] hover:bg-[#eaf1ff]'
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

        {!locationState.location ? (
          <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            Choose your location to discover nearby lawyers, internships, and sessions.
          </div>
        ) : loading ? (
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
                      <p className="mt-2 text-[14px] font-medium text-[#2456f5]">
                        {formatDistanceLabel(lawyer.distanceKm)}
                      </p>
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
    <div className="relative min-w-[170px]">
      {icon ? <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">{icon}</div> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full appearance-none rounded-2xl bg-[#f4f6fb] py-4 ${
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
