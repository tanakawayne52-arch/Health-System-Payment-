import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useUsers, useAuditLogs, useExceptions, useVhwMasterList } from '@/hooks/useData';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import PieChartComponent from '@/components/PieChartComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Activity, ClipboardList, AlertOctagon, LogOut as LogOutIcon, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0d9488', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useUsers();
  const [auditLogs, setAuditLogs] = useAuditLogs();
  const [exceptions, setExceptions] = useExceptions();
  const [vhwMasterList, setVhwMasterList] = useVhwMasterList();
  const [selectedVhwProvince, setSelectedVhwProvince] = useState<string>('all');

  // WebSocket for real live data
  const { subscribe, isConnected, connectionError } = useWebSocket(user?.id);
  const vhwProvinces = [...new Set(vhwMasterList.map(record => record.province))].filter(p => p);

  // Listen for real-time WebSocket events and update data
  useEffect(() => {
    // User updates
    const unsubUsers = subscribe('users:update', (data: unknown) => {
      console.log('[WS] Users update received:', data);
      setUsers(data as any);
    });

    // Audit log updates
    const unsubAudit = subscribe('audit:new', (data: unknown) => {
      console.log('[WS] New audit log received:', data);
      setAuditLogs(prev => [data as any, ...prev]);
    });

    // Exception updates
    const unsubExceptions = subscribe('exceptions:update', (data: unknown) => {
      console.log('[WS] Exceptions update received:', data);
      setExceptions(data as any);
    });

    // VHW updates
    const unsubVhw = subscribe('vhw:update', (data: unknown) => {
      console.log('[WS] VHW update received:', data);
      setVhwMasterList(data as any);
    });

    // Any other real-time events (like active sessions, etc.)
    const unsubWildcard = subscribe('*', (data: unknown) => {
      console.log('[WS] New event:', data);
    });

    return () => {
      unsubUsers();
      unsubAudit();
      unsubExceptions();
      unsubVhw();
      unsubWildcard();
    };
  }, [subscribe, setUsers, setAuditLogs, setExceptions, setVhwMasterList]);

  // Filter VHW records by selected province
  const filteredVhwRecords = selectedVhwProvince === 'all' 
    ? vhwMasterList 
    : vhwMasterList.filter(record => record.province === selectedVhwProvince);

  // VHW Stats
  const vhwStats = [
    { label: 'Total VHWs', value: vhwMasterList.length },
    { label: 'VHW Provinces', value: vhwProvinces.length },
    { label: 'Filtered VHWs', value: filteredVhwRecords.length },
  ];

  // VHW Payment Categories
  const vhwPaymentCategoryCounts = vhwMasterList.reduce((acc, record) => {
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

  // VHW Province Counts
  const vhwProvinceCounts = vhwMasterList.reduce((acc, record) => {
    if (record.province) {
      acc[record.province] = (acc[record.province] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const vhwProvinceData = Object.entries(vhwProvinceCounts)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);

  const activeUsers = users.filter(u => u.isActive).length;
  const todayLogs = auditLogs.filter(l => {
    const logDate = new Date(l.timestamp).toDateString();
    const today = new Date().toDateString();
    return logDate === today;
  }).length;
  const pendingExceptions = exceptions.filter(e => e.status === 'pending');

  const chartData = [
    { province: 'BUL', submitted: 1842, certified: 1805 },
    { province: 'HAR', submitted: 3201, certified: 3180 },
    { province: 'MAN', submitted: 1765, certified: 1740 },
    { province: 'MSC', submitted: 1512, certified: 1495 },
    { province: 'MSE', submitted: 1650, certified: 1630 },
    { province: 'MSW', submitted: 2100, certified: 2080 },
    { province: 'MAS', submitted: 1980, certified: 1955 },
    { province: 'MTN', submitted: 1200, certified: 1180 },
    { province: 'MTS', submitted: 1100, certified: 1085 },
    { province: 'MID', submitted: 2400, certified: 2370 },
  ];

  const recentAudit = auditLogs.slice(0, 6);
  const activeSessions = [
    { user: 'Tendai Moyo', role: 'Provincial Officer', login: '08:30 AM', page: 'Dashboard', lastActivity: '2 min ago' },
    { user: 'Grace Sibanda', role: 'HR/Custodian', login: '08:15 AM', page: 'Beneficiaries', lastActivity: '5 min ago' },
    { user: 'Peter Ndlovu', role: 'Finance Officer', login: '09:00 AM', page: 'Payment Batches', lastActivity: 'Just now' },
    { user: 'Sarah Ncube', role: 'National Admin', login: '07:45 AM', page: 'Audit Trail', lastActivity: '1 min ago' },
  ];

  const handleApprove = (id: string) => {
    const updated = exceptions.map(e => e.id === id ? { ...e, status: 'approved' as const, reviewedAt: new Date().toISOString() } : e);
    setExceptions(updated);
    addToast('Exception approved and processed', 'success');
  };

  const handleReject = (id: string) => {
    const updated = exceptions.map(e => e.id === id ? { ...e, status: 'rejected' as const, reviewedAt: new Date().toISOString() } : e);
    setExceptions(updated);
    addToast('Exception rejected', 'warning');
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Indicator (only show if there's an error or connected) */}
      {(isConnected || connectionError) && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-xs font-medium">
            {isConnected ? 'Live Connection Active' : connectionError || 'Working with Local Data'}
          </span>
        </div>
      )}
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        <StatCard label="Total Users" value={activeUsers} icon={Users} delay={0} />
        <StatCard label="Active Sessions" value={activeSessions.length} icon={Activity} delay={100} />
        <StatCard label="Audit Events Today" value={todayLogs} icon={ClipboardList} delay={200} />
        <StatCard label="Exceptions Requiring Action" value={pendingExceptions.length} icon={AlertOctagon} delay={300} />
        {/* VHW Stats */}
        {vhwStats.map((stat, index) => (
          <StatCard key={index} label={stat.label} value={stat.value} icon={BarChart3} delay={400 + index * 100} />
        ))}
      </div>

      {/* VHW Province Selector */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">VHW Province Selector</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVhwProvince} onValueChange={setSelectedVhwProvince}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {vhwProvinces.map((province, index) => (
                <SelectItem key={index} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* VHW Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VHW Provinces Bar Chart */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">VHWs per Province</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vhwProvinceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="province" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend />
                <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* VHW Payment Categories Pie Chart */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">VHW Payment Categories</h3>
          <PieChartComponent
            data={vhwPaymentCategoryData}
            height={280}
            showLabel={true}
            showLegend={true}
            showTooltip={true}
            legendPosition="right"
            colors={COLORS}
            outerRadius={90}
            paddingAngle={2}
            tooltipFormatter={(value) => value.toLocaleString()}
          />
        </div>
      </div>

      {/* VHW Payment Categories Details */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">Payment Categories Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(vhwPaymentCategoryCounts).map(([category, count], index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-semibold">{category}</div>
                <div className="text-xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* VHW Records Table */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">VHW Records - {selectedVhwProvince === 'all' ? 'All Provinces' : selectedVhwProvince}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">ID Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Province</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">District</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Health Centre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Phone Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Payment Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Data Quality</th>
                </tr>
              </thead>
              <tbody>
                {filteredVhwRecords.map((record, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{record.firstName} {record.lastName}</td>
                    <td className="px-4 py-3 text-sm">{record.idNumber}</td>
                    <td className="px-4 py-3 text-sm">{record.province}</td>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Overview */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">System Overview — Q2 2026</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="province" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="submitted" fill="#0891b2" name="Submitted" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="certified" fill="#16a34a" name="Certified" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#e2e8f0]">
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">8 <span className="text-sm font-normal text-[#475569]">of 10</span></p>
                <p className="text-xs text-[#475569]">Provinces Submitted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d9488]">6</p>
                <p className="text-xs text-[#475569]">Lists Certified</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#16a34a]">4</p>
                <p className="text-xs text-[#475569]">Batches Executed</p>
              </div>
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Recent Audit Events</h3>
              <button onClick={() => navigate('/audit-trail')} className="text-[#0d9488] text-sm font-medium hover:underline">
                View Full Trail
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Timestamp</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">User</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Action</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Entity</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudit.map(log => (
                    <tr key={log.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                      <td className="px-4 py-3 text-xs text-[#475569] whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#1e293b]">{log.userName}</td>
                      <td className="px-4 py-3"><Badge status={log.action.toLowerCase()}>{log.action}</Badge></td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{log.entityType}</td>
                      <td className="px-4 py-3 text-sm text-[#475569] max-w-[200px] truncate">{log.reason || `${log.action} ${log.entityType}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Exception Queue */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Exception Queue</h3>
              {pendingExceptions.length > 0 && (
                <span className="bg-[rgba(217,119,6,0.1)] text-[#d97706] text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingExceptions.length}</span>
              )}
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {exceptions.map(ex => (
                <div key={ex.id} className="px-5 py-4" style={{ borderLeft: ex.status === 'pending' ? '3px solid #d97706' : ex.status === 'approved' ? '3px solid #16a34a' : '3px solid #dc2626' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge status={ex.type}>{ex.type.replace(/_/g, ' ')}</Badge>
                    {ex.status !== 'pending' && <Badge status={ex.status}>{ex.status}</Badge>}
                  </div>
                  <p className="text-sm text-[#475569] mb-0.5">{ex.province}</p>
                  <p className="text-xs text-[#94a3b8] mb-1">By: {ex.requesterName}</p>
                  <p className="text-xs text-[#475569] mb-3 line-clamp-2">{ex.reason}</p>
                  {ex.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(ex.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#0d9488] text-white rounded text-xs font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(ex.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#e2e8f0] text-[#475569] rounded text-xs font-medium hover:bg-[#f1f5f9] transition-all"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '500ms' }}>
            <div className="px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Current User Activity</h3>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {activeSessions.map((session, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1e293b]">{session.user}</p>
                    <p className="text-xs text-[#475569]">{session.role} — {session.page}</p>
                    <p className="text-xs text-[#94a3b8]">{session.lastActivity}</p>
                  </div>
                  <button
                    onClick={() => addToast(`Force logout for ${session.user}`, 'warning')}
                    className="p-1.5 text-[#94a3b8] hover:text-[#dc2626] transition-colors"
                    title="Force Logout"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
