export const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin-dash';
  if (role === 'lawyer') return '/lawyer-dash';
  if (role === 'student') return '/student-home';
  return '/user-home';
};
