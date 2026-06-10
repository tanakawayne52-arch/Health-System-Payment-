import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import Badge from '@/components/Badge';
import { PROVINCES, DISTRICTS } from '@/types';
import { Search, Download, Plus, Pencil, X, ChevronLeft, ChevronRight, Upload, Users as UsersIcon, Info, Calendar, MapPin, Phone, Copy } from 'lucide-react';
import type { Beneficiary, BeneficiaryStatus } from '@/types';
import { generateId } from '@/lib/id';

export default function BeneficiariesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const canEdit = user?.role === 'hr_custodian' || user?.role === 'national_admin';

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingBen, setEditingBen] = useState<Beneficiary | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const pageSize = 15;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBeneficiaries({
        search: search || undefined,
        province: provinceFilter !== 'ALL' ? provinceFilter : undefined,
        district: districtFilter !== 'ALL' ? districtFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: pageSize,
      });
      if (res.success && res.data) {
        // Backend returns snake_case for some fields, map them
        const mapped = res.data.map((b: any) => ({
          ...b,
          fullName: b.full_name || b.fullName,
          nationalId: b.national_id || b.nationalId,
          ecocashNumber: b.ecocash_number || b.ecocashNumber,
          dateJoined: b.date_joined || b.dateJoined,
        })) as Beneficiary[];
        setBeneficiaries(mapped);
        setTotalRecords(res.pagination?.total || 0);
      }
    } catch (e) {
      addToast('Failed to load beneficiaries', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, provinceFilter, districtFilter, statusFilter, page, user]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginated = beneficiaries;

  const availableDistricts = provinceFilter !== 'ALL' ? (DISTRICTS[provinceFilter] || []) : [];

  const handleSave = async (formData: Partial<Beneficiary>) => {
    try {
      if (editingBen) {
        const res = await api.updateBeneficiary(editingBen.id, formData as any);
        if (res.success) {
          addToast('Beneficiary updated successfully', 'success');
          loadData();
          setShowDrawer(false);
          setEditingBen(null);
        } else {
          addToast(res.message || 'Update failed', 'error');
        }
      } else {
        const res = await api.createBeneficiary(formData as any);
        if (res.success) {
          addToast('Beneficiary added successfully', 'success');
          loadData();
          setShowDrawer(false);
          setEditingBen(null);
        } else {
          addToast(res.message || 'Creation failed', 'error');
        }
      }
    } catch (e) {
      addToast('Error saving beneficiary', 'error');
    }
  };

  const handleStatusChange = async (ben: Beneficiary, newStatus: BeneficiaryStatus) => {
    const reason = prompt(`Please provide a reason for changing status to ${newStatus}:`);
    if (reason === null) return; // Cancelled
    if (!reason && newStatus === 'exited') {
      addToast('Reason is required for exiting a beneficiary', 'error');
      return;
    }

    try {
      if (newStatus === 'exited') {
        const res = await api.exitBeneficiary(ben.id, new Date().toISOString().split('T')[0], reason || 'System update');
        if (res.success) {
          addToast(`Beneficiary exited`, 'success');
          loadData();
        } else {
          addToast(res.message || 'Update failed', 'error');
        }
      } else {
        const res = await api.updateBeneficiary(ben.id, { 
          status: newStatus,
          reason: reason || `Status changed to ${newStatus}`
        } as any);
        if (res.success) {
          addToast(`Status changed to ${newStatus}`, 'success');
          loadData();
        } else {
          addToast(res.message || 'Update failed', 'error');
        }
      }
    } catch (e) {
      addToast('Error updating status', 'error');
    }
  };

  const exportCSV = async () => {
    try {
      const blob = await api.exportBeneficiariesExcel(
        provinceFilter !== 'ALL' ? provinceFilter : undefined,
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'beneficiaries.csv';
      a.click();
      addToast('Export downloaded', 'success');
    } catch (e) {
      addToast('Export failed', 'error');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const res = await api.importBeneficiaries(importFile);
      if (res.success) {
        addToast(`Successfully imported ${res.data?.imported} and updated ${res.data?.updated} records`, 'success');
        if (res.data?.errors && res.data.errors.length > 0) {
          console.error('Import errors:', res.data.errors);
          addToast(`${res.data.errors.length} records had errors. Check console.`, 'warning');
        }
        setShowImport(false);
        setImportFile(null);
        loadData();
      } else {
        addToast(res.message || 'Import failed', 'error');
      }
    } catch (e) {
      addToast('Error during import', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Beneficiary Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Manage and monitor Village Health Worker records</p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <>
              <button
                onClick={() => { setEditingBen(null); setShowDrawer(true); }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#2dd4bf] text-[#0f172a] rounded-2xl text-sm font-bold shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Add New VHW
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-professional p-4 flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, ID, or phone..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {(user?.role !== 'provincial_officer') && (
            <select
              value={provinceFilter}
              onChange={e => { setProvinceFilter(e.target.value); setDistrictFilter('ALL'); setPage(1); }}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer"
            >
              <option value="ALL">All Provinces</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}

          <select
            value={districtFilter}
            onChange={e => { setDistrictFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer"
          >
            <option value="ALL">All Districts</option>
            {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="exited">Exited</option>
          </select>

          <button
            onClick={exportCSV}
            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
            title="Download CSV"
          >
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-professional overflow-hidden bg-white relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-600">Loading VHW records...</p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Village Health Worker</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identifiers</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((ben) => (
                <tr key={ben.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        {ben.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">{ben.fullName}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {ben.ecocashNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{ben.nationalId}</span>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(ben.nationalId); addToast('ID Copied', 'success'); }}
                          className="text-slate-400 hover:text-teal-500 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ben.facility}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-bold text-slate-700">{ben.district}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{ben.province} · {ben.village}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <Badge status={ben.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingBen(ben); setShowDrawer(true); }}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                        title="Edit Details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="View Full History"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-semibold">
            Showing <span className="text-slate-900">{((page - 1) * pageSize) + 1}</span> to <span className="text-slate-900">{Math.min(page * pageSize, totalRecords)}</span> of <span className="text-slate-900">{totalRecords}</span> records
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
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === p 
                        ? 'bg-[#2dd4bf] text-[#0f172a] shadow-md shadow-teal-500/20' 
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowDrawer(false); setEditingBen(null); }} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-semibold text-[#1e293b]">{editingBen ? 'Edit VHW' : 'Add New VHW'}</h3>
              <button onClick={() => { setShowDrawer(false); setEditingBen(null); }} className="p-1 text-[#94a3b8] hover:text-[#475569]">
                <X className="w-5 h-5" />
              </button>
            </div>
            {editingBen && (
              <div className="p-5 bg-[#f8fafc] border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#0d9488]" />
                  <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Beneficiary ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[#1e293b]">{editingBen.id}</span>
                  <button onClick={() => { navigator.clipboard.writeText(editingBen.id); addToast('ID copied to clipboard', 'success'); }} className="text-[#94a3b8] hover:text-[#0d9488]">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#475569]">
                  <Calendar className="w-3 h-3" />
                  <span>Joined: {editingBen.dateJoined}</span>
                </div>
              </div>
            )}
            <BeneficiaryForm
              initial={editingBen}
              onSave={handleSave}
              onCancel={() => { setShowDrawer(false); setEditingBen(null); }}
            />
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !importing && setShowImport(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-[500px] w-full mx-4 p-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-teal-500" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Bulk Import VHWs</h3>
              <button 
                onClick={() => setShowImport(false)}
                disabled={importing}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${
                  importFile ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50'
                }`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload"
                  type="file" 
                  accept=".csv,.xlsx" 
                  className="hidden" 
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                
                {importFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                      <ClipboardList className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-teal-700 mb-1">{importFile.name}</p>
                    <p className="text-xs text-teal-600">{(importFile.size / 1024).toFixed(1)} KB • Ready to upload</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                      className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">Click to browse or drag and drop</p>
                    <p className="text-xs text-slate-400">Supported formats: CSV, XLSX</p>
                  </>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-1">Important Instructions</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Please ensure your file includes these columns: <strong>Full Name, National ID, EcoCash Number, Province, District</strong>. 
                      Existing records will be updated based on National ID.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowImport(false)}
                  disabled={importing}
                  className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-[2] px-6 py-3.5 bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing Records...
                    </>
                  ) : (
                    <>Start Import</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BeneficiaryForm({ initial, onSave, onCancel }: { initial: Beneficiary | null; onSave: (d: Partial<Beneficiary>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    fullName: initial?.fullName || '',
    nationalId: initial?.nationalId || '',
    ecocashNumber: initial?.ecocashNumber || '',
    province: initial?.province || 'BULAWAYO',
    district: initial?.district || '',
    ward: initial?.ward || '',
    village: initial?.village || '',
    facility: initial?.facility || '',
    status: initial?.status || 'active' as BeneficiaryStatus,
    dateJoined: initial?.dateJoined || new Date().toISOString().split('T')[0],
  });

  const districts = DISTRICTS[form.province] || [];

  const isValid = form.fullName && form.nationalId && form.ecocashNumber && form.province && form.district;

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Full Name *</label>
          <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">National ID *</label>
          <input value={form.nationalId} onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">EcoCash Number *</label>
          <input value={form.ecocashNumber} onChange={e => setForm(f => ({ ...f, ecocashNumber: e.target.value }))} placeholder="077XXXXXXX" className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Province *</label>
          <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value, district: '' }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">District *</label>
          <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
            <option value="">Select District</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Ward</label>
          <input value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Village</label>
          <input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Facility</label>
          <input value={form.facility} onChange={e => setForm(f => ({ ...f, facility: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as BeneficiaryStatus }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="exited">Exited</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Date Joined</label>
          <input type="date" value={form.dateJoined} onChange={e => setForm(f => ({ ...f, dateJoined: e.target.value }))} className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">Cancel</button>
        <button
          onClick={() => onSave(form)}
          disabled={!isValid}
          className="px-4 py-2 bg-[#0d9488] text-white text-sm rounded-md hover:bg-[#0f766e] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initial ? 'Update VHW' : 'Save VHW'}
        </button>
      </div>
    </div>
  );
}
