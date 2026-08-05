import axios from 'axios';
import { clearAuthStorage, getAccessToken, setAccessToken } from '../utils/authStorage';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const apiBaseUrl = configuredApiUrl
    ? (configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`)
    : '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 15000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

let refreshPromise = null;

// 🛡️ Request Interceptor: Attach Token to every call
api.interceptors.request.use((config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        // Let the browser supply the multipart boundary required by multer.
        config.headers.delete?.('Content-Type');
        delete config.headers['Content-Type'];
    }
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
        // Logout is handled by the shared session-logout hook, which always
        // clears the local session and returns the visitor to the role picker.
        // Do not let a stale/expired token on this request trigger the global
        // unauthenticated redirect to /login first.
        const isAuthenticationRequest = /^\/auth\/(login|register|google|forgot-password|reset-password|logout)/.test(originalRequest?.url || '');
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthenticationRequest) {
            originalRequest._retry = true;
            try {
                // Use a separate axios call to avoid infinite loops
                refreshPromise ??= axios.post(
                    `${apiBaseUrl.replace(/\/$/, '')}/auth/refresh`,
                    {},
                    { withCredentials: true }
                ).then(({ data }) => data).finally(() => { refreshPromise = null; });
                const data = await refreshPromise;

                // Update local storage with the new token
                setAccessToken(data.accessToken);

                // Retry the original request with the new token
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (err) {
                clearAuthStorage();
                // Signed-out visitors always return to the role-selection page.
                // This also prevents delayed requests from overriding a logout
                // navigation with a redirect to the login form.
                window.location.href = '/role-selection';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
