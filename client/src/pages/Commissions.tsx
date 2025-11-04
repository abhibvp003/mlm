import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { commissionAPI } from '../services/api';
import { Commission, CommissionSummary, EarningsBreakdown } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  Filter,
  Download,
  Eye,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

const Commissions: React.FC = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [breakdown, setBreakdown] = useState<EarningsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const commissionTypes = [
    'all', 'referral', 'product_sale', 'team_building', 'performance_bonus', 
    'level_1_bonus', 'level_2_bonus', 'level_3_bonus', 'signup_bonus'
  ];

  const statusOptions = ['all', 'pending', 'approved', 'paid', 'cancelled'];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchCommissionData();
  }, [user, currentPage, filterType, filterStatus]);

  const fetchCommissionData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [historyRes, summaryRes, breakdownRes] = await Promise.all([
        commissionAPI.getCommissionHistory(20, currentPage),
        commissionAPI.getCommissionSummary(),
        commissionAPI.getEarningsBreakdown()
      ]);

      let filteredCommissions = historyRes.data.data.commissions;
      
      // Apply filters
      if (filterType !== 'all') {
        filteredCommissions = filteredCommissions.filter(c => c.type === filterType);
      }
      if (filterStatus !== 'all') {
        filteredCommissions = filteredCommissions.filter(c => c.status === filterStatus);
      }

      setCommissions(filteredCommissions);
      setTotalPages(historyRes.data.data.pagination.pages);
      setSummary(summaryRes.data.data);
      setBreakdown(breakdownRes.data.data);
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCommissionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSource = (source: string | undefined) => {
    if (!source) return 'Network Activity';
    return source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            View your commission history and earnings breakdown
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && summary.totalEarnings && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Earnings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{summary.totalEarnings.total.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Commissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.totalEarnings.count}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Commission
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{summary.totalEarnings.count > 0 ? (summary.totalEarnings.total / summary.totalEarnings.count).toFixed(2) : '0.00'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PieChart className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Commission Types
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.summary ? summary.summary.length : 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Income Breakdown */}
      {summary && summary.summary && summary.summary.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Income Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commission Types Breakdown */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3">Earnings by Type</h4>
              <div className="space-y-3">
                {summary.summary.map((item, index) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {item._id.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.count} transaction{item.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ₹{item.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Avg: ₹{item.avgAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Referral Breakdown */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3">Member Referral Income</h4>
              <div className="space-y-3">
                {summary.summary.find(item => item._id === 'referral') && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">Referral Commissions</h5>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{summary.summary.find(item => item._id === 'referral')?.totalAmount.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {summary.summary.find(item => item._id === 'referral')?.count || 0} members added
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹50 per member referral
                    </p>
                  </div>
                )}

                {summary.summary.find(item => item._id === 'level_1_bonus') && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">Level 1 Bonuses</h5>
                      <span className="text-2xl font-bold text-purple-600">
                        ₹{summary.summary.find(item => item._id === 'level_1_bonus')?.totalAmount.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {summary.summary.find(item => item._id === 'level_1_bonus')?.count || 0} team building rewards
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹8 per member for team building
                    </p>
                  </div>
                )}

                {/* Total Per Member */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">Total Per Member</h5>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹58.00
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    ₹50 (Referral) + ₹8 (Level 1 Bonus)
                  </p>
                  <p className="text-xs text-gray-500">
                    Earned for each member you add
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Income Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border-2 border-green-300">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Total Income from Network Building</h4>
                <p className="text-sm text-gray-600">
                  {summary.summary.find(item => item._id === 'referral')?.count || 0} members × ₹58.00 per member
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  ₹{summary.totalEarnings.total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {summary.totalEarnings.count} total transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Types Pie Chart */}
        {summary && summary.summary && summary.summary.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={summary.summary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalAmount"
                >
                  {summary.summary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Earnings Bar Chart */}
        {breakdown && breakdown.monthlyBreakdown && breakdown.monthlyBreakdown.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={breakdown.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  tickFormatter={(value) => `${value.month}/${value.year}`}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Earnings']}
                  labelFormatter={(value) => `Month: ${value.month}/${value.year}`}
                />
                <Bar dataKey="totalAmount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {commissionTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : formatCommissionType(type)}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Commission History Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Commission History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissions && commissions.length > 0 ? commissions.map((commission) => (
                <tr key={commission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCommissionType(commission.type)}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {commission.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {commission.source ? formatSource(commission.source) : 'Network Activity'}
                    </div>
                    {commission.sourceDetails?.referralUserId && (
                      <div className="text-xs text-gray-500">
                        From: {commission.sourceDetails.referralUserId.firstName} {commission.sourceDetails.referralUserId.lastName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      +₹{commission.amount.toFixed(2)}
                    </div>
                    {commission.breakdown && (
                      <div className="text-xs text-gray-500">
                        Rate: {commission.breakdown.commissionRate}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(commission.status)}`}>
                      {getStatusIcon(commission.status)}
                      <span className="ml-1">{commission.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(commission.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedCommission(commission);
                        setShowDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {commissions === null ? 'Loading commissions...' : 'No commissions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Commission Details Modal */}
      {showDetails && selectedCommission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Commission Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCommissionType(selectedCommission.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold text-green-600">
                      +₹{selectedCommission.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <p className="mt-1 text-sm text-gray-900">{formatSource(selectedCommission.source)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCommission.status)}`}>
                      {getStatusIcon(selectedCommission.status)}
                      <span className="ml-1">{selectedCommission.status}</span>
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCommission.description}</p>
                </div>

                {selectedCommission.breakdown && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Breakdown</label>
                    <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Base Amount:</span>
                        <span className="ml-2 font-medium">₹{selectedCommission.breakdown.baseAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Commission Rate:</span>
                        <span className="ml-2 font-medium">{selectedCommission.breakdown.commissionRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Calculated Amount:</span>
                        <span className="ml-2 font-medium">₹{selectedCommission.breakdown.calculatedAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bonus Amount:</span>
                        <span className="ml-2 font-medium">₹{selectedCommission.breakdown.bonusAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedCommission.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commissions;
