import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { config } from '../config';
import { 
  Plus, 
  X, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Edit,
  Trash2,
  Filter,
  Search
} from 'lucide-react';

interface Investment {
  id: string;
  amount: number;
  type: 'basic' | 'premium' | 'platinum';
  duration: number;
  description: string;
  date: string;
  status: 'active' | 'completed' | 'pending';
  returns: number;
  maturityDate: string;
}

const Investments: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    investmentType: 'basic',
    description: ''
  });

  // Load sample investments on component mount
  useEffect(() => {
    const sampleInvestments: Investment[] = [
      {
        id: '1',
        amount: 10000,
        type: 'premium',
        duration: 12,
        description: 'First investment for portfolio growth',
        date: '2025-01-15T10:00:00Z',
        status: 'active',
        returns: 1800,
        maturityDate: '2026-01-15T10:00:00Z'
      },
      {
        id: '2',
        amount: 5000,
        type: 'basic',
        duration: 6,
        description: 'Short-term investment',
        date: '2025-02-01T14:30:00Z',
        status: 'pending',
        returns: 0,
        maturityDate: ''
      },
      {
        id: '3',
        amount: 15000,
        type: 'platinum',
        duration: 24,
        description: 'Long-term wealth building',
        date: '2025-10-18T09:00:00Z',
        status: 'pending',
        returns: 0,
        maturityDate: ''
      }
    ];
    setInvestments(sampleInvestments);
  }, []);


  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investmentForm.amount || !investmentForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const amount = parseFloat(investmentForm.amount);
      const duration = investmentForm.investmentType === 'basic' ? 12 : 
                      investmentForm.investmentType === 'premium' ? 18 : 24;

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/investments/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          type: investmentForm.investmentType,
          duration,
          description: investmentForm.description
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to local state for immediate UI update
        const newInvestment: Investment = {
          id: result.data.id,
          amount: result.data.amount,
          type: result.data.type,
          duration: result.data.duration,
          description: investmentForm.description,
          date: new Date().toISOString(),
          status: 'pending',
          returns: result.data.expectedReturns,
          maturityDate: new Date(Date.now() + (duration * 30 * 24 * 60 * 60 * 1000)).toISOString()
        };

        setInvestments(prev => [newInvestment, ...prev]);

        setInvestmentForm({
          amount: '',
          investmentType: 'basic',
          description: ''
        });
        setShowInvestmentForm(false);
        
        alert('Investment submitted successfully! Your investment is now pending admin approval.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting investment:', error);
      alert('Error submitting investment. Please try again.');
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setInvestmentForm({
      amount: investment.amount.toString(),
      investmentType: investment.type,
      description: investment.description
    });
    setShowInvestmentForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      setInvestments(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const filteredInvestments = investments.filter(investment => {
    const matchesType = filterType === 'all' || investment.type === filterType;
    const matchesSearch = investment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investment.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = investments.filter(inv => inv.status === 'active').reduce((sum, inv) => sum + inv.returns, 0);
  const activeInvestments = investments.filter(inv => inv.status === 'active').length;
  const pendingInvestments = investments.filter(inv => inv.status === 'pending').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'platinum':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your investment portfolio and track returns
          </p>
        </div>
        <button
          onClick={() => setShowInvestmentForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Investment
        </button>
      </div>

      {/* Investment Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Invested
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{totalInvested.toFixed(2)}
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
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Expected Returns
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{totalReturns.toFixed(2)}
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
                <CreditCard className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Investments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {activeInvestments}
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
                <Calendar className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Approval
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pendingInvestments}
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
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Investments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {investments.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            <option value="basic">Basic Plan</option>
            <option value="premium">Premium Plan</option>
            <option value="platinum">Platinum Plan</option>
          </select>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search investments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Investment Form Modal */}
      {showInvestmentForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingInvestment ? 'Edit Investment' : 'New Investment'}
              </h3>
              <button
                onClick={() => {
                  setShowInvestmentForm(false);
                  setEditingInvestment(null);
                  setInvestmentForm({
                    amount: '',
                    investmentType: 'basic',
                    description: ''
                  });
                }}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={investmentForm.description}
                  onChange={(e) => setInvestmentForm({...investmentForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Add any notes about this investment..."
                />
              </div>

              {/* Investment Info */}
              {investmentForm.amount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Investment Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Investment Amount:</span>
                      <span className="ml-2 font-semibold">₹{parseFloat(investmentForm.amount || '0').toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Investment Type:</span>
                      <span className="ml-2 font-semibold capitalize">{investmentForm.investmentType} Plan</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Your investment will be reviewed by our admin team. 
                      Duration and returns will be determined after approval.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvestmentForm(false);
                    setEditingInvestment(null);
                    setInvestmentForm({
                      amount: '',
                      investmentType: 'basic',
                      description: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:shadow-lg"
                >
                  {editingInvestment ? 'Update Investment' : 'Create Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Investment List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Investment Portfolio</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Returns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maturity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvestments.length > 0 ? (
                filteredInvestments.map((investment) => (
                  <tr key={investment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {investment.description || 'Investment'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(investment.date).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(investment.type)}`}>
                        {investment.type.charAt(0).toUpperCase() + investment.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{investment.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {investment.status === 'active' ? `${investment.duration} months` : 'Pending approval'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.status === 'active' ? (
                        <>
                          <div className="text-sm font-medium text-green-600">
                            +₹{investment.returns.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {investment.type === 'basic' ? '12%' : 
                             investment.type === 'premium' ? '18%' : '25%'} annual
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Pending approval
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                        {investment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investment.status === 'active' && investment.maturityDate ? 
                        new Date(investment.maturityDate).toLocaleDateString() : 
                        'Pending approval'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(investment)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(investment.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {investments.length === 0 ? 'No investments yet. Create your first investment!' : 'No investments match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Investments;
