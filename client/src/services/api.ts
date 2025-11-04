import axios, { AxiosResponse } from 'axios';
import {
  AuthResponse,
  User,
  GenealogyNode,
  Commission,
  Product,
  TeamStats,
  EarningsSummary,
  PaginationInfo,
  NetworkStats,
  NetworkMember,
  NetworkTree,
  ReferralData,
  NetworkAnalytics,
  CommissionSummary,
  EarningsBreakdown
} from '../types';

import { config } from '../config';

const API_BASE_URL = config.API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle token expiration
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

// Auth API
export const authAPI = {
  register: (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    sponsorId?: string;
    position?: 'left' | 'right';
    address?: any;
  }): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/auth/register', userData);
  },

  login: (credentials: {
    email: string;
    password: string;
  }): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/auth/login', credentials);
  },

  getProfile: (): Promise<AxiosResponse<{ user: User }>> => {
    return api.get('/auth/profile');
  },

  updateProfile: (userData: Partial<User>): Promise<AxiosResponse<{ user: User }>> => {
    return api.put('/auth/profile', userData);
  },
};

// MLM API
export const mlmAPI = {
  getGenealogyTree: (userId: string, maxLevel: number = 5): Promise<AxiosResponse<{ tree: GenealogyNode }>> => {
    return api.get(`/mlm/genealogy/${userId}?maxLevel=${maxLevel}`);
  },

  getTeamStats: (userId: string): Promise<AxiosResponse<{ stats: TeamStats }>> => {
    return api.get(`/mlm/team-stats/${userId}`);
  },

  getCommissionHistory: (userId: string, limit: number = 50, page: number = 1): Promise<AxiosResponse<{ commissions: Commission[]; pagination: PaginationInfo }>> => {
    return api.get(`/mlm/commissions/${userId}?limit=${limit}&page=${page}`);
  },

  getDownlineMembers: (userId: string, limit: number = 50, page: number = 1): Promise<AxiosResponse<{ members: User[]; pagination: PaginationInfo }>> => {
    return api.get(`/mlm/downline/${userId}?limit=${limit}&page=${page}`);
  },

  getUplinePath: (userId: string): Promise<AxiosResponse<{ uplinePath: GenealogyNode[] }>> => {
    return api.get(`/mlm/upline/${userId}`);
  },

  getEarningsSummary: (userId: string, period: string = 'month'): Promise<AxiosResponse<{ summary: EarningsSummary; period: string }>> => {
    return api.get(`/mlm/earnings/${userId}?period=${period}`);
  },
};

// Products API
export const productsAPI = {
  getProducts: (category?: string, limit: number = 20, page: number = 1): Promise<AxiosResponse<{ products: Product[]; pagination: PaginationInfo }>> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('page', page.toString());
    return api.get(`/products?${params.toString()}`);
  },

  getProduct: (id: string): Promise<AxiosResponse<{ product: Product }>> => {
    return api.get(`/products/${id}`);
  },

  createProduct: (productData: Partial<Product>): Promise<AxiosResponse<{ product: Product }>> => {
    return api.post('/products', productData);
  },

  updateProduct: (id: string, productData: Partial<Product>): Promise<AxiosResponse<{ product: Product }>> => {
    return api.put(`/products/${id}`, productData);
  },

  deleteProduct: (id: string): Promise<AxiosResponse<{ message: string }>> => {
    return api.delete(`/products/${id}`);
  },
};

// Network API
export const networkAPI = {
  getNetworkStats: (): Promise<AxiosResponse<{
    networkStats: NetworkStats;
    directReferrals: NetworkMember[];
    recentCommissions: Commission[];
    referralCode: string;
  }>> => {
    return api.get('/network/stats');
  },

  addNetworkMember: (memberData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    position?: 'left' | 'right';
  }): Promise<AxiosResponse<{
    newUser: {
      id: string;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      referralCode: string;
      tempPassword: string;
    };
    reward: number;
  }>> => {
    return api.post('/network/add-member', memberData);
  },

  getNetworkTree: (): Promise<AxiosResponse<{ data: NetworkTree }>> => {
    return api.get('/network/tree');
  },

  getReferralLink: (): Promise<AxiosResponse<{ data: ReferralData }>> => {
    return api.get('/network/referral-link');
  },

  getNetworkAnalytics: (): Promise<AxiosResponse<{ data: NetworkAnalytics }>> => {
    return api.get('/network/analytics');
  },
};

export const commissionAPI = {
  getCommissionHistory: (limit: number = 50, page: number = 1): Promise<AxiosResponse<{
    success: boolean;
    data: {
      commissions: Commission[];
      pagination: PaginationInfo;
    };
  }>> => {
    return api.get(`/commissions/history?limit=${limit}&page=${page}`);
  },

  getCommissionSummary: (): Promise<AxiosResponse<{ success: boolean; data: CommissionSummary }>> => {
    return api.get('/commissions/summary');
  },

  getCommissionDetails: (commissionId: string): Promise<AxiosResponse<{ success: boolean; data: Commission }>> => {
    return api.get(`/commissions/details/${commissionId}`);
  },

  getEarningsBreakdown: (): Promise<AxiosResponse<{ success: boolean; data: EarningsBreakdown }>> => {
    return api.get('/commissions/breakdown');
  },

  getRecentCommissions: (limit: number = 10): Promise<AxiosResponse<{ success: boolean; data: Commission[] }>> => {
    return api.get(`/commissions/recent?limit=${limit}`);
  },
};

export default api;
