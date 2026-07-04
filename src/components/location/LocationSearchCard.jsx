import React, { useState } from 'react';
import { MapPin, Navigation, RefreshCcw, Search } from 'lucide-react';
import { FALLBACK_CITY_OPTIONS } from '../../utils/lawyerDiscovery.js';

export default function LocationSearchCard({
  title = 'Nearby Lawyers',
  description,
  error,
  loading,
  location,
  needsCityFallback,
  onRequestLocation,
  onSearchLocation,
  onSelectFallbackCity,
  searchingLocation,
}) {
  const [cityQuery, setCityQuery] = useState('');

  const handleCitySearch = (event) => {
    event.preventDefault();
    onSearchLocation?.(cityQuery);
  };

  return (
    <section className="rounded-3xl border border-[#dbe2ef] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#0b1f44]">
            <MapPin size={18} />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <p className="mt-2 text-sm text-[#5e6c87]">
            {description || 'We use your current location to show the closest lawyers first.'}
          </p>

          {location ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-3 py-1 text-sm font-medium text-[#15a276]">
              <Navigation size={14} />
              Searching near {location.label}
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm font-medium text-[#c2410c]">{error}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onRequestLocation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#15a276] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#fff2bf] disabled:opacity-60"
        >
          <RefreshCcw size={16} />
          {loading ? 'Checking location...' : 'Use my location'}
        </button>
      </div>

      {onSearchLocation ? (
        <form onSubmit={handleCitySearch} className="mt-4 grid gap-3 rounded-2xl bg-[#f8fafc] p-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor="location-city-search">
            Search city or district
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-[#dbe2ef] bg-white px-4 py-3">
            <Search size={17} className="text-[#7f8ba2]" />
            <input
              id="location-city-search"
              value={cityQuery}
              onChange={(event) => setCityQuery(event.target.value)}
              type="search"
              placeholder="Search city or district"
              className="w-full bg-transparent text-sm text-[#0b1f44] outline-none placeholder:text-[#7f8ba2]"
            />
          </div>
          <button
            type="submit"
            disabled={searchingLocation}
            className="inline-flex items-center justify-center rounded-2xl bg-[#15a276] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#fff2bf] disabled:opacity-60"
          >
            {searchingLocation ? 'Searching...' : 'Search'}
          </button>
        </form>
      ) : null}

      {needsCityFallback ? (
        <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4">
          <label className="mb-2 block text-sm font-medium text-[#44516d]" htmlFor="fallback-city">
            Choose a city instead
          </label>
          <select
            id="fallback-city"
            defaultValue=""
            onChange={(event) => onSelectFallbackCity(event.target.value)}
            className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-3 text-sm text-[#0b1f44] outline-none focus:border-[#15a276]"
          >
            <option value="" disabled>
              Select your city
            </option>
            {FALLBACK_CITY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </section>
  );
}
