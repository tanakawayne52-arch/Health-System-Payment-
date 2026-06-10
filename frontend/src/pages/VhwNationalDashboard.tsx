import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useVhwMasterList } from '../hooks/useData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import PieChartComponent from '../components/PieChartComponent';
import PivotTables from '../components/PivotTables';
import Faux3DBarChart from '../components/Faux3DBarChart';
import { Activity, GitCompare, BarChart3, Users, MapPin, CheckCircle, Info, Phone, Search, X, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import Badge from '../components/Badge';

const COLORS = ['#2dd4bf', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const VhwNationalDashboard: React.FC = () => {
  const { isNationalLevel, user } = useAuth();
  const navigate = useNavigate();
  const [vhwMasterList] = useVhwMasterList();
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  if (!isNationalLevel) {
    return <Navigate to="/" replace />;
  }

  // Calculate some basic stats from the master list
  const totalRecords = vhwMasterList.length;
  const provinces = [...new Set(vhwMasterList.map(record => record.province))].filter(p => p);
  
  // Filter VHW records by selected province and search query
  const filteredVhwRecords = vhwMasterList.filter(record => {
    const matchesProvince = selectedProvince === 'all' || record.province === selectedProvince;
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      `${record.firstName} ${record.lastName}`.toLowerCase().includes(searchStr) ||
      record.idNumber.toLowerCase().includes(searchStr) ||
      record.phoneNumber.toLowerCase().includes(searchStr);
    return matchesProvince && matchesSearch;
  });

  const paginatedRecords = filteredVhwRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredVhwRecords.length / pageSize);

  const nationalStats = [
    { label: 'Total VHWs', value: totalRecords, icon: Users, color: 'teal' },
    { label: 'Provinces', value: provinces.length, icon: MapPin, color: 'blue' },
    { label: 'Verified Payments', value: vhwMasterList.filter(r => r.paymentCategory === 'Correct').length, icon: CheckCircle, color: 'green' },
  ];

  // Create a simple summary of payment categories
  const paymentCategoryCounts = vhwMasterList.reduce((acc, record) => {
    acc[record.paymentCategory] = (acc[record.paymentCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for pie chart
  const paymentCategoryData = Object.entries(paymentCategoryCounts)
    .map(([category, count], index) => ({
      name: category,
      value: count,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Count per province
  const provinceMetrics = vhwMasterList.reduce((acc, record) => {
    if (record.province) {
      acc[record.province] = (acc[record.province] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const provinceData = Object.entries(provinceMetrics).map(([province, count]) => ({
    province,
    count,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">National Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Comprehensive overview of VHW workforce and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card-professional px-4 py-2 bg-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live System Status</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {nationalStats.map((stat, index) => (
          <div key={index} className="card-professional p-6 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value.toLocaleString()}</h4>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
              stat.color === 'teal' ? 'bg-teal-50 text-teal-600' :
              stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              'bg-green-50 text-green-600'
            }`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Categories Ring Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-6">National Payment Category Distribution</h3>
          <PieChartComponent
            data={paymentCategoryData}
            height={320}
            showLegend={true}
          />
        </div>

        {/* VHWs per Province Bar Chart */}
        <div className="card-professional p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Regional Workforce</h3>
              <p className="text-xs text-slate-500 font-medium">VHW volume per province</p>
            </div>
            <div className="p-2 bg-teal-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <div className="h-[320px]">
            <Faux3DBarChart data={provinceData} categoriesKey="province" series={[{key: 'count', color: '#0d9488'}]} height={320} />
          </div>
        </div>
      </div>

      {/* Workforce Summary Redirect */}
      <div className="card-professional p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Workforce Master Summary</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Access detailed national pivot tables and analytical summaries</p>
        </div>
        <button 
          onClick={() => navigate('/workforce-summary')}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          View Full Summary <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Table Section */}
      <div className="space-y-6">
        <div className="card-professional p-4 flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, ID, or phone..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-w-[240px] w-full">
            <Select value={selectedProvince} onValueChange={(val) => { setSelectedProvince(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-11 text-sm font-semibold text-slate-700 shadow-sm focus:ring-teal-500/10">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="all">National (All Provinces)</SelectItem>
                {provinces.map((p, i) => <SelectItem key={i} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="card-professional overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Village Health Worker</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identifiers</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                          {record.firstName[0]}{record.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-none">{record.firstName} {record.lastName}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {record.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{record.idNumber}</span>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(record.idNumber); }}
                            className="text-slate-400 hover:text-teal-500 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{record.healthCentre}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold text-slate-700">{record.district}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{record.province}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        record.paymentCategory === 'Correct' ? 'bg-green-100 text-green-700' :
                        record.paymentCategory.includes('Over') ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {record.paymentCategory}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold">
              Showing <span className="text-slate-900">{((currentPage - 1) * pageSize) + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * pageSize, filteredVhwRecords.length)}</span> of <span className="text-slate-900">{filteredVhwRecords.length}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === p 
                          ? 'bg-teal-400 text-slate-900 shadow-md shadow-teal-500/20' 
                          : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Summary Redirect */}
      <div className="card-professional p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Workforce Master Summary</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Access detailed national pivot tables and analytical summaries</p>
        </div>
        <button 
          onClick={() => navigate('/workforce-summary')}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          View Full Summary <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Table Section */}
    </div>
  );
};

export default VhwNationalDashboard;
