import { getMockPrescriptions } from '@/services/mockData';

const isDevelopment = process.env.NODE_ENV === 'development';

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001',
  endpoints: {
    prescriptions: '/api/prescriptions',
    inventory: '/api/inventory',
    sales: '/api/sales',
    alerts: '/api/alerts',
  },
  headers: {
    'Content-Type': 'application/json',
  },
  useMockData: isDevelopment,
};

// API Error Handler
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Response Handler
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.message || 'An error occurred',
      error
    );
  }
  return response.json();
};

// Mock Data Handler
const handleMockRequest = async (endpoint: string) => {
  switch (endpoint) {
    case API_CONFIG.endpoints.prescriptions:
      return getMockPrescriptions();
    default:
      throw new ApiError(404, 'Mock endpoint not found');
  }
};

// API Request Helper
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  // Use mock data in development if configured
  if (API_CONFIG.useMockData) {
    try {
      return await handleMockRequest(endpoint);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Mock data error occurred');
    }
  }

  // Real API request
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const headers = {
    ...API_CONFIG.headers,
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    return handleApiResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error occurred');
  }
}; 