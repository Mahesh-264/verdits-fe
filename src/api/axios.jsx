import axios from 'axios';
import { clearAuthStorage, getAccessToken, getRefreshToken, setAccessToken } from '../utils/authStorage';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// 🛡️ Request Interceptor: Attach Token to every call
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// ♻️ Response Interceptor: Handle token refresh automatically
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token found for this tab');
                }

                // Use a separate axios call to avoid infinite loops
                const { data } = await axios.post(
                    '/api/auth/refresh',
                    { refreshToken },
                    { withCredentials: true }
                );

                // Update local storage with the new token
                setAccessToken(data.accessToken);

                // Retry the original request with the new token
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (err) {
                clearAuthStorage();
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
