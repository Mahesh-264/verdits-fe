import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import api from '../api/axios';
import LocationSearchCard from '../components/location/LocationSearchCard.jsx';
import useSearchLocation from '../hooks/useSearchLocation.js';
import AppHeader from '../components/AppHeader.jsx';
import {
  formatDistanceLabel,
  getCategoryDiscoveryConfig,
  getRadiusValue,
  RADIUS_FILTERS,
} from '../utils/lawyerDiscovery.js';

// Book-a-lawyer discovery page powered by backend geospatial search.
const LawyerList = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('25');
  const locationState = useSearchLocation();

  useEffect(() => {
    const loadNearbyLawyers = async () => {
      if (!locationState.location) return;

      try {
        setLoading(true);
        setError('');

        const categoryConfig = getCategoryDiscoveryConfig(category);
        const radiusKm = getRadiusValue(selectedRadius);
        const params = {
          latitude: locationState.location.latitude,
          longitude: locationState.location.longitude,
          limit: 30,
        };

        if (radiusKm !== 'all') {
          params.radiusKm = radiusKm;
        } else {
          params.radiusKm = 'all';
        }

        if (categoryConfig.specializationTerms.length) {
          params.specialization = categoryConfig.specializationTerms.join(',');
        }

        const { data } = await api.get('/auth/lawyers/nearby', { params });
        setLawyers(Array.isArray(data?.lawyers) ? data.lawyers : []);
      } catch (requestError) {
        console.error('Error fetching nearby lawyers:', requestError);
        setLawyers([]);
        setError(requestError.response?.data?.message || 'Unable to load nearby lawyers right now.');
      } finally {
        setLoading(false);
      }
    };

    loadNearbyLawyers();
  }, [category, locationState.location, selectedRadius]);

  const categoryConfig = getCategoryDiscoveryConfig(category);

  return (
    <div className="min-h-screen bg-[#f3f8fb]">
      <AppHeader variant="user" profileTo="/profile" showBackButton backTo="/book-lawyer" />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nearby Lawyers</h1>
          <p className="mt-2 text-sm text-gray-500">
            Showing {categoryConfig.label} lawyers nearest to you.
          </p>
        </div>

        <LocationSearchCard
          title="Book a Lawyer Nearby"
          description="Allow location access to discover lawyers closest to you, or choose a city as a fallback."
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
                  ? 'location-radius-active bg-[#062552] text-white'
                  : 'bg-white text-[#44516d] border border-[#dbe2ef] hover:border-[#15a276]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {locationState.status === 'requesting' || loading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[#5e6c87] shadow-sm">
            Finding the closest lawyers for you...
          </div>
        ) : !locationState.location ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[#5e6c87] shadow-sm">
            Choose your location to see nearby lawyers.
          </div>
        ) : lawyers.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-[#0b1f44]">No nearby lawyers found.</p>
            <p className="mt-2 text-sm text-[#5e6c87]">
              Try a larger search radius or switch to another city.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {lawyers.map((lawyer) => (
              <article
                key={lawyer._id || lawyer.id}
                onClick={() => navigate(`/lawyer-profile/${lawyer._id || lawyer.id}`)}
                className="cursor-pointer rounded-3xl border border-[#dbe2ef] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-[#e8f7f2]">
                    {lawyer.profileImage ? (
                      <img src={lawyer.profileImage} alt={lawyer.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#15a276]">
                        {lawyer.name?.charAt(0) || 'L'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-[#0b1f44]">{lawyer.name}</h2>
                        <p className="text-sm font-medium text-[#15a276]">
                          {lawyer.specialization || 'General Practice'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start rounded-full bg-[#fff7e5] px-3 py-1 text-sm font-semibold text-[#b7791f]">
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

                    {lawyer.languages?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {lawyer.languages.slice(0, 4).map((language) => (
                          <span
                            key={language}
                            className="rounded-full bg-[#f4f6fb] px-3 py-1 text-xs font-medium text-[#44516d]"
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LawyerList;
