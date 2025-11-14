import axios from 'axios';
import { API_CONFIG } from '../constants/config';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store for auth token (will be set by app)
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

// Request interceptor to add Clerk token
api.interceptors.request.use(
  async (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => response, // return the full axios response object
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject({
        status: error.response.status,
        ...error.response.data,
      });
    } else if (error.request) {
      console.error('Network Error:', error.message);
      return Promise.reject({ message: 'Network error. Please check your connection.' });
    } else {
      console.error('Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);



export default api;