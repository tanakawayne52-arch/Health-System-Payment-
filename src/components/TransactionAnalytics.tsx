import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import PieChartComponent from './PieChartComponent';
import { api } from '../lib/api';
import { TrendingUp, TrendingDown, Activity, Users, CheckCircle } from 'lucide-react';

interface AnalyticsData {
  dailyTransactions: Array<{
    date: string;
    successful: number;
    failed: number;
    total_amount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  successRate: number;
  avgProcessingTime: number;
  monthlyGrowth: number;
  topProvinces: Array<{
    province: string;
    count: number;
    amount: number;
  }>;
}

interface TransactionAnalyticsProps {
  dateRange?: { start: string; end: string };
  province?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({
  dateRange,
  province,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'volume' | 'amount' | 'success'>('volume');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, province]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.getAnalytics({
        start_date: dateRange?.start,
        end_date: dateRange?.end,
        province,
      });
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-slate-900">
                {entry.name.includes('Amount') 
                  ? formatCurrency(entry.value)
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600">+2.3%</span>
            <span className="text-slate-400">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg. Processing Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.avgProcessingTime.toFixed(1)}s
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingDown className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600">-0.5s</span>
            <span className="text-slate-400">faster</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Monthly Growth</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.monthlyGrowth > 0 ? '+' : ''}{data.monthlyGrowth.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Transaction volume growth
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Beneficiaries</p>
              <p className="text-2xl font-bold text-teal-600">
                {(data.topProvinces.reduce((sum, p) => sum + p.count, 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-teal-100 rounded-xl">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Received payments this period
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Transaction Trends</h3>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            {(['volume', 'amount', 'success'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'volume' ? 'Volume' : tab === 'amount' ? 'Amount' : 'Success Rate'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'volume' ? (
              <BarChart data={data.dailyTransactions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="successful" name="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeTab === 'amount' ? (
              <AreaChart data={data.dailyTransactions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total_amount"
                  name="Total Amount"
                  stroke="#10b981"
                  fill="url(#colorAmount)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            ) : (
              <LineChart data={data.dailyTransactions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={(d) => d.successful + d.failed > 0 
                    ? ((d.successful / (d.successful + d.failed)) * 100).toFixed(1) 
                    : 0}
                  name="Success Rate"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Province Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Payments by Province</h3>
          <PieChartComponent
            data={data.topProvinces.map((province, index) => ({
              name: province.province,
              value: province.amount,
              color: COLORS[index % COLORS.length],
            }))}
            height={260}
            innerRadius={50}
            outerRadius={90}
            showLabel={false}
            showLegend={false}
            showTooltip={true}
            paddingAngle={2}
            tooltipFormatter={(value) => formatCurrency(value as number)}
          />
        </div>

        {/* Top Provinces Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Province Breakdown</h3>
          <div className="space-y-3">
            {data.topProvinces.map((province, index) => (
              <div key={province.province} className="flex items-center gap-4">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {province.province}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(province.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(province.amount / Math.max(...data.topProvinces.map(p => p.amount))) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {province.count.toLocaleString()} transactions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionAnalytics;
