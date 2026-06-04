import axios from 'axios';

const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormData && config.headers) {
        const headers = config.headers as Record<string, unknown>;
        delete headers['Content-Type'];
        delete headers['content-type'];
    }
    const token = localStorage.getItem('tem-aki-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('tem-aki-token');
            localStorage.removeItem('tem-aki-user');
            delete api.defaults.headers.common.Authorization;
            if (typeof window !== 'undefined') {
                const path = window.location.pathname || '';
                if (!path.startsWith('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
