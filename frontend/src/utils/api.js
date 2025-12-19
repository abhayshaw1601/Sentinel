import axios from 'axios';

// Use environment variable for API URL in production, fallback to localhost in dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.get('/auth/logout'),
    register: (userData) => api.post('/auth/register', userData),
    createStaff: (staffData) => api.post('/auth/create-staff', staffData),
    getMyStaff: () => api.get('/auth/my-staff'),
    getCurrentUser: () => api.get('/auth/me'),
    updatePassword: (data) => api.put('/auth/updatepassword', data),
    updateProfile: (data) => api.put('/auth/updateprofile', data),
    updateStaffShift: (id, data) => api.put(`/auth/staff/${id}/shift`, data),
    deleteStaff: (id) => api.delete(`/auth/staff/${id}`)
};

export const patientAuthAPI = {
    requestOTP: (data) => api.post('/patient-auth/request-otp', data),
    verifyOTP: (data) => api.post('/patient-auth/verify-otp', data)
};

// Patient APIs
export const patientAPI = {
    getAll: (params) => api.get('/patients', { params }),
    getById: (id) => api.get(`/patients/${id}`),
    create: (data) => api.post('/patients', data),
    update: (id, data) => api.put(`/patients/${id}`, data),
    delete: (id) => api.delete(`/patients/${id}`),
    discharge: (id) => api.put(`/patients/${id}/discharge`),
    readmit: (id) => api.put(`/patients/${id}/readmit`),
};

// Vitals APIs
export const vitalsAPI = {
    getPatientVitals: (patientId, params) =>
        api.get(`/vitals/patient/${patientId}`, { params }),
    getLatest: (patientId) => api.get(`/vitals/patient/${patientId}/latest`),
    getById: (id) => api.get(`/vitals/${id}`),
    create: (data) => api.post('/vitals', data),
    update: (id, data) => api.put(`/vitals/${id}`, data),
    delete: (id) => api.delete(`/vitals/${id}`),
};

// Reports APIs
export const reportsAPI = {
    getPatientReports: (patientId, params) =>
        api.get(`/reports/patient/${patientId}`, { params }),
    getById: (id) => api.get(`/reports/${id}`),
    createText: (data) => api.post('/reports/text', data),
    uploadFile: (formData) =>
        api.post('/reports/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    update: (id, data) => api.put(`/reports/${id}`, data),
    delete: (id) => api.delete(`/reports/${id}`),
    download: (id) => api.get(`/reports/${id}/download`, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout for large files
    }),
};

// AI APIs
export const aiAPI = {
    generateInsights: (patientId) => api.post(`/ai/insights/${patientId}`),
    chat: (patientId, data) => api.post(`/ai/chat/${patientId}`, data),
};

// Chat APIs (Medical Chatbot)
export const chatAPI = {
    sendMessage: (patientId, message) =>
        api.post(`/chat/message/${patientId}`, { message }),
    analyzeImage: (patientId, imageFile, message) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (message) {
            formData.append('message', message);
        }
        return api.post(`/chat/analyze-image/${patientId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getHistory: (patientId) => api.get(`/chat/history/${patientId}`),
    clearHistory: (patientId) => api.delete(`/chat/clear/${patientId}`),
};

export default api;
