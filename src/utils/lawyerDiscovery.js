// Shared frontend constants/helpers for location-aware lawyer discovery screens.
export const RADIUS_FILTERS = [
  { id: '5', label: 'Within 5 km', radiusKm: 5 },
  { id: '10', label: 'Within 10 km', radiusKm: 10 },
  { id: '25', label: 'Within 25 km', radiusKm: 25 },
  { id: 'all', label: 'All nearby', radiusKm: 'all' },
];

export const FALLBACK_CITY_OPTIONS = [
  { id: 'new-delhi', label: 'New Delhi, Delhi', city: 'New Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { id: 'mumbai', label: 'Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
  { id: 'bengaluru', label: 'Bengaluru, Karnataka', city: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { id: 'chennai', label: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { id: 'hyderabad', label: 'Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', latitude: 17.385, longitude: 78.4867 },
  { id: 'kolkata', label: 'Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { id: 'pune', label: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { id: 'ahmedabad', label: 'Ahmedabad, Gujarat', city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { id: 'jaipur', label: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { id: 'lucknow', label: 'Lucknow, Uttar Pradesh', city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { id: 'kochi', label: 'Kochi, Kerala', city: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
  { id: 'bhopal', label: 'Bhopal, Madhya Pradesh', city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
];

export const CATEGORY_DISCOVERY_CONFIG = {
  criminal: {
    label: 'Criminal Law',
    specializationTerms: ['criminal'],
  },
  civil: {
    label: 'Civil Law',
    specializationTerms: ['civil'],
  },
  marital: {
    label: 'Marital and Family Law',
    specializationTerms: ['family', 'marital', 'matrimonial', 'divorce', 'domestic'],
  },
  property: {
    label: 'Property Law',
    specializationTerms: ['property', 'land', 'real estate'],
  },
  corporate: {
    label: 'Corporate Law',
    specializationTerms: ['corporate', 'business', 'commercial', 'company'],
  },
  other: {
    label: 'General Legal Help',
    specializationTerms: [],
  },
};

export const getCategoryDiscoveryConfig = (category) => {
  const normalizedCategory = String(category || '').trim().toLowerCase();
  return CATEGORY_DISCOVERY_CONFIG[normalizedCategory] || CATEGORY_DISCOVERY_CONFIG.other;
};

export const getRadiusValue = (radiusId) => {
  const selected = RADIUS_FILTERS.find((item) => item.id === radiusId);
  return selected ? selected.radiusKm : 25;
};

export const formatDistanceLabel = (distanceKm) => {
  const parsed = Number(distanceKm);
  if (!Number.isFinite(parsed)) return 'Distance unavailable';
  return `📍 ${parsed.toFixed(1)} km away`;
};
