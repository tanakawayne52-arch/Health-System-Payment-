import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, ClipboardCheck, 
  BarChart3, ChevronRight, TrendingUp, AlertCircle,
  Clock, MapPin, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import PieChartComponent from '@/components/PieChartComponent';

const COLORS = ['#0d9488', '#0ea5e9', '#6366f1', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getAdminStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
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

  const vhwStats = [
    { label: 'TOTAL USERS', value: stats.totalUsers, icon: Users, color: 'blue' },
    { label: 'ACTIVE SESSIONS', value: stats.activeSessions, icon: Activity, color: 'emerald' },
    { label: 'AUDIT EVENTS TODAY', value: stats.auditEventsToday, icon: ClipboardCheck, color: 'indigo' },
    { label: 'EXCEPTIONS REQUIRING ACTION', value: stats.pendingExceptions, icon: AlertCircle, color: 'rose' },
    { label: 'TOTAL VHWS', value: stats.totalVhw, icon: BarChart3, color: 'teal' },
    { label: 'VHW PROVINCES', value: stats.vhwProvincesCount, icon: MapPin, color: 'teal' },
  ];

  const paymentCategoryData = stats.vhwPaymentCategoryData.map((item: any, idx: number) => ({
    ...item,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="p-8 space-y-10 bg-slate-50/50 min-h-screen">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            Welcome back, <span className="text-teal-600 font-bold">{user?.name}</span> • National Administrator Control Panel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Live</span>
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {vhwStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-slate-900">{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - 8/12 */}
        <div className="lg:col-span-8 space-y-8">
          {/* Chart Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Regional Workforce Distribution</h3>
                <p className="text-sm text-slate-400">Total active VHWs mapped across provinces</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100">7 Days</button>
                <button className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-xs font-bold">30 Days</button>
              </div>
            </div>
            
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.vhwProvinceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="province" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#0d9488" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* VHW Management Shortcut */}
          <div className="card-professional p-8 bg-white border-l-4 border-teal-500 shadow-sm overflow-hidden relative group">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-teal-600" />
                  VHW Workforce Master Records
                </h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  Access the complete database of Village Health Workers across all ten provinces. 
                  Perform advanced filtering, audit data quality, and monitor regional distribution.
                </p>
                
                <div className="flex flex-wrap gap-3 mt-6">
                  <button 
                    onClick={() => navigate('/vhw-national-dashboard')}
                    className="px-4 py-2 bg-teal-50 text-teal-700 rounded-lg font-semibold text-xs hover:bg-teal-100 transition-colors flex items-center gap-2"
                  >
                    National Dashboard
                  </button>
                  <button 
                    onClick={() => navigate('/vhw-provincial-dashboard')}
                    className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    Provincial Analytics
                  </button>
                  <button 
                    onClick={() => navigate('/workforce-summary')}
                    className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    Workforce Summary
                  </button>
                  <button 
                    onClick={() => navigate('/beneficiaries')}
                    className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    VHW Records
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/vhw-master-records')}
                className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0"
              >
                View Master Records <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - 4/12 */}
        <div className="lg:col-span-4 space-y-8">
          {/* Ring Chart Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Payment Category Distribution</h3>
            <p className="text-sm text-slate-400 mb-8">Data quality and disbursement categorization</p>
            
            <div className="h-[400px]">
              <PieChartComponent
                data={paymentCategoryData}
                height="100%"
                showLegend={true}
              />
            </div>
          </div>

          {/* Active Users List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Active Sessions</h3>
              <button className="text-xs font-bold text-teal-600 hover:text-teal-700">View All</button>
            </div>
            
            <div className="space-y-4">
              {stats.activeSessionsList.map((session: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{session.user}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{session.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{session.page}</div>
                    <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> {new Date(session.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
