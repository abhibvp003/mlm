import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { networkAPI } from '../services/api';
import { config } from '../config';
import { 
  NetworkStats, 
  NetworkMember, 
  NetworkTree, 
  ReferralData, 
  NetworkAnalytics,
  Commission 
} from '../types';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign, 
  Share2, 
  Copy, 
  Check,
  Star,
  Award,
  Target,
  BarChart3,
  Activity,
  TreePine,
  List,
  Eye,
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Network: React.FC = () => {
  const { user } = useAuth();
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [directReferrals, setDirectReferrals] = useState<NetworkMember[]>([]);
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [networkTree, setNetworkTree] = useState<NetworkTree | null>(null);
  const [analytics, setAnalytics] = useState<NetworkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [copied, setCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: 'left' as 'left' | 'right'
  });

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      const [statsRes, referralRes, treeRes, analyticsRes] = await Promise.all([
        networkAPI.getNetworkStats(),
        networkAPI.getReferralLink(),
        networkAPI.getNetworkTree(),
        networkAPI.getNetworkAnalytics()
      ]);

      // Handle the response structure: {success: true, data: {...}}
      const responseData = (statsRes.data as any).data || statsRes.data;
      setNetworkStats(responseData.networkStats || null);
      setDirectReferrals(responseData.directReferrals || []);
      setRecentCommissions(responseData.recentCommissions || []);
      setReferralData(referralRes.data.data || null);
      setNetworkTree(treeRes.data.data || null);
      setAnalytics(analyticsRes.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load network data');
      // Set default values on error
      setNetworkStats(null);
      setDirectReferrals([]);
      setRecentCommissions([]);
      setReferralData(null);
      setNetworkTree(null);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/auth/submit-member`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newMember,
          password: 'TempPassword123' // Default password for pending users
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Member registration submitted for approval!');
        setShowAddMember(false);
        setNewMember({
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          position: 'left'
        });
        loadNetworkData();
      } else {
        setError(data.message || 'Failed to submit member for approval');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit member for approval');
    }
  };

  const copyReferralLink = async () => {
    if (referralData) {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: NetworkTree, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node */}
        <div className={`relative bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 w-48 hover:shadow-lg transition-all duration-200 ${
          level === 0 ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50' : ''
        }`}>
          <div className="text-center">
            <div className={`rounded-full p-2 mx-auto w-12 h-12 flex items-center justify-center mb-2 ${
              level === 0 ? 'bg-gradient-primary' : 'bg-gradient-success'
            }`}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <h5 className="font-semibold text-gray-900 text-sm">{node.fullName}</h5>
            <p className="text-xs text-gray-600">@{node.username}</p>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              node.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {node.isActive ? 'Active' : 'Inactive'}
            </div>
            {node.networkStats && (
              <div className="mt-2 text-xs text-gray-600">
                <div>Level: {node.level}</div>
                <div>Network: {node.networkStats.totalNetwork}</div>
                <div className="text-green-600 font-semibold">₹{node.networkStats.networkRewards.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {node.children.map((child, index) => (
              <div key={child.id} className="relative">
                {/* Connection Line */}
                <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-300 transform -translate-x-1/2"></div>
                <div className="absolute -top-4 left-1/2 w-4 h-px bg-gray-300 transform -translate-x-1/2"></div>
                {renderTreeNode(child, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold gradient-text mb-2">
          Network Management 🌐
        </h1>
        <p className="text-lg text-gray-600">
          Build your network and earn rewards for every member you add
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Network</p>
              <p className="text-3xl font-bold">{networkStats?.totalNetwork || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-secondary rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Direct Referrals</p>
              <p className="text-3xl font-bold">{networkStats?.directReferrals || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-success rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Network Rewards</p>
              <p className="text-3xl font-bold">₹{networkStats?.networkRewards || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-warning rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Your Referral Code</p>
              <p className="text-lg font-bold">{referralData?.referralCode}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-info rounded-full p-2 mr-3">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Your Referral Link</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-50 rounded-lg p-3 border">
            <p className="text-sm text-gray-600 break-all">{referralData?.referralLink}</p>
          </div>
          <button
            onClick={copyReferralLink}
            className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Add Member Section */}
      <div className="card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-success rounded-full p-2 mr-3">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Add Network Member</h3>
          </div>
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="bg-gradient-success text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            {showAddMember ? 'Cancel' : 'Add Member'}
          </button>
        </div>

        {showAddMember && (
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={newMember.username}
                  onChange={(e) => setNewMember({...newMember, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Submit Member for Approval
            </button>
          </form>
        )}
      </div>

      {/* Team Members */}
      <div className="card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-primary rounded-full p-2 mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'tree'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TreePine className="h-4 w-4 mr-2" />
              Tree
            </button>
          </div>
        </div>
        
        {directReferrals && Array.isArray(directReferrals) && directReferrals.length > 0 ? (
          viewMode === 'list' ? (
            // List View
            <div className="space-y-4">
              {directReferrals.map((member) => (
                <div key={member._id || member.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-primary rounded-full p-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{member.firstName} {member.lastName}</h4>
                        <p className="text-sm text-gray-600">@{member.username}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {member.email}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {member.status === 'pending' ? 'Submitted' : 'Joined'} {new Date(member.joinDate || member.submittedAt || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                        member.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : member.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : member.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : (member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                      }`}>
                        {member.status === 'approved' && <CheckCircle className="w-4 h-4 mr-1" />}
                        {member.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                        {member.status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
                        {member.status === 'approved' ? 'Approved' : 
                         member.status === 'pending' ? 'Pending' : 
                         member.status === 'rejected' ? 'Rejected' : 
                         (member.isActive ? 'Active' : 'Inactive')}
                      </div>
                      {member.networkStats && (
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Network:</span>
                            <span className="font-semibold">{member.networkStats.totalNetwork}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Earned:</span>
                            <span className="font-semibold text-green-600">₹{member.networkStats.networkRewards.toFixed(2)}</span>
                          </div>
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
            </div>
          ) : (
            // Tree View
            <div className="space-y-4">
              {networkTree ? (
                // Full Network Tree
                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    {renderTreeNode(networkTree)}
                  </div>
                </div>
              ) : (
                // Simple Direct Referrals Tree
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="bg-gradient-primary rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-3">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h4>
                    <p className="text-sm text-gray-600">@{user?.username}</p>
                    <p className="text-xs text-gray-500">Your Network</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    {directReferrals.map((member, index) => (
                      <div key={member._id || member.id} className="relative">
                        {/* Connection Line */}
                        {index > 0 && (
                          <div className="absolute -left-4 top-1/2 w-8 h-px bg-gray-300 transform -translate-y-1/2"></div>
                        )}
                        
                        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 w-48 hover:shadow-lg transition-all duration-200">
                          <div className="text-center">
                            <div className="bg-gradient-success rounded-full p-2 mx-auto w-12 h-12 flex items-center justify-center mb-2">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <h5 className="font-semibold text-gray-900 text-sm">{member.firstName} {member.lastName}</h5>
                            <p className="text-xs text-gray-600">@{member.username}</p>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                              member.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : member.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : member.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : (member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
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
                              <div className="mt-2 text-xs text-gray-600">
                                <div>Network: {member.networkStats.totalNetwork}</div>
                                <div className="text-green-600 font-semibold">₹{member.networkStats.networkRewards.toFixed(2)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="bg-gradient-primary rounded-full p-6 mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Team Members Yet</h4>
            <p className="text-gray-500 mb-4">Start building your network by adding new members!</p>
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Submit First Member
            </button>
          </div>
        )}
      </div>

      {/* Recent Network Commissions */}
      <div className="card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-success rounded-full p-2 mr-3">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Recent Network Rewards</h3>
        </div>
        
        {recentCommissions && Array.isArray(recentCommissions) && recentCommissions.length > 0 ? (
          <div className="space-y-4">
            {recentCommissions.map((commission) => (
              <div key={commission._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-full p-2 mr-3">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {commission.type} Reward
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +₹{commission.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No network rewards yet. Add members to start earning!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Network;
