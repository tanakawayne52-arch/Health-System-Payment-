import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import { getPaymentLists, getBeneficiaries, getVhwMasterList } from '@/data/seed';
import { FileText, CheckCircle, Users, AlertCircle, FilePlus, Send, Download, Eye, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProvincialDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const province = user?.province || 'BULAWAYO';
  const [selectedVhwDistrict, setSelectedVhwDistrict] = useState<string>('all');

  const lists = getPaymentLists().filter(l => l.province === province);
  const beneficiaries = getBeneficiaries().filter(b => b.province === province);
  const vhwMasterList = getVhwMasterList();
  const provinceVhwList = vhwMasterList.filter(record => record.province === province);
  const vhwDistricts = [...new Set(provinceVhwList.map(record => record.district))].filter(d => d);

  // Filter VHW records by selected district
  const filteredVhwRecords = selectedVhwDistrict === 'all' 
    ? provinceVhwList 
    : provinceVhwList.filter(record => record.district === selectedVhwDistrict);

  // VHW Stats
  const vhwStats = [
    { label: 'Total VHWs', value: provinceVhwList.length },
    { label: 'VHW Districts', value: vhwDistricts.length },
    { label: 'Filtered VHWs', value: filteredVhwRecords.length },
  ];

  // VHW Payment Categories
  const vhwPaymentCategoryCounts = provinceVhwList.reduce((acc, record) => {
    acc[record.paymentCategory] = (acc[record.paymentCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // VHW District Counts
  const vhwDistrictCounts = provinceVhwList.reduce((acc, record) => {
    if (record.district) {
      acc[record.district] = (acc[record.district] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const vhwDistrictData = Object.entries(vhwDistrictCounts)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);

  const activeLists = lists.filter(l => l.status === 'draft' || l.status === 'submitted').length;
  const certifiedLists = lists.filter(l => l.status === 'certified').length;
  const pendingActions = lists.filter(l => l.status === 'draft' || l.status === 'rejected').length;

  const recentLists = lists.slice(0, 5);

  const districtCounts = beneficiaries.reduce((acc, b) => {
    acc[b.district] = (acc[b.district] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(districtCounts)
    .map(([name, value]) => ({ name: name.split(' ')[0], value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const statusCounts = beneficiaries.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Province Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0d9488]/10 to-[#10b981]/10 rounded-lg px-4 py-3 border border-[#0d9488]/20">
        <div>
          <p className="text-xs text-[#475569] uppercase tracking-wide">You are viewing data for</p>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-5 h-5 text-[#0d9488]" />
            <h2 className="text-lg font-bold text-[#0d9488]">{province}</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#475569]">Logged in as</p>
          <p className="text-sm font-semibold text-[#1e293b]">{user?.fullName}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">{user?.role.replace(/_/g, ' ').toUpperCase()}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        <StatCard label="My Active Lists" value={activeLists} icon={FileText} delay={0} />
        <StatCard label="Certified Lists" value={certifiedLists} icon={CheckCircle} delay={100} />
        <StatCard label="Total Beneficiaries" value={beneficiaries.length.toLocaleString()} icon={Users} delay={200} />
        <StatCard label="Pending Actions" value={pendingActions} icon={AlertCircle} delay={300} />
        {/* VHW Stats */}
        {vhwStats.map((stat, index) => (
          <StatCard key={index} label={stat.label} value={stat.value} icon={Users} delay={400 + index * 100} />
        ))}
      </div>

      {/* VHW Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VHW Districts Bar Chart */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up">
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">VHWs per District</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vhwDistrictData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="district" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend />
                <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* VHW Payment Categories */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up">
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">VHW Payment Categories</h3>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(vhwPaymentCategoryCounts).map(([category, count], index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-lg font-semibold">{category}</div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>
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
        {/* Current Cycle Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Current Payment Cycle — Q2 2026</h3>
            <div className="flex items-center gap-1">
              {['Cycle Open', 'Lists Submitted', 'Lists Certified', 'Batch Created', 'Payment Executed'].map((stage, i) => (
                <div key={stage} className="flex-1 flex items-center">
                  <div className="flex-1">
                    <div className={`h-2 rounded-full ${i < 2 ? 'bg-[#0d9488]' : i === 2 ? 'bg-[#0d9488]' : 'bg-[#e2e8f0]'}`} />
                    <p className={`text-[10px] mt-1.5 font-medium ${i < 3 ? 'text-[#0d9488]' : 'text-[#94a3b8]'}`}>{stage}</p>
                  </div>
                  {i < 4 && <div className={`w-4 h-px ${i < 2 ? 'bg-[#0d9488]' : 'bg-[#e2e8f0]'}`} />}
                </div>
              ))}
            </div>
            <p className="text-sm text-[#d97706] mt-3 font-medium">Submission deadline: 15 June 2026</p>
          </div>

          {/* Recent Lists */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Recent Payment Lists</h3>
              <button onClick={() => navigate('/payment-lists')} className="text-[#0d9488] text-sm font-medium hover:underline">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">List Name</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">District</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Beneficiaries</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Amount</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLists.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#94a3b8] text-sm">No payment lists found</td>
                    </tr>
                  ) : (
                    recentLists.map(list => (
                      <tr key={list.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                        <td className="px-4 py-3 text-sm text-[#1e293b]">{list.name}</td>
                        <td className="px-4 py-3 text-sm text-[#475569]">{list.district || 'All Districts'}</td>
                        <td className="px-4 py-3 text-sm text-[#1e293b]">{list.beneficiaryCount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-[#1e293b]">${list.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3"><Badge status={list.status} /></td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { addToast('Viewing list details', 'success'); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#e2e8f0] rounded text-xs text-[#475569] hover:bg-[#f1f5f9] transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => navigate('/payment-lists/new')}
                className="flex items-center gap-3 px-4 py-3 bg-[#0d9488] text-white rounded-md hover:bg-[#0f766e] active:scale-[0.98] transition-all text-sm font-medium"
              >
                <FilePlus className="w-4 h-4" /> Create New List
              </button>
              <button
                onClick={() => navigate('/beneficiaries')}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-md hover:bg-[#f1f5f9] transition-all text-sm font-medium"
              >
                <Users className="w-4 h-4 text-[#0d9488]" /> View All Beneficiaries
              </button>
              <button
                onClick={() => addToast('Submit feature coming soon', 'warning')}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-md hover:bg-[#f1f5f9] transition-all text-sm font-medium"
              >
                <Send className="w-4 h-4 text-[#0d9488]" /> Submit for Certification
              </button>
              <button
                onClick={() => addToast('Template download started', 'success')}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-md hover:bg-[#f1f5f9] transition-all text-sm font-medium"
              >
                <Download className="w-4 h-4 text-[#0d9488]" /> Download Template
              </button>
            </div>
          </div>

          {/* Beneficiary Overview */}
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 animate-fade-up" style={{ animationDelay: '500ms' }}>
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Province Beneficiary Summary</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#e2e8f0]">
              <span className="text-xs text-[#475569]">
                Active: <strong className="text-[#16a34a]">{statusCounts.active || 0}</strong>
              </span>
              <span className="text-xs text-[#475569]">
                Inactive: <strong className="text-[#ca8a04]">{statusCounts.inactive || 0}</strong>
              </span>
              <span className="text-xs text-[#475569]">
                Exited: <strong className="text-[#dc2626]">{statusCounts.exited || 0}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
