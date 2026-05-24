import React from 'react';
import { MapPin, Navigation, RefreshCcw } from 'lucide-react';
import { FALLBACK_CITY_OPTIONS } from '../../utils/lawyerDiscovery.js';

export default function LocationSearchCard({
  title = 'Nearby Lawyers',
  description,
  error,
  loading,
  location,
  needsCityFallback,
  onRequestLocation,
  onSelectFallbackCity,
}) {
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
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-3 py-1 text-sm font-medium text-[#2456f5]">
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
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0d1024] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#171b34] disabled:opacity-60"
        >
          <RefreshCcw size={16} />
          {loading ? 'Checking location...' : 'Use my location'}
        </button>
      </div>

      {needsCityFallback ? (
        <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4">
          <label className="mb-2 block text-sm font-medium text-[#44516d]" htmlFor="fallback-city">
            Choose a city instead
          </label>
          <select
            id="fallback-city"
            defaultValue=""
            onChange={(event) => onSelectFallbackCity(event.target.value)}
            className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-3 text-sm text-[#0b1f44] outline-none focus:border-[#2456f5]"
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
