import axios from 'axios';
import { auth } from './firebase';

export const API_URL =
  import.meta.env.VITE_API_URL || 'https://secapstone.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
});

// Attach the current Firebase ID token to every request.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
