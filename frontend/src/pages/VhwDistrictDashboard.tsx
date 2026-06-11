import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useVhwMasterList } from '../hooks/useData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import PieChartComponent from '../components/PieChartComponent';
import PivotTables from '../components/PivotTables';
import { canonicalizeProvince } from '@/utils/province';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, GitCompare, BarChart3, Users, MapPin, CheckCircle, Info, Phone, Search, X, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import Badge from '../components/Badge';

const COLORS = ['#2dd4bf', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const VhwDistrictDashboard: React.FC = () => {
  const { isNationalLevel, user } = useAuth();
  const navigate = useNavigate();
  const [vhwMasterList] = useVhwMasterList();
  
  // Get all unique provinces and districts
  const allProvinces = Array.from(new Set(vhwMasterList.map(r => canonicalizeProvince(r.province)).filter(Boolean))) as string[];
  const allDistricts = [...new Set(vhwMasterList.map(record => record.district))].filter(d => d);
  
  // State for filters
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  
  // Derived data: districts available for selected province
  const districtsForSelectedProvince = selectedProvince === 'all'
    ? allDistricts
    : [...new Set(vhwMasterList.filter(record => canonicalizeProvince(record.province) === selectedProvince).map(record => record.district))].filter(d => d);
  
  // When district changes, if it's not 'all' and not in the current province's districts, auto-select the correct province!
  useEffect(() => {
    if (selectedDistrict !== 'all') {
      const recordForDistrict = vhwMasterList.find(record => record.district === selectedDistrict);
      if (recordForDistrict && recordForDistrict.province !== selectedProvince) {
        setSelectedProvince(recordForDistrict.province);
      }
    }
  }, [selectedDistrict, vhwMasterList]);
  
  // Filter records based on selections
  const filteredRecords = vhwMasterList.filter(record => {
    const recordProv = canonicalizeProvince(record.province);
    const matchesProvince = selectedProvince === 'all' || (recordProv && recordProv === selectedProvince);
    const matchesDistrict = selectedDistrict === 'all' || (record.district && record.district === selectedDistrict);
    return matchesProvince && matchesDistrict;
  });
  
  // Calculate stats
  const districtStats = [
    { label: 'Total VHWs', value: filteredRecords.length, icon: Users, color: 'teal' },
    { 
      label: 'Health Centres', 
      value: [...new Set(filteredRecords.map(r => r.healthCentre).filter(hc => hc))].length, 
      icon: MapPin, 
      color: 'blue'
    },
    { 
      label: 'Verified Payments',
      value: filteredRecords.filter(r => r.paymentCategory === 'Correct').length,
      icon: CheckCircle, 
      color: 'green'
    },
    { 
      label: 'Pending Review',
      value: filteredRecords.filter(r => r.paymentCategory && r.paymentCategory.includes('Over')).length,
      icon: Info, 
      color: 'amber'
    },
  ];
  
  // Payment category distribution for pie chart
  const paymentCategoryCounts = filteredRecords.reduce((acc, record) => {
    acc[record.paymentCategory] = (acc[record.paymentCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const paymentCategoryData = Object.entries(paymentCategoryCounts)
    .map(([category, count], index) => ({
      name: category,
      value: count,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
    
  // District counts for bar chart
  const districtCounts: Array<{ name: string; count: number }> = [];
  const allDistrictCounts = allDistricts.reduce((acc, district) => {
    acc[district] = vhwMasterList.filter(r => r.district === district).length;
    return acc;
  }, {} as Record<string, number>);
  
  if (selectedProvince === 'all') {
    // When all provinces selected, show top 10 districts by VHW count
    Object.entries(allDistrictCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([name, count]) => districtCounts.push({ name, count }));
  } else {
    const distCounts = districtsForSelectedProvince.reduce((acc, district) => {
      acc[district] = filteredRecords.filter(r => r.district === district).length;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(distCounts).forEach(([name, count]) => districtCounts.push({ name, count }));
  }
  
  // if (!isNationalLevel) {
  //   return <Navigate to="/" replace />;
  // }
  
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">District Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Detailed view of Village Health Workers by district</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card-professional p-6 bg-white flex flex-wrap items-center gap-4">
        <div className="max-w-[240px] w-full">
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-11 text-sm font-semibold text-slate-700 shadow-sm focus:ring-teal-500/10">
              <SelectValue placeholder="All Provinces" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              <SelectItem value="all">All Provinces</SelectItem>
              {allProvinces.map((p, i) => <SelectItem key={i} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="max-w-[240px] w-full">
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-11 text-sm font-semibold text-slate-700 shadow-sm focus:ring-teal-500/10">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              <SelectItem value="all">All Districts</SelectItem>
              {districtsForSelectedProvince.map((d, i) => <SelectItem key={i} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {districtStats.map((stat, index) => (
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
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Payment Category Distribution</h3>
          <PieChartComponent
            data={paymentCategoryData}
            height={350}
            showLegend={true}
          />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-6">
            {selectedProvince === 'all' ? 'Top 10 Districts by VHW Count' : `VHWs per District in ${selectedProvince}`}
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="count" 
                  name="VHWs" 
                  fill="#0d9488" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Workforce Master Summary Button */}
      <div className="card-professional p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Workforce Master Summary</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Access detailed pivot tables and analytical summaries</p>
        </div>
        <button 
          onClick={() => navigate('/workforce-summary')}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          View Full Summary <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Records Table */}
      <div className="card-professional overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Village Health Worker</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identifiers</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.slice(0, 20).map((record, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        {(record.firstName || '')[0]}{(record.lastName || '')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">{record.firstName} {record.lastName}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {record.phoneNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{record.idNumber || 'N/A'}</span>
                        {record.idNumber && (
                          <button 
                            onClick={() => { navigator.clipboard.writeText(record.idNumber); }}
                            className="text-slate-400 hover:text-teal-500 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{record.healthCentre || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-bold text-slate-700">{record.district || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{record.province || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      record.paymentCategory === 'Correct' ? 'bg-green-100 text-green-700' :
                      (record.paymentCategory || '').includes('Over') ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {record.paymentCategory || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pivot Tables */}
      <div className="mt-8">
        <PivotTables data={filteredRecords} />
      </div>
    </div>
  );
};

export default VhwDistrictDashboard;
