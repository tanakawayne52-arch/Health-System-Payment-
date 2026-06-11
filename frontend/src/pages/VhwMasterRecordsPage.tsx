import React, { useState, useEffect } from 'react';
import { useVhwMasterList } from '@/hooks/useData';
import { api } from '@/lib/api';
import { 
  Search, 
  X, 
  Download, 
  Phone, 
  Copy, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Filter,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Badge from '@/components/Badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';



const VhwMasterRecordsPage: React.FC = () => {
  const [vhwMasterList] = useVhwMasterList();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  // Role-based permissions
  const canEdit = user?.role === 'national_admin' || user?.role === 'provincial_admin' || user?.role === 'hr_manager';
  const canDelete = user?.role === 'national_admin';
  const canExport = user?.role === 'national_admin' || user?.role === 'national_finance';

  // State for filters
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState(user?.province && user.role !== 'national_admin' ? user.province : 'all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [provinceOptions, setProvinceOptions] = useState<string[]>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Derived data: Filtered records
  const filtered = vhwMasterList.filter(record => {
    const matchesSearch = !search || 
      `${record.firstName} ${record.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      record.idNumber.toLowerCase().includes(search.toLowerCase()) ||
      record.phoneNumber.toLowerCase().includes(search.toLowerCase());
    
    const matchesProvince = provinceFilter === 'all' || record.province === provinceFilter;
    const matchesPayment = paymentFilter === 'all' || record.paymentCategory === paymentFilter;
    const matchesQuality = qualityFilter === 'all' || record.dataQuality === qualityFilter;

    return matchesSearch && matchesProvince && matchesPayment && matchesQuality;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    api.getProvinces().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setProvinceOptions(res.data);
      }
    });
  }, []);

  const exportCSV = () => {
    const headers = ['Name', 'ID Number', 'Province', 'District', 'Health Centre', 'Phone', 'Payment', 'Quality'];
    const rows = filtered.map(r => [
      `${r.firstName} ${r.lastName}`,
      r.idNumber,
      r.province,
      r.district,
      r.healthCentre,
      r.phoneNumber,
      r.paymentCategory,
      r.dataQuality
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "vhw_master_records.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Export started', 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none text-uppercase">VHW Workforce Master Records</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">National database of all Village Health Workers across 10 provinces</p>
        </div>
        {canExport && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" /> Export Master List
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card-professional p-4 flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, national ID, or phone number..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {(!user?.province || user?.role === 'national_admin') && (
            <div className="w-48">
              <Select value={provinceFilter} onValueChange={(val) => { setProvinceFilter(val); setPage(1); }}>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-sm font-semibold text-slate-700 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <SelectValue placeholder="All Provinces" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinceOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="w-44">
            <Select value={paymentFilter} onValueChange={(val) => { setPaymentFilter(val); setPage(1); }}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-sm font-semibold text-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <SelectValue placeholder="Payment Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="Correct">Correct</SelectItem>
                <SelectItem value="No payment">No payment</SelectItem>
                <SelectItem value="Overpayment">Overpayment</SelectItem>
                <SelectItem value="Underpayment">Underpayment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={qualityFilter} onValueChange={(val) => { setQualityFilter(val); setPage(1); }}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-sm font-semibold text-slate-700 shadow-sm">
                <SelectValue placeholder="Data Quality" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-professional overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Village Health Worker</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identifiers</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment & Quality</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length > 0 ? paginated.map((record, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors shadow-sm">
                        {record.firstName[0]}{record.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">{record.firstName} {record.lastName}</p>
                        <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
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
                          onClick={() => { navigator.clipboard.writeText(record.idNumber); addToast('ID Copied', 'success'); }}
                          className="text-slate-400 hover:text-teal-500 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[150px]">{record.healthCentre}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-bold text-slate-700">{record.district}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{record.province}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                        record.paymentCategory === 'Correct' ? 'bg-green-100 text-green-700' :
                        (record.paymentCategory || '').includes('Over') ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {record.paymentCategory}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest w-fit border ${
                        record.dataQuality === 'Good' ? 'border-green-200 text-green-600 bg-green-50/30' :
                        record.dataQuality === 'Fair' ? 'border-amber-200 text-amber-600 bg-amber-50/30' :
                        'border-rose-200 text-rose-600 bg-rose-50/30'
                      }`}>
                        Quality: {record.dataQuality}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100" title="View Details">
                        <Info className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100" title="Edit Record">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100" title="Delete Record">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No records found matching your filters</p>
                      <button onClick={() => { setSearch(''); setProvinceFilter('all'); setPaymentFilter('all'); setQualityFilter('all'); }} className="text-teal-600 font-bold text-sm hover:underline">Clear all filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-semibold">
            Showing <span className="text-slate-900">{filtered.length > 0 ? ((page - 1) * pageSize) + 1 : 0}</span> to <span className="text-slate-900">{Math.min(page * pageSize, filtered.length)}</span> of <span className="text-slate-900">{filtered.length}</span> records
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1;
                // Simple pagination logic for demonstration
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === p 
                        ? 'bg-teal-400 text-slate-900 shadow-md shadow-teal-500/20' 
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setPage(totalPages)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === totalPages 
                      ? 'bg-teal-400 text-slate-900 shadow-md shadow-teal-500/20' 
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
              className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VhwMasterRecordsPage;
