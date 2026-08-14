import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import LocationSearchCard from '../components/location/LocationSearchCard.jsx';
import useSearchLocation from '../hooks/useSearchLocation.js';
import AppHeader from '../components/AppHeader.jsx';
import {
  formatDistanceLabel,
  getRadiusValue,
  RADIUS_FILTERS,
} from '../utils/lawyerDiscovery.js';

// Instant consult view that only shows nearby lawyers currently marked online.
const InstantConsult = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('10');
  const locationState = useSearchLocation();

  useEffect(() => {
    const loadNearbyOnlineLawyers = async () => {
      if (!locationState.location) return;

      try {
        setLoading(true);
        setError('');

        const radiusKm = getRadiusValue(selectedRadius);
        const params = {
          latitude: locationState.location.latitude,
          longitude: locationState.location.longitude,
          onlineOnly: true,
          limit: 12,
          radiusKm: radiusKm === 'all' ? 'all' : radiusKm,
        };

        const { data } = await api.get('/auth/lawyers/nearby', { params });
        setLawyers(Array.isArray(data?.lawyers) ? data.lawyers : []);
      } catch (requestError) {
        console.error('Error fetching nearby online lawyers:', requestError);
        setLawyers([]);
        setError(requestError.response?.data?.message || 'Unable to load online lawyers right now.');
      } finally {
        setLoading(false);
      }
    };

    loadNearbyOnlineLawyers();
  }, [locationState.location, selectedRadius]);

  const handleInstantConsult = (lawyer) => {
    const appointments = JSON.parse(localStorage.getItem('mockAppointments') || '[]');
    const activeUserId = user?._id || user?.id;
    const existing = appointments.find(
      (appointment) => appointment.lawyerId === lawyer._id && appointment.userId === activeUserId
    );

    if (!existing) {
      appointments.push({
        id: Date.now().toString(),
        lawyerId: lawyer._id,
        userId: activeUserId,
        userName: user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.name || 'User'),
        lawyerName: lawyer.name || 'Lawyer',
        status: 'Accepted',
        timestamp: new Date().toISOString(),
        isInstant: true,
      });
      localStorage.setItem('mockAppointments', JSON.stringify(appointments));
    } else if (existing.status !== 'Accepted') {
      existing.status = 'Accepted';
      localStorage.setItem('mockAppointments', JSON.stringify(appointments));
    }

    const partnerId = lawyer?._id || lawyer?.id;
    if (!partnerId) return;

    navigate(`/chat?partnerId=${encodeURIComponent(partnerId)}`, {
      state: { selectedPartner: lawyer, returnTo: '/instant-consult' },
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f8fb]">
      <AppHeader variant="user" profileTo="/profile" showBackButton backTo="/user-home" />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0b1f44]">Nearby Online Lawyers</h1>
              <p className="mt-2 text-sm text-[#5e6c87]">
                We only show lawyers currently available for direct consultation and sort them by distance.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              LIVE
            </div>
          </div>
        </div>

        <LocationSearchCard
          title="Consult a Lawyer Near You"
          description="Use your location to see online lawyers closest to you, or choose a fallback city if permission is denied."
          error={error || locationState.error}
          loading={locationState.status === 'requesting'}
          location={locationState.location}
          needsCityFallback={locationState.needsCityFallback}
          onRequestLocation={locationState.requestBrowserLocation}
          onSearchLocation={locationState.searchLocation}
          onSelectFallbackCity={locationState.selectFallbackCity}
          searchingLocation={locationState.citySearchStatus === 'searching'}
        />

        <div className="flex flex-wrap gap-3">
          {RADIUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSelectedRadius(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedRadius === filter.id
                  ? 'bg-[#15a276] text-white'
                  : 'bg-white text-[#44516d] border border-[#dbe2ef] hover:border-emerald-500'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {locationState.status === 'requesting' || loading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[#5e6c87] shadow-sm">
            Finding online lawyers near you...
          </div>
        ) : !locationState.location ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[#5e6c87] shadow-sm">
            Choose your location to start an instant consultation.
          </div>
        ) : lawyers.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-[#0b1f44]">No online lawyers are nearby right now.</p>
            <p className="mt-2 text-sm text-[#5e6c87]">
              Try a larger radius or switch to another city.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lawyers.map((lawyer) => (
              <article
                key={lawyer._id}
                className="rounded-3xl border border-[#dbe2ef] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-emerald-50">
                    {lawyer.profileImage ? (
                      <img src={lawyer.profileImage} alt={lawyer.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-emerald-600">
                        {lawyer.name?.charAt(0) || 'L'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-[#0b1f44]">{lawyer.name}</h2>
                        <p className="text-sm font-medium text-emerald-600">
                          {lawyer.specialization || 'General Practice'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-[#fff7e5] px-3 py-1 text-sm font-semibold text-[#b7791f]">
                        <Star size={14} fill="currentColor" />
                        {Number(lawyer.rating || 4.8).toFixed(1)}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#5e6c87]">
                      <span>{lawyer.experienceYears || 0} years experience</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {lawyer.city || lawyer.locationLabel || 'Location not added'}
                      </span>
                      <span>{formatDistanceLabel(lawyer.distanceKm)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleInstantConsult(lawyer)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15a276] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#118b66]"
                >
                  <MessageCircle size={18} />
                  Direct Consult Now
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstantConsult;
