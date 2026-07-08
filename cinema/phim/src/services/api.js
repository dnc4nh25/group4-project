import axios from 'axios';

// Base URL for backend API
const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if needed
apiClient.interceptors.request.use(
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

// API Services
export const movieApi = {
  getAll: () => apiClient.get('/movies'),
  getById: (id) => apiClient.get(`/movies/${id}`),
  create: (data) => apiClient.post('/movies', data),
  update: (id, data) => apiClient.put(`/movies/${id}`, data),
  delete: (id) => apiClient.delete(`/movies/${id}`),
};

export const showtimeApi = {
  getAll: () => apiClient.get('/showtimes'),
  getById: (id) => apiClient.get(`/showtimes/${id}`),
  getByMovie: (movieId) => apiClient.get(`/showtimes/movie/${movieId}`),
  create: (data) => apiClient.post('/showtimes', data),
  update: (id, data) => apiClient.put(`/showtimes/${id}`),
  patch: (id, data) => apiClient.patch(`/showtimes/${id}`, data),
  delete: (id) => apiClient.delete(`/showtimes/${id}`),
};

export const bookingApi = {
  getAll: () => apiClient.get('/bookings'),
  getById: (id) => apiClient.get(`/bookings/${id}`),
  getByUser: (userId) => apiClient.get(`/bookings/user/${userId}`),
  create: (data) => apiClient.post('/bookings', data),
  update: (id, data) => apiClient.put(`/bookings/${id}`, data),
  patch: (id, data) => apiClient.patch(`/bookings/${id}`, data),
  delete: (id) => apiClient.delete(`/bookings/${id}`),
};

export const voucherApi = {
  getAll: () => apiClient.get('/vouchers'),
  getActive: () => apiClient.get('/vouchers/active'),
  getById: (id) => apiClient.get(`/vouchers/${id}`),
  getByCode: (code) => apiClient.get(`/vouchers/code/${code}`),
  create: (data) => apiClient.post('/vouchers', data),
  update: (id, data) => apiClient.put(`/vouchers/${id}`, data),
  patch: (id, data) => apiClient.patch(`/vouchers/${id}`, data),
  delete: (id) => apiClient.delete(`/vouchers/${id}`),
};

export const userApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  getByUsername: (username) => apiClient.get(`/users/username/${username}`),
  getByEmail: (email) => apiClient.get(`/users/email/${email}`),
  getByPhone: (phone) => apiClient.get(`/users/phone/${phone}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
};

export const contactMessageApi = {
  getAll: () => apiClient.get('/contact-messages'),
  getById: (id) => apiClient.get(`/contact-messages/${id}`),
  getByUser: (userId) => apiClient.get(`/contact-messages/user/${userId}`),
  create: (data) => apiClient.post('/contact-messages', data),
  update: (id, data) => apiClient.put(`/contact-messages/${id}`, data),
  patch: (id, data) => apiClient.patch(`/contact-messages/${id}`, data),
  delete: (id) => apiClient.delete(`/contact-messages/${id}`),
};

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
};

export default apiClient;
