import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token
        const response = await fetch(`${API_URL}/auth/jwt/refresh`, {
          method: 'POST',
          credentials: 'include', // This is important for cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.access_token) {
            await AsyncStorage.setItem('auth_token', data.access_token);
            api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
            originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
            return api(originalRequest);
          }
        }
        // If refresh failed, clear the token and throw error
        await AsyncStorage.removeItem('auth_token');
        throw new Error('Session expired');
      } catch (refreshError) {
        await AsyncStorage.removeItem('auth_token');
        throw refreshError;
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

export const auth = {
  login: async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const response = await api.post('/auth/jwt/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (response.data.access_token) {
      await AsyncStorage.setItem('auth_token', response.data.access_token);
    }
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  verify: async (email: string, code: string) => {
    const response = await api.post('/auth/verify-code', { email, code });
    return response.data;
  },

  requestVerification: async (email: string) => {
    const response = await api.post('/auth/request-verification', { email });
    return response.data;
  },

  refresh: async () => {
    const response = await fetch(`${API_URL}/auth/jwt/refresh`, {
      method: 'POST',
      credentials: 'include', // This is important for cookies
    });
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    const data = await response.json();
    if (data.access_token) {
      await AsyncStorage.setItem('auth_token', data.access_token);
    }
    return data;
  },
};

// Prescriptions endpoints
export const prescriptions = {
  getAll: async () => {
    const response = await api.get('/prescriptions');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },
  
  create: async (prescriptionData: any) => {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },
  
  update: async (id: string, prescriptionData: any) => {
    const response = await api.put(`/prescriptions/${id}`, prescriptionData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/prescriptions/${id}`);
    return response.data;
  },
};

// Inventory endpoints
export const inventory = {
  getAll: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  
  update: async (id: string, inventoryData: any) => {
    const response = await api.put(`/inventory/${id}`, inventoryData);
    return response.data;
  },
  
  searchMedicines: async (query: string) => {
    const response = await medicineDatabase.search(query);
    return response;
  },
  
  getMedicine: async (id: number) => {
    const response = await medicineDatabase.getById(id);
    return response;
  },
};

// Sales endpoints
export const sales = {
  getAll: async () => {
    const response = await api.get('/sales');
    return response.data;
  },
  
  create: async (saleData: any) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },
};

// Medicine Database endpoints
export const medicineDatabase = {
  upload: async (formData: FormData) => {
    const response = await fetch(`${API_URL}/medicine-database/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload medicine database');
    }
    return response.json();
  },
  search: async (query: string) => {
    const response = await fetch(`${API_URL}/medicine-database/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search medicines');
    }
    return response.json();
  },
  getById: async (id: number) => {
    const response = await fetch(`${API_URL}/medicine-database/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get medicine');
    }
    return response.json();
  },
};

export default api; 