export const DISCOVERY_TABS = [
  { id: 'internships', label: 'Internships' },
  { id: 'jamSessions', label: 'Jam Sessions' },
  { id: 'lawyers', label: 'Lawyers' },
];

export const createInitialApplicationForm = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  phone: user?.phone || '',
  collegeName: user?.studentProfile?.collegeName || '',
  degree: '',
  yearOfStudy: user?.studentProfile?.currentYear || '',
  skills: Array.isArray(user?.studentProfile?.skills) ? [...user.studentProfile.skills] : [],
  resumeLink: '',
  resumeFileName: '',
  resumeFile: null,
  coverMessage: user?.studentProfile?.bio || '',
  linkedIn: '',
  portfolio: '',
});

export const buildInternshipApplicationFormData = (values) => {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (key === 'skills') {
      value.forEach((skill) => formData.append('skills', skill));
      return;
    }

    if (key === 'resumeFile') {
      if (value) formData.append('resumeFile', value);
      return;
    }

    formData.append(key, value || '');
  });

  return formData;
};

export const internshipSortOptions = [
  { id: 'latest', label: 'Latest' },
  { id: 'highestStipend', label: 'Highest stipend' },
];

export const createInitialInternshipFilters = () => ({
  location: 'All locations',
  specialization: 'All specializations',
  duration: 'All durations',
  stipend: 'All stipends',
  sortBy: 'latest',
});

export const matchesSearch = (value, searchTerm) => {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;

  return String(value || '').toLowerCase().includes(query);
};

export const matchesCollectionSearch = (items, searchTerm) => {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;

  return items
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
};

export const uniqueOptions = (items, fallbackLabel) => [
  fallbackLabel,
  ...[...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))],
];

export const extractNumericValue = (value) => {
  const match = String(value || '').replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
};
