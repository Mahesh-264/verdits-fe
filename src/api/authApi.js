import api from './axios.jsx';

export const registerAccount = (payload) => api.post('/auth/register', payload).then(({ data }) => data);
export const checkRegistrationEmail = (payload) => api.post('/auth/registration/check-email', payload).then(({ data }) => data);
export const sendRegistrationEmailOtp = (payload) => api.post('/auth/registration/send-email-otp', payload).then(({ data }) => data);
export const verifyRegistrationEmailOtp = (payload) => api.post('/auth/registration/verify-email-otp', payload).then(({ data }) => data);
export const verifyRegistrationOtp = (payload) => api.post('/auth/verify-otp', payload).then(({ data }) => data);
export const resendRegistrationOtp = (payload) => api.post('/auth/resend-otp', payload).then(({ data }) => data);
export const loginAccount = (payload) => api.post('/auth/login', payload).then(({ data }) => data);
export const authenticateWithGoogle = (payload) => api.post('/auth/google', payload).then(({ data }) => data);
export const requestPasswordReset = (email) => api.post('/auth/forgot-password', { email }).then(({ data }) => data);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then(({ data }) => data);
export const logoutAccount = (config) => api.post('/auth/logout', undefined, config).then(({ data }) => data);
