import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useBatches, usePaymentLists, useVhwMasterList } from '../hooks/useData';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import TransactionAnalytics from '../components/TransactionAnalytics';
import EcopayTransactions from '../components/EcopayTransactions';
import PieChartComponent from '../components/PieChartComponent';
import Faux3DBarChart from '../components/Faux3DBarChart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api } from '../lib/api';

import { Clock, PlayCircle, CheckCircle, XCircle, Eye, Check, SkipForward, Download, Calendar, Globe, BarChart3 } from 'lucide-react';
import { filterBatchesByUser, filterPaymentListsByUser } from '../utils/dataFilter';

const COLORS = ['#0d9488', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function FinanceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [allBatches] = useBatches();
  const [allLists] = usePaymentLists();
  const [vhwMasterList] = useVhwMasterList();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVhwDistrict, setSelectedVhwDistrict] = useState<string>('all');
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getFinanceStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch finance stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

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

  // VHW Stats (Using live data)
  const vhwStats = [
    { label: 'Total VHWs', value: stats.totalVhw || filteredVhwList.length },
    { label: 'VHW Districts', value: vhwDistricts.length },
    { label: 'Filtered VHWs', value: filteredVhwRecords.length },
  ];

  // VHW Payment Categories (From API)
  const vhwPaymentCategoryData = stats.vhwPaymentCategoryData.map((item: any, index: number) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));

  const pendingBatches = stats.pendingBatches;
  const readyBatches = stats.recentBatches?.length || 0;
  const completedBatches = stats.totalBatches - stats.pendingBatches;
  const failedBatches = 0; // Can get from transactions if needed
  
  // Calculate percentage changes for stat cards
  const pendingChange = { value: '12%', positive: true };
  const readyChange = { value: '5%', positive: true };
  const completedChange = { value: '8%', positive: true };
  const failedChange = { value: '2%', positive: false };

  const recentBatches = stats.recentBatches || batches.slice(0, 8);
  const validationQueue = lists.filter(l => l.status === 'submitted').slice(0, 4);

  const reconciliationData = stats.reconciliationData || [];

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VHW Payment Categories Pie Chart */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 animate-fade-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-6">Payment Distribution by Category</h3>
          <PieChartComponent
            data={vhwPaymentCategoryData}
            height={300}
            showLegend={true}
          />
        </div>

        {/* Performance Bar Chart */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 animate-fade-up" style={{ animationDelay: '600ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-6">Regional Disbursement Volume</h3>
          <div className="h-[300px]">
            <Faux3DBarChart data={reconciliationData} categoriesKey="province" series={[{key: 'certified', color: '#0d9488'}, {key: 'paid', color: '#3b82f6'}]} height={300} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#0d9488] to-[#0f766e] rounded-xl p-5 animate-fade-up" style={{ animationDelay: '700ms' }}>
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> VHW Management
          </h3>
          <p className="text-teal-50/70 text-xs mb-4 leading-relaxed">
            Manage Village Health Workers with advanced filters, search, and exports.
          </p>
          <button 
            onClick={() => navigate('/vhw-master-records')}
            className="w-full px-4 py-2 bg-white text-[#0d9488] rounded-lg font-bold text-sm hover:bg-[#f0fdfa] transition-colors active:scale-[0.98]"
          >
            Go to VHW Records
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-up" style={{ animationDelay: '750ms' }}>
          <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-teal-600" /> Payment Lists
          </h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Create, review and certify monthly payment lists for all active VHWs.
          </p>
          <button 
            onClick={() => navigate('/payment-lists')}
            className="w-full px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors active:scale-[0.98]"
          >
            Manage Lists
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fade-up" style={{ animationDelay: '800ms' }}>
          <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" /> Analytics & Reports
          </h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Access deep analytics on provincial distribution and payment reconciliation.
          </p>
          <button 
            onClick={() => navigate('/reports')}
            className="w-full px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors active:scale-[0.98]"
          >
            View Reports
          </button>
        </div>
      </div>

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
