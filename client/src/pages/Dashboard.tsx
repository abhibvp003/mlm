import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mlmAPI, networkAPI } from '../services/api';
import { EarningsSummary, Commission, NetworkMember, NetworkStats } from '../types';
import AddMemberForm from '../components/AddMemberForm';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Award,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Mail,
  Calendar,
  Eye,
  Plus,
  X,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
  const [teamMembers, setTeamMembers] = useState<NetworkMember[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [investments, setInvestments] = useState<any[]>([]);
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    investmentType: 'basic',
    duration: '6',
    description: ''
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const [earningsRes, commissionsRes, networkStatsRes] = await Promise.all([
        mlmAPI.getEarningsSummary(user.id, 'month'),
        mlmAPI.getCommissionHistory(user.id, 5, 1),
        networkAPI.getNetworkStats()
      ]);

      setEarningsSummary(earningsRes.data.summary);
      setRecentCommissions(commissionsRes.data.commissions);
      // Handle the response structure: {success: true, data: {...}}
      const networkData = (networkStatsRes.data as any).data || networkStatsRes.data;
      setTeamMembers(networkData.directReferrals || []);
      setNetworkStats(networkData.networkStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [user, fetchDashboardData]);

  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newInvestment = {
        id: Date.now().toString(),
        amount: parseFloat(investmentForm.amount),
        type: investmentForm.investmentType,
        duration: parseInt(investmentForm.duration),
        description: investmentForm.description,
        date: new Date().toISOString(),
        status: 'active',
        returns: calculateReturns(parseFloat(investmentForm.amount), investmentForm.investmentType, parseInt(investmentForm.duration))
      };
      
      setInvestments(prev => [newInvestment, ...prev]);
      setInvestmentForm({
        amount: '',
        investmentType: 'basic',
        duration: '6',
        description: ''
      });
      setShowInvestmentForm(false);
      alert(`Investment of ₹${investmentForm.amount} submitted successfully!`);
    } catch (error) {
      console.error('Error submitting investment:', error);
      alert('Error submitting investment. Please try again.');
    }
  };

  const calculateReturns = (amount: number, type: string, duration: number) => {
    const rates = {
      basic: 0.12,    // 12% annual
      premium: 0.18,  // 18% annual
      platinum: 0.25  // 25% annual
    };
    const rate = rates[type as keyof typeof rates] || 0.12;
    return amount * rate * (duration / 12);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Earnings',
      value: `₹${user?.totalEarnings?.toFixed(2) || '0.00'}`,
      change: '+12%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Direct Referrals',
      value: networkStats?.directReferrals?.toString() || '0',
      change: `+${teamMembers?.length || 0}`,
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Total Network',
      value: networkStats?.totalNetwork?.toString() || '0',
      change: '+8',
      changeType: 'positive',
      icon: UserPlus,
    },
    {
      name: 'Network Rewards',
      value: `₹${networkStats?.networkRewards?.toFixed(2) || '0.00'}`,
      change: '+15%',
      changeType: 'positive',
      icon: TrendingUp,
    },
  ];

  const commissionData = earningsSummary ? [
    { name: 'Direct', value: earningsSummary.commissionBreakdown.direct, color: '#3B82F6' },
    { name: 'Binary', value: earningsSummary.commissionBreakdown.binary, color: '#10B981' },
    { name: 'Matching', value: earningsSummary.commissionBreakdown.matching, color: '#F59E0B' },
    { name: 'Leadership', value: earningsSummary.commissionBreakdown.leadership, color: '#EF4444' },
  ] : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold gradient-text mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Here's your BSS Saathi Partner business overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const gradients = [
            'bg-gradient-primary',
            'bg-gradient-secondary', 
            'bg-gradient-success',
            'bg-gradient-warning'
          ];
          return (
            <div key={stat.name} className={`${gradients[index]} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white/80 text-sm font-medium mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold mb-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-200 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-200 mr-1" />
                    )}
                    <span className="text-sm text-white/80">
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Commission Breakdown */}
        <div className="card rounded-2xl p-6 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-primary rounded-full p-2 mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Commission Breakdown</h3>
          </div>
          {commissionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={commissionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {commissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium">No commission data available</p>
              <p className="text-sm">Start earning commissions by building your team!</p>
            </div>
          )}
        </div>

        {/* Recent Commissions */}
        <div className="card rounded-2xl p-6 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-success rounded-full p-2 mr-3">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Recent Commissions</h3>
          </div>
          {recentCommissions.length > 0 ? (
            <div className="space-y-4">
              {recentCommissions.map((commission) => (
                <div key={commission._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center">
                    <div className="bg-green-500 rounded-full p-2 mr-3">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {commission.fromUserId.firstName} {commission.fromUserId.lastName}
                      </p>
                      <p className="text-xs text-gray-600 capitalize">
                        {commission.type} Commission
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      +₹{commission.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium">No recent commissions</p>
              <p className="text-sm">Commissions will appear here as you earn them</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-primary rounded-full p-2 mr-3">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
              {teamMembers && teamMembers.length > 0 && (
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Approved: {teamMembers.filter(m => m.status === 'approved').length}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Pending: {teamMembers.filter(m => m.status === 'pending').length}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>Rejected: {teamMembers.filter(m => m.status === 'rejected').length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddMemberForm(true)}
              className="flex items-center bg-gradient-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Member
            </button>
            <a
              href="/network"
              className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-semibold transition-colors"
            >
              <Eye className="h-4 w-4 mr-1" />
              View All
            </a>
          </div>
        </div>
        
        {teamMembers && teamMembers.length > 0 ? (
          <div className="space-y-4">
            {teamMembers.slice(0, 4).map((member) => (
              <div key={member._id || member.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-primary rounded-full p-2">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.firstName} {member.lastName}</h4>
                      <p className="text-sm text-gray-600">@{member.username}</p>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {member.email}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(member.joinDate || member.submittedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                      member.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : member.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {member.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {member.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {member.status === 'approved' ? 'Approved' : 
                       member.status === 'pending' ? 'Pending' : 
                       member.status === 'rejected' ? 'Rejected' : 
                       (member.isActive ? 'Active' : 'Inactive')}
                    </div>
                    {member.networkStats && (
                      <div className="text-xs text-gray-600">
                        <div>Network: {member.networkStats.totalNetwork}</div>
                        <div className="text-green-600 font-semibold">₹{member.networkStats.networkRewards.toFixed(2)}</div>
                      </div>
                    )}
                    {member.status === 'pending' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Awaiting admin approval
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {teamMembers.length > 4 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500 mb-3">
                  Showing 4 of {teamMembers.length} team members
                </p>
                <a
                  href="/network"
                  className="inline-flex items-center bg-gradient-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View All Team Members
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gradient-primary rounded-full p-6 mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Team Members Yet</h4>
            <p className="text-gray-500 mb-4">Start building your network by adding new members!</p>
            <button
              onClick={() => setShowAddMemberForm(true)}
              className="inline-flex items-center bg-gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add First Member
            </button>
          </div>
        )}
      </div>

      {/* Investment Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 mr-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Investment Portfolio</h2>
              <p className="text-sm text-gray-500">Manage your investments and track returns</p>
              {investments.length > 0 && (
                <div className="flex items-center space-x-6 mt-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 mr-2">Total Invested:</span>
                    <span className="font-bold text-purple-600">
                      ₹{investments.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 mr-2">Total Returns:</span>
                    <span className="font-bold text-green-600">
                      ₹{investments.reduce((sum, inv) => sum + inv.returns, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 mr-2">Active Investments:</span>
                    <span className="font-bold text-blue-600">
                      {investments.filter(inv => inv.status === 'active').length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowInvestmentForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Investment
          </button>
        </div>

        {/* Investment Form Modal */}
        {showInvestmentForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">New Investment</h3>
                <button
                  onClick={() => setShowInvestmentForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleInvestmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="100"
                    value={investmentForm.amount}
                    onChange={(e) => setInvestmentForm({...investmentForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter amount (minimum ₹1000)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Type</label>
                  <select
                    value={investmentForm.investmentType}
                    onChange={(e) => setInvestmentForm({...investmentForm, investmentType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="basic">Basic Plan (12% annual return)</option>
                    <option value="premium">Premium Plan (18% annual return)</option>
                    <option value="platinum">Platinum Plan (25% annual return)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                  <select
                    value={investmentForm.duration}
                    onChange={(e) => setInvestmentForm({...investmentForm, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={investmentForm.description}
                    onChange={(e) => setInvestmentForm({...investmentForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Add any notes about this investment..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInvestmentForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:shadow-lg"
                  >
                    Submit Investment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Investment List */}
        <div className="space-y-4">
          {investments.length > 0 ? (
            investments.map((investment) => (
              <div key={investment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center">
                  <div className="bg-purple-500 rounded-full p-2 mr-3">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {investment.type} Investment
                    </p>
                    <p className="text-xs text-gray-600">
                      {investment.duration} months • {new Date(investment.date).toLocaleDateString()}
                    </p>
                    {investment.description && (
                      <p className="text-xs text-gray-500 mt-1">{investment.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    ₹{investment.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">
                    +₹{investment.returns.toFixed(2)} returns
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {investment.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No investments yet. Start your first investment to grow your wealth!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-info rounded-full p-2 mr-3">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <a
            href="/genealogy"
            className="group flex items-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-primary rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">View Genealogy</p>
              <p className="text-xs text-gray-600">See your network</p>
            </div>
          </a>
          
          <a
            href="/network"
            className="group flex items-center p-6 bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-success rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Network Management</p>
              <p className="text-xs text-gray-600">Add members & earn</p>
            </div>
          </a>
          
          <a
            href="/commissions"
            className="group flex items-center p-6 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-success rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Commissions</p>
              <p className="text-xs text-gray-600">View earnings</p>
            </div>
          </a>
          
          <a
            href="/products"
            className="group flex items-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-secondary rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Products</p>
              <p className="text-xs text-gray-600">Browse catalog</p>
            </div>
          </a>
          
          <a
            href="/analytics"
            className="group flex items-center p-6 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-warning rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Analytics</p>
              <p className="text-xs text-gray-600">View reports</p>
            </div>
          </a>
        </div>
      </div>

      {/* Add Member Form Modal */}
      <AddMemberForm
        isOpen={showAddMemberForm}
        onClose={() => setShowAddMemberForm(false)}
        onSuccess={() => {
          // Refresh dashboard data after successful member submission
          fetchDashboardData();
        }}
      />
    </div>
  );
};

export default Dashboard;
