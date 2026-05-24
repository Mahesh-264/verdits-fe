import { useEffect, useState } from 'react';
import { FALLBACK_CITY_OPTIONS } from '../utils/lawyerDiscovery.js';

const STORAGE_KEY = 'nyaya-setu-search-location';

const readStoredLocation = () => {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.sessionStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.error('Unable to read stored search location', error);
    return null;
  }
};

const storeLocation = (payload) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Unable to store search location', error);
  }
};

const buildBrowserLocationPayload = (coords) => ({
  latitude: Number(coords.latitude),
  longitude: Number(coords.longitude),
  city: '',
  state: '',
  label: 'Current location',
  source: 'browser',
});

const buildFallbackLocationPayload = (option) => ({
  latitude: option.latitude,
  longitude: option.longitude,
  city: option.city,
  state: option.state,
  label: option.label,
  source: 'fallback-city',
  fallbackCityId: option.id,
});

export default function useSearchLocation({ autoRequest = true } = {}) {
  const storedLocation = readStoredLocation();
  const [location, setLocation] = useState(storedLocation);
  const [status, setStatus] = useState(storedLocation ? 'ready' : 'idle');
  const [error, setError] = useState('');
  const [needsCityFallback, setNeedsCityFallback] = useState(false);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setStatus('denied');
      setNeedsCityFallback(true);
      setError('Browser location is not supported on this device.');
      return;
    }

    setStatus('requesting');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = buildBrowserLocationPayload(position.coords);
        setLocation(nextLocation);
        setStatus('ready');
        setNeedsCityFallback(false);
        storeLocation(nextLocation);
      },
      (geoError) => {
        setStatus('denied');
        setNeedsCityFallback(true);

        if (geoError?.code === 1) {
          setError('Location permission was denied. Choose a city to continue.');
          return;
        }

        setError('We could not access your location. Choose a city to continue.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  useEffect(() => {
    if (storedLocation || !autoRequest) return;
    const timerId = window.setTimeout(() => {
      requestBrowserLocation();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [autoRequest, storedLocation]);

  const selectFallbackCity = (cityId) => {
    const selectedCity = FALLBACK_CITY_OPTIONS.find((option) => option.id === cityId);
    if (!selectedCity) return;

    const nextLocation = buildFallbackLocationPayload(selectedCity);
    setLocation(nextLocation);
    setStatus('ready');
    setNeedsCityFallback(false);
    setError('');
    storeLocation(nextLocation);
  };

  return {
    error,
    location,
    needsCityFallback,
    requestBrowserLocation,
    selectFallbackCity,
    status,
  };
}
