import axios from 'axios';
import { getIdToken } from '../firebase/firebaseClient';

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) {
  throw new Error('VITE_API_BASE_URL must be set in environment for API calls');
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getIdToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
