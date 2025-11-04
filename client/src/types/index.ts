export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  sponsorId?: string;
  position?: 'left' | 'right';
  level?: number;
  totalEarnings?: number;
  totalCommissions?: number;
  networkStats?: NetworkStats;
  referralCode?: string;
  isActive?: boolean;
  isAdmin: boolean;
  joinDate?: string;
  lastLogin?: string;
  genealogyPath?: GenealogyNode[];
}

export interface NetworkStats {
  totalMembers: number;
  directReferrals: number;
  totalNetwork: number;
  networkRewards: number;
}

// Updated NetworkMember interface to include approval status
export interface NetworkMember {
  id: string;
  _id?: string; // MongoDB ObjectId
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  joinDate?: string;
  submittedAt?: string;
  isActive?: boolean;
  networkStats?: NetworkStats;
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'user' | 'pending';
  phone?: string;
  position?: 'left' | 'right';
  referralCode?: string;
}

export interface NetworkTree {
  id: string;
  username: string;
  fullName: string;
  email: string;
  joinDate: string;
  isActive: boolean;
  networkStats: NetworkStats;
  level: number;
  children: NetworkTree[];
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  username: string;
}

export interface NetworkAnalytics {
  networkGrowth: Array<{
    _id: string;
    count: number;
  }>;
  topPerformers: Array<{
    username: string;
    firstName: string;
    lastName: string;
    networkStats: NetworkStats;
    totalEarnings: number;
  }>;
  monthlyEarnings: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
}

export interface CommissionSummary {
  summary: Array<{
    _id: string;
    totalAmount: number;
    count: number;
    avgAmount: number;
  }>;
  totalEarnings: {
    total: number;
    count: number;
  };
}

export interface EarningsBreakdown {
  sourceBreakdown: Array<{
    _id: string;
    totalAmount: number;
    count: number;
    avgAmount: number;
    types: string[];
  }>;
  monthlyBreakdown: Array<{
    _id: {
      year: number;
      month: number;
    };
    totalAmount: number;
    count: number;
  }>;
}

export interface GenealogyNode {
  id: string;
  username: string;
  fullName: string;
  level: number;
  totalEarnings: number;
  isActive: boolean;
  position?: 'left' | 'right';
  children: GenealogyNode[];
}

export interface Commission {
  _id: string;
  toUserId: string;
  fromUserId: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  amount: number;
  percentage?: number;
  level?: number;
  type: 'direct' | 'binary' | 'matching' | 'leadership' | 'referral' | 'network_bonus' | 'level_1_bonus' | 'level_2_bonus' | 'level_3_bonus' | 'level_4_bonus' | 'level_5_bonus' | 'signup_bonus' | 'product_sale' | 'team_building' | 'performance_bonus' | 'monthly_bonus';
  source?: 'referral' | 'product_purchase' | 'team_activity' | 'bonus' | 'admin_adjustment';
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  description: string;
  sourceDetails?: {
    productId?: {
      _id: string;
      name: string;
      price?: number;
    };
    orderId?: {
      _id: string;
      orderNumber: string;
      totalAmount?: number;
    };
    referralUserId?: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
      email?: string;
    };
    originalAmount?: number;
    commissionRate?: number;
  };
  breakdown?: {
    baseAmount?: number;
    commissionRate?: number;
    calculatedAmount?: number;
    bonusAmount?: number;
    totalAmount: number;
  };
  transactionId?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  pv: number;
  category: 'product' | 'package' | 'subscription';
  image?: string;
  isActive: boolean;
  stock: number;
  commissionRates: {
    direct: number;
    binary: number;
    matching: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamStats {
  userId: string;
  username: string;
  directMembers: number;
  totalTeamMembers: number;
  totalTeamEarnings: number;
  personalEarnings: number;
}

export interface EarningsSummary {
  totalEarnings: number;
  periodEarnings: number;
  totalCommissions: number;
  commissionBreakdown: {
    direct: number;
    binary: number;
    matching: number;
    leadership: number;
  };
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    totalEarnings?: number;
  };
}

export interface ApiResponse<T> {
  message: string;
  [key: string]: any;
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
}
