
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
   console.log('SENDING TOKEN:', token);  // ADD THIS LINE
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
