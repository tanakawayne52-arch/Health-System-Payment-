import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useBeneficiaries, useAuditLogs, useVhwMasterList } from '@/hooks/useData';
import type { Beneficiary } from '@/types';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import PieChartComponent from '@/components/PieChartComponent';
import Faux3DBarChart from '@/components/Faux3DBarChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, AlertTriangle, Copy, UserPlus, Upload, Eye, BarChart3 } from 'lucide-react';

const COLORS = ['#0d9488', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function HRDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [selectedVhwDistrict, setSelectedVhwDistrict] = useState<string>('all');
  const [beneficiaries] = useBeneficiaries();
  const [auditLogs] = useAuditLogs();
  const [vhwMasterList] = useVhwMasterList();
  const province = user?.province || null;
  const filteredVhwList = province 
    ? vhwMasterList.filter(record => record.province === province)
    : vhwMasterList;
  const vhwDistricts = [...new Set(filteredVhwList.map(record => record.district))].filter(d => d);

  const duplicateAlerts = useMemo(() => {
    const nationalMap = new Map<string, Beneficiary[]>();
    const ecocashMap = new Map<string, Beneficiary[]>();

    beneficiaries.forEach((ben) => {
      const national = ben.nationalId?.trim();
      if (national) {
        const list = nationalMap.get(national) ?? [];
        list.push(ben);
        nationalMap.set(national, list);
      }
      const ecocash = ben.ecocashNumber?.trim();
      if (ecocash) {
        const list = ecocashMap.get(ecocash) ?? [];
        list.push(ben);
        ecocashMap.set(ecocash, list);
      }
    });

    const alerts: Array<{ id: string; nationalId: string; names: string; ecocash: string; provinces: string; type: string }> = [];

    nationalMap.forEach((members, nationalId) => {
      if (members.length > 1) {
        alerts.push({
          id: `nat-${nationalId}`,
          nationalId,
          names: Array.from(new Set(members.map(member => member.fullName))).join(' / '),
          ecocash: Array.from(new Set(members.map(member => member.ecocashNumber || ''))).filter(Boolean).join(', '),
          provinces: Array.from(new Set(members.map(member => member.province))).join(', '),
          type: 'National ID duplicate',
        });
      }
    });

    ecocashMap.forEach((members, ecocashNumber) => {
      if (members.length > 1) {
        alerts.push({
          id: `eco-${ecocashNumber}`,
          nationalId: Array.from(new Set(members.map(member => member.nationalId || ''))).filter(Boolean).join(', '),
          names: Array.from(new Set(members.map(member => member.fullName))).join(' / '),
          ecocash: ecocashNumber,
          provinces: Array.from(new Set(members.map(member => member.province))).join(', '),
          type: 'Ecocash duplicate',
        });
      }
    });

    return alerts.slice(0, 5);
  }, [beneficiaries]);

  const provinceData = Object.entries(
    filteredVhwList.reduce((acc, record) => {
      acc[record.province] = (acc[record.province] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([province, count]) => ({ province, count }));

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

  const activeCount = beneficiaries.filter(b => b.status === 'active').length;
  const inactiveCount = beneficiaries.filter(b => b.status === 'inactive').length;
  const exitedCount = beneficiaries.filter(b => b.status === 'exited').length;

  // Simulate duplicates
  const duplicateAlerts = [
    { id: 'd1', nationalId: '45-1234567 M89', names: 'Mary Moyo / Maria Moyo', ecocash: '0773123456', provinces: 'BULAWAYO, HARARE', type: 'Same ID Different Phone' },
    { id: 'd2', nationalId: '63-7654321 K45', names: 'John Sibanda', ecocash: '0775987654', provinces: 'MASVINGO, MIDLANDS', type: 'Same Phone Different ID' },
    { id: 'd3', nationalId: '72-9876543 L12', names: 'Grace Ndlovu / Grace Ndhlovu', ecocash: '0774567890', provinces: 'MANICALAND', type: 'Same Name Different ID' },
  ];

  const recentAdditions = beneficiaries.slice(0, 5);
  const recentAudit = auditLogs.filter(l => l.entityType === 'Beneficiary').slice(0, 5);

  const statusData = [
    { name: 'Active', value: activeCount, color: '#16a34a' },
    { name: 'Inactive', value: inactiveCount, color: '#ca8a04' },
    { name: 'Exited', value: exitedCount, color: '#dc2626' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        <StatCard label="Total Beneficiaries" value={beneficiaries.length.toLocaleString()} icon={Users} delay={0} />
        <StatCard label="Active This Cycle" value={activeCount.toLocaleString()} icon={UserCheck} delay={100} />
        <StatCard label="Pending Verification" value={inactiveCount.toLocaleString()} icon={AlertTriangle} delay={200} />
        <StatCard label="Duplicates Found" value={duplicateAlerts.length} icon={Copy} delay={300} />
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
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-6">Beneficiary Status Distribution</h3>
          <PieChartComponent
            data={statusData}
            height={280}
            showLegend={true}
          />
        </div>

        {/* Provincial Distribution Bar Chart */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 animate-fade-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-base font-semibold text-[#1e293b] mb-6">Regional VHW Distribution</h3>
          <div className="h-[280px]">
            <Faux3DBarChart data={provinceData} categoriesKey="province" series={[{key: 'count', color: '#0d9488'}]} height={280} />
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
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">ID Number</th>
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
          {/* Beneficiary Management */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Beneficiary Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => navigate('/beneficiaries')}
                className="flex items-center gap-3 p-4 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] active:scale-[0.98] transition-all"
              >
                <UserPlus className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-semibold text-sm">Add New VHW</p>
                  <p className="text-xs text-white/80">Register a new beneficiary</p>
                </div>
              </button>
              <button
                onClick={() => addToast('Import feature coming soon', 'warning')}
                className="flex items-center gap-3 p-4 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-lg hover:bg-[#f1f5f9] transition-all"
              >
                <Upload className="w-6 h-6 text-[#0d9488]" />
                <div className="text-left">
                  <p className="font-semibold text-sm">Bulk Import</p>
                  <p className="text-xs text-[#475569]">Import from CSV/Excel</p>
                </div>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Name</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">National ID</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Province</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAdditions.map(ben => (
                    <tr key={ben.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                      <td className="px-4 py-2.5 text-sm text-[#1e293b]">{ben.fullName}</td>
                      <td className="px-4 py-2.5 text-sm text-[#475569]">{ben.nationalId}</td>
                      <td className="px-4 py-2.5 text-sm text-[#475569]">{ben.province}</td>
                      <td className="px-4 py-2.5"><Badge status={ben.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Duplicate Alerts */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Duplicate Alerts</h3>
              <span className="bg-[rgba(220,38,38,0.1)] text-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded-full">{duplicateAlerts.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">National ID</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Name(s)</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">EcoCash</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Conflict Type</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateAlerts.map(dup => (
                    <tr key={dup.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors" style={{ borderLeft: '2px solid #dc2626' }}>
                      <td className="px-4 py-3 text-sm text-[#1e293b] font-mono">{dup.nationalId}</td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{dup.names}</td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{dup.ecocash}</td>
                      <td className="px-4 py-3 text-sm text-[#d97706]">{dup.type}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => addToast('Opening duplicate review', 'success')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#e2e8f0] rounded text-xs text-[#475569] hover:bg-[#f1f5f9] transition-colors"
                        >
                          <Eye className="w-3 h-3" /> Review
                        </button>
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
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Beneficiary Status Distribution</h3>
            <PieChartComponent
              data={statusData}
              height={220}
              showLegend={true}
              innerRadius={50}
              outerRadius={70}
            />
          </div>

          {/* Recent Audit Activity */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '500ms' }}>
            <div className="px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Recent Master Data Changes</h3>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {recentAudit.map(log => (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge status={log.action.toLowerCase()}>{log.action}</Badge>
                    <span className="text-xs text-[#475569]">{log.entityType}</span>
                  </div>
                  <p className="text-sm text-[#1e293b]">{log.userName}</p>
                  <p className="text-xs text-[#94a3b8]">{new Date(log.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#e2e8f0]">
              <button onClick={() => navigate('/audit-trail')} className="text-[#0d9488] text-sm font-medium hover:underline">
                View Full Audit Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
