// API Configuration
export const API_BASE_URL = 'http://localhost:8080/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // Movies
  MOVIES: '/movies',
  MOVIE_BY_ID: (id) => `/movies/${id}`,
  
  // Showtimes
  SHOWTIMES: '/showtimes',
  SHOWTIME_BY_ID: (id) => `/showtimes/${id}`,
  SHOWTIMES_BY_MOVIE: (movieId) => `/showtimes/movie/${movieId}`,
  
  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_BY_ID: (id) => `/bookings/${id}`,
  USER_BOOKINGS: (userId) => `/bookings/user/${userId}`,
  
  // Vouchers
  VOUCHERS: '/vouchers',
  VOUCHER_BY_ID: (id) => `/vouchers/${id}`,
  ACTIVE_VOUCHERS: '/vouchers/active',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  USER_BY_USERNAME: (username) => `/users/username/${username}`,
  USER_BY_EMAIL: (email) => `/users/email/${email}`,
  USER_BY_PHONE: (phone) => `/users/phone/${phone}`,
  
  // Contact Messages
  CONTACT_MESSAGES: '/contact-messages',
  CONTACT_MESSAGE_BY_ID: (id) => `/contact-messages/${id}`,
  USER_CONTACT_MESSAGES: (userId) => `/contact-messages/user/${userId}`,
  
  // Footer Settings
  FOOTER_SETTINGS: '/footer-settings',
  FOOTER_SETTING_BY_ID: (id) => `/footer-settings/${id}`,
  
  // Reviews
  REVIEWS: '/reviews',
  REVIEW_BY_ID: (id) => `/reviews/${id}`,
  MOVIE_REVIEWS: (movieId) => `/reviews/movie/${movieId}`,
};
