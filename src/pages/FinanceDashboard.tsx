import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useBatches, usePaymentLists } from '../hooks/useData';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import TransactionAnalytics from '../components/TransactionAnalytics';
import EcopayTransactions from '../components/EcopayTransactions';
import PieChartComponent from '../components/PieChartComponent';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getVhwMasterList } from '../data/seed';

import { Clock, PlayCircle, CheckCircle, XCircle, Eye, Check, SkipForward, Download, Calendar, Globe, BarChart3 } from 'lucide-react';
import { filterBatchesByUser, filterPaymentListsByUser } from '../utils/dataFilter';

const COLORS = ['#0d9488', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function FinanceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [allBatches] = useBatches();
  const [allLists] = usePaymentLists();
  const [selectedVhwDistrict, setSelectedVhwDistrict] = useState<string>('all');
  const vhwMasterList = getVhwMasterList();
  
  // Filter data based on user's role and province
  const batches = filterBatchesByUser(allBatches, user);
  const lists = filterPaymentListsByUser(allLists, user);
  const [dateRange, setDateRange] = useState('30d');

  const province = user?.province || null;
  const filteredVhwList = province 
    ? vhwMasterList.filter(record => record.province === province)
    : vhwMasterList;
  const vhwDistricts = [...new Set(filteredVhwList.map(record => record.district))].filter(d => d);

  // Filter VHW records by selected district
  const filteredVhwRecords = selectedVhwDistrict === 'all' 
    ? filteredVhwList 
    : filteredVhwList.filter(record => record.district === selectedVhwDistrict);

  // VHW Stats
  const vhwStats = [
    { label: 'Total VHWs', value: filteredVhwList.length },
    { label: 'VHW Districts', value: vhwDistricts.length },
    { label: 'Filtered VHWs', value: filteredVhwRecords.length },
  ];

  // VHW Payment Categories
  const vhwPaymentCategoryCounts = filteredVhwList.reduce((acc, record) => {
    acc[record.paymentCategory] = (acc[record.paymentCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vhwPaymentCategoryData = Object.entries(vhwPaymentCategoryCounts)
    .map(([category, count], index) => ({
      name: category,
      value: count,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const pendingBatches = batches.filter(b => b.status === 'pending').length;
  const readyBatches = batches.filter(b => b.status === 'validated').length;
  const completedBatches = batches.filter(b => b.status === 'completed').length;
  const failedBatches = batches.filter(b => b.status === 'failed').length;
  
  // Calculate percentage changes for stat cards
  const pendingChange = { value: '12%', positive: true };
  const readyChange = { value: '5%', positive: true };
  const completedChange = { value: '8%', positive: true };
  const failedChange = { value: '2%', positive: false };

  const recentBatches = batches.slice(0, 8);
  const validationQueue = lists.filter(l => l.status === 'submitted').slice(0, 4);

  const reconciliationData = [
    { province: 'BULAWAYO', certified: 1842, paid: 1840, variance: 2 },
    { province: 'HARARE', certified: 3201, paid: 3198, variance: 3 },
    { province: 'MANICALAND', certified: 1765, paid: 1765, variance: 0 },
    { province: 'MASHONALAND CENTRAL', certified: 1512, paid: 1510, variance: 2 },
    { province: 'MASHONALAND EAST', certified: 1423, paid: 1423, variance: 0 },
    { province: 'MASHONALAND WEST', certified: 1876, paid: 1873, variance: 3 },
  ];

  const totalCertified = reconciliationData.reduce((sum, r) => sum + r.certified, 0);
  const totalPaid = reconciliationData.reduce((sum, r) => sum + r.paid, 0);
  const totalVariance = reconciliationData.reduce((sum, r) => sum + r.variance, 0);

  return (
    <div className="space-y-6">
      {/* User Info Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#3b82f6]/10 to-[#1e40af]/10 rounded-lg px-4 py-3 border border-[#3b82f6]/20">
        <div>
          <p className="text-xs text-[#475569] uppercase tracking-wide">You are viewing data for</p>
          <div className="flex items-center gap-2 mt-1">
            {user?.province ? (
              <>
                <Globe className="w-5 h-5 text-[#3b82f6]" />
                <h2 className="text-lg font-bold text-[#3b82f6]">{user.province}</h2>
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 text-[#1e40af]" />
                <h2 className="text-lg font-bold text-[#1e40af]">NATIONAL (All Provinces)</h2>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#475569]">Logged in as</p>
          <p className="text-sm font-semibold text-[#1e293b]">{user?.fullName}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">{user?.role.replace(/_/g, ' ').toUpperCase()}</p>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] mb-1">Finance Dashboard</h1>
          <p className="text-sm text-[#64748b]">Real-time payment batch monitoring and reconciliation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#e2e8f0] text-sm text-[#475569]">
            <Calendar className="w-4 h-4" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-0 outline-none cursor-pointer font-medium"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
          <button 
            onClick={() => addToast('Report exported successfully', 'success')}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Last Sync Info */}
      <div className="text-xs text-[#94a3b8] px-1">Last synced: 2 minutes ago</div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        <StatCard label="Pending Batches" value={pendingBatches} icon={Clock} change={pendingChange} delay={0} />
        <StatCard label="Ready for Execution" value={readyBatches} icon={PlayCircle} change={readyChange} delay={100} />
        <StatCard label="Completed This Cycle" value={completedBatches} icon={CheckCircle} change={completedChange} delay={200} />
        <StatCard label="Failed Transactions" value={failedBatches} icon={XCircle} change={failedChange} delay={300} />
        {/* VHW Stats */}
        {vhwStats.map((stat, index) => (
          <StatCard key={index} label={stat.label} value={stat.value} icon={BarChart3} delay={400 + index * 100} />
        ))}
      </div>

      {/* VHW District Selector */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">VHW District Selector</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVhwDistrict} onValueChange={setSelectedVhwDistrict}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {vhwDistricts.map((district, index) => (
                <SelectItem key={index} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* VHW Charts & Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VHW Payment Categories Pie Chart */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">VHW Payment Categories</h3>
          <PieChartComponent
            data={vhwPaymentCategoryData}
            height={250}
            showLabel={true}
            showLegend={true}
            showTooltip={true}
            legendPosition="right"
            colors={COLORS}
            outerRadius={80}
            paddingAngle={2}
            tooltipFormatter={(value) => value.toLocaleString()}
          />
        </div>

        {/* VHW Payment Categories Details */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '600ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">Payment Categories Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(vhwPaymentCategoryCounts).map(([category, count], index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-semibold">{category}</div>
                <div className="text-xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VHW Records Table */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">VHW Records - {selectedVhwDistrict === 'all' ? 'All Districts' : selectedVhwDistrict}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">ID Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">District</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">Health Centre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">Phone Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">Payment Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">Data Quality</th>
                </tr>
              </thead>
              <tbody>
                {filteredVhwRecords.map((record, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{record.firstName} {record.lastName}</td>
                    <td className="px-4 py-3 text-sm">{record.idNumber}</td>
                    <td className="px-4 py-3 text-sm">{record.district}</td>
                    <td className="px-4 py-3 text-sm">{record.healthCentre}</td>
                    <td className="px-4 py-3 text-sm">{record.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.paymentCategory === 'Correct' ? 'bg-green-100 text-green-800' :
                        record.paymentCategory.includes('Over') ? 'bg-yellow-100 text-yellow-800' :
                        record.paymentCategory.includes('Under') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.paymentCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.dataQuality === 'Good' ? 'bg-green-100 text-green-800' :
                        record.dataQuality === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.dataQuality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Analytics */}
      <div className="animate-fade-up" style={{ animationDelay: '400ms' }}>
        <TransactionAnalytics dateRange={dateRange === '7d' ? { start: '7days_ago', end: 'today' } : dateRange === '30d' ? { start: '30days_ago', end: 'today' } : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Batches */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Recent Payment Batches</h3>
              <button onClick={() => navigate('/payment-batches')} className="text-[#0d9488] text-sm font-medium hover:underline flex items-center gap-1">
                View All <PlayCircle className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Batch ID</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Cycle</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Beneficiaries</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Amount</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#94a3b8] text-sm">No payment batches found</td>
                    </tr>
                  ) : (
                    recentBatches.map(batch => (
                      <tr key={batch.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                        <td className="px-4 py-3 text-sm text-[#1e293b] font-mono font-medium">{batch.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-sm text-[#475569]">Q2 2026</td>
                        <td className="px-4 py-3 text-sm text-[#1e293b]">{batch.totalBeneficiaries.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">${batch.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3"><Badge status={batch.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => addToast('Viewing batch details', 'success')} className="p-1.5 text-[#475569] hover:text-[#0d9488] hover:bg-[#f1f5f9] rounded transition-colors" title="View details">
                              <Eye className="w-4 h-4" />
                            </button>
                            {batch.status === 'pending' && (
                              <button onClick={() => addToast('Batch validated successfully', 'success')} className="p-1.5 text-[#475569] hover:text-[#16a34a] hover:bg-[#f1f5f9] rounded transition-colors" title="Validate">
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {batch.status === 'validated' && (
                              <button onClick={() => addToast('Batch execution started', 'success')} className="p-1.5 text-[#0d9488] hover:bg-[#f1f5f9] rounded transition-colors" title="Execute">
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reconciliation Summary */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-base font-semibold text-[#1e293b]">Q2 2026 Reconciliation Summary</h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">Certified vs Paid beneficiaries by province</p>
              </div>
              <button onClick={() => navigate('/reconciliation')} className="text-[#0d9488] text-sm font-medium hover:underline flex items-center gap-1">
                Full Report <PlayCircle className="w-3 h-3" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Total Certified</p>
                <p className="text-lg font-bold text-[#1e293b]">{totalCertified.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Total Paid</p>
                <p className="text-lg font-bold text-[#1e293b]">{totalPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Total Variance</p>
                <p className={`text-lg font-bold ${totalVariance === 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                  {totalVariance === 0 ? 'BALANCED' : `+${totalVariance}`}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Province</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Certified</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Paid</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Variance</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliationData.map(row => (
                    <tr key={row.province} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{row.province}</td>
                      <td className="px-4 py-3 text-sm text-[#1e293b]">{row.certified.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#1e293b]">{row.paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: row.variance === 0 ? '#16a34a' : '#dc2626' }}>
                        {row.variance === 0 ? '✓ 0' : `+${row.variance}`}
                      </td>
                      <td className="px-4 py-3">
                        {row.variance === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#d1fae5] text-[#065f46] text-xs font-medium rounded">
                            <CheckCircle className="w-3 h-3" /> Balanced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#fee2e2] text-[#991b1b] text-xs font-medium rounded">
                            <XCircle className="w-3 h-3" /> Discrepancy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Validation Queue */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '500ms' }}>
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1e293b]">Validation Queue</h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">{validationQueue.length} lists pending</p>
              </div>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[#fed7aa] text-[#92400e] text-xs font-bold rounded-full">
                {validationQueue.length}
              </span>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {validationQueue.length === 0 ? (
                <div className="px-5 py-8 text-center text-[#94a3b8] text-sm">No lists awaiting validation</div>
              ) : (
                validationQueue.map(list => (
                  <div key={list.id} className="px-5 py-4 hover:bg-[#fafbfc] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#1e293b]">{list.name}</p>
                        <div className="flex items-center gap-3 text-xs text-[#64748b] mt-1">
                          <span>{list.province}</span>
                          <span>•</span>
                          <span>{list.beneficiaryCount.toLocaleString()} beneficiaries</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToast(`Validated ${list.name}`, 'success')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0d9488] text-white rounded text-xs font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all"
                      >
                        <Check className="w-3 h-3" /> Validate
                      </button>
                      <button
                        onClick={() => addToast('Skipped validation', 'warning')}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[#94a3b8] hover:text-[#475569] text-xs transition-colors"
                        title="Skip"
                      >
                        <SkipForward className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Batch Pipeline */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '600ms' }}>
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Batch Pipeline</h3>
            <div className="space-y-4">
              {['Pending Validation', 'Validated', 'Processing', 'Completed'].map((stage, i) => {
                const count = batches.filter(b => {
                  const map = ['pending', 'validated', 'processing', 'completed'];
                  return b.status === map[i];
                }).length;
                const colors = ['#f97316', '#06b6d4', '#3b82f6', '#10b981'];
                const totalCount = batches.length;
                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i] }} />
                        <span className="text-sm font-medium text-[#475569]">{stage}</span>
                      </div>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full text-white`} style={{ backgroundColor: colors[i] }}>{count}</span>
                    </div>
                    <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: colors[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#0d9488] to-[#0f766e] rounded-lg p-5 animate-fade-up" style={{ animationDelay: '700ms' }}>
            <h3 className="text-base font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/payment-lists/new')}
                className="w-full px-4 py-2 bg-white text-[#0d9488] rounded font-medium text-sm hover:bg-[#f0fdfa] transition-colors active:scale-[0.98]"
              >
                + Create New List
              </button>
              <button 
                onClick={() => addToast('Opening batch execution', 'success')}
                className="w-full px-4 py-2 bg-white/20 text-white rounded font-medium text-sm hover:bg-white/30 transition-colors active:scale-[0.98]"
              >
                ⚡ Execute Batch
              </button>
              <button 
                onClick={() => navigate('/reports')}
                className="w-full px-4 py-2 bg-white/20 text-white rounded font-medium text-sm hover:bg-white/30 transition-colors active:scale-[0.98]"
              >
                📊 View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ecopay Transactions */}
      <div className="mt-8">
        <EcopayTransactions />
      </div>
    </div>
  );
}
