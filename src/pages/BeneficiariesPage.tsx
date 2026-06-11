import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getBeneficiaries, saveBeneficiaries, getAuditLogs, saveAuditLogs } from '@/data/seed';
import Badge from '@/components/Badge';
import { PROVINCES, DISTRICTS } from '@/types';
import { Search, Download, Plus, Pencil, X, ChevronLeft, ChevronRight, Upload, Users as UsersIcon } from 'lucide-react';
import type { Beneficiary, BeneficiaryStatus } from '@/types';

export default function BeneficiariesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const canEdit = user?.role === 'hr_custodian' || user?.role === 'national_admin';

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(getBeneficiaries());
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingBen, setEditingBen] = useState<Beneficiary | null>(null);
  const [showImport, setShowImport] = useState(false);

  const pageSize = 20;

  const filtered = useMemo(() => {
    let data = [...beneficiaries];
    if (user?.role === 'provincial_officer' && user.province) {
      data = data.filter(b => b.province === user.province);
    }
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(b =>
        b.fullName.toLowerCase().includes(s) ||
        b.nationalId.toLowerCase().includes(s) ||
        b.ecocashNumber.includes(s)
      );
    }
    if (provinceFilter !== 'ALL') data = data.filter(b => b.province === provinceFilter);
    if (districtFilter !== 'ALL') data = data.filter(b => b.district === districtFilter);
    if (statusFilter !== 'ALL') data = data.filter(b => b.status === statusFilter);
    return data;
  }, [beneficiaries, search, provinceFilter, districtFilter, statusFilter, user]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const availableDistricts = provinceFilter !== 'ALL' ? (DISTRICTS[provinceFilter] || []) : [];

  const handleSave = (formData: Partial<Beneficiary>) => {
    const logs = getAuditLogs();
    if (editingBen) {
      const updated = beneficiaries.map(b => b.id === editingBen.id ? { ...b, ...formData, updatedAt: new Date().toISOString() } as Beneficiary : b);
      setBeneficiaries(updated);
      saveBeneficiaries(updated);
      logs.unshift({
        id: `a${Date.now()}`, userId: user?.id || '', userName: user?.fullName || '', userRole: user?.role || '',
        action: 'EDIT', entityType: 'Beneficiary', entityId: editingBen.id,
        oldValues: { status: editingBen.status }, newValues: formData,
        reason: null, ipAddress: '192.168.1.10', timestamp: new Date().toISOString(),
      });
      addToast('Beneficiary updated successfully', 'success');
    } else {
      const newBen: Beneficiary = {
        id: `b${Date.now()}`, fullName: formData.fullName || '', nationalId: formData.nationalId || '',
        ecocashNumber: formData.ecocashNumber || '', province: formData.province || 'BULAWAYO',
        district: formData.district || '', ward: formData.ward || '', village: formData.village || '',
        facility: formData.facility || '', status: (formData.status as BeneficiaryStatus) || 'active',
        exitDate: null, exitReason: null, dateJoined: formData.dateJoined || new Date().toISOString().split('T')[0],
        createdBy: user?.id || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      const updated = [newBen, ...beneficiaries];
      setBeneficiaries(updated);
      saveBeneficiaries(updated);
      logs.unshift({
        id: `a${Date.now()}`, userId: user?.id || '', userName: user?.fullName || '', userRole: user?.role || '',
        action: 'ADD', entityType: 'Beneficiary', entityId: newBen.id,
        oldValues: null, newValues: { fullName: newBen.fullName },
        reason: null, ipAddress: '192.168.1.10', timestamp: new Date().toISOString(),
      });
      addToast('Beneficiary added successfully', 'success');
    }
    saveAuditLogs(logs);
    setShowDrawer(false);
    setEditingBen(null);
  };

  const handleStatusChange = (ben: Beneficiary, newStatus: BeneficiaryStatus) => {
    const updated = beneficiaries.map(b => b.id === ben.id ? { ...b, status: newStatus, updatedAt: new Date().toISOString() } : b);
    setBeneficiaries(updated);
    saveBeneficiaries(updated);
    const logs = getAuditLogs();
    logs.unshift({
      id: `a${Date.now()}`, userId: user?.id || '', userName: user?.fullName || '', userRole: user?.role || '',
      action: 'EDIT', entityType: 'Beneficiary', entityId: ben.id,
      oldValues: { status: ben.status }, newValues: { status: newStatus },
      reason: null, ipAddress: '192.168.1.10', timestamp: new Date().toISOString(),
    });
    saveAuditLogs(logs);
    addToast(`Status changed to ${newStatus}`, 'success');
  };

  const exportCSV = () => {
    const headers = ['Full Name', 'National ID', 'EcoCash Number', 'Province', 'District', 'Village', 'Facility', 'Status'];
    const rows = filtered.map(b => [b.fullName, b.nationalId, b.ecocashNumber, b.province, b.district, b.village, b.facility, b.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beneficiaries.csv';
    a.click();
    addToast('Export started', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Beneficiary Management</h1>
          <p className="text-sm text-[#475569] mt-0.5">Manage Village Health Worker records</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => { setEditingBen(null); setShowDrawer(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Add New VHW
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-md text-sm font-medium hover:bg-[#f1f5f9] transition-all"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, ID, or phone..."
            className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md pl-9 pr-4 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {(user?.role !== 'provincial_officer') && (
          <select
            value={provinceFilter}
            onChange={e => { setProvinceFilter(e.target.value); setDistrictFilter('ALL'); setPage(1); }}
            className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
          >
            <option value="ALL">All Provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        <select
          value={districtFilter}
          onChange={e => { setDistrictFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
        >
          <option value="ALL">All Districts</option>
          {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="exited">Exited</option>
        </select>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-md text-sm hover:bg-[#f1f5f9] transition-all"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Full Name</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">National ID</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">EcoCash</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Province</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">District</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Village</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                {canEdit && <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="text-center py-12 text-[#94a3b8]">
                    <UsersIcon className="w-12 h-12 mx-auto mb-3 text-[#e2e8f0]" />
                    <p className="text-base font-semibold text-[#1e293b] mb-1">No beneficiaries found</p>
                    <p className="text-sm">Try adjusting your filters or add a new beneficiary</p>
                  </td>
                </tr>
              ) : (
                paginated.map(ben => (
                  <tr key={ben.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                    <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{ben.fullName}</td>
                    <td className="px-4 py-3 text-sm text-[#475569] font-mono">{ben.nationalId}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{ben.ecocashNumber}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{ben.province}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{ben.district}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{ben.village}</td>
                    <td className="px-4 py-3"><Badge status={ben.status} /></td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingBen(ben); setShowDrawer(true); }}
                            className="p-1.5 text-[#475569] hover:text-[#0d9488] hover:bg-[#f1f5f9] rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <select
                            value={ben.status}
                            onChange={e => handleStatusChange(ben, e.target.value as BeneficiaryStatus)}
                            className="text-xs bg-[#f1f5f9] border border-[#e2e8f0] rounded px-2 py-1 focus:border-[#0d9488] focus:outline-none"
                          >
                            <option value="active">Set Active</option>
                            <option value="inactive">Set Inactive</option>
                            <option value="exited">Set Exited</option>
                          </select>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0]">
          <p className="text-xs text-[#475569]">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${page === p ? 'bg-[#0d9488] text-white' : 'text-[#475569] hover:bg-[#f1f5f9]'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
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
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowImport(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-[500px] w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Bulk Import Beneficiaries</h3>
            <div className="border-2 border-dashed border-[#e2e8f0] rounded-lg p-8 text-center hover:border-[#0d9488] transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
              <p className="text-sm text-[#475569] mb-1">Drag and drop your CSV or Excel file here</p>
              <p className="text-xs text-[#94a3b8]">or click to browse files</p>
            </div>
            <div className="mt-4 p-3 bg-[#f1f5f9] rounded-md">
              <p className="text-xs font-medium text-[#475569] mb-1">Expected columns:</p>
              <p className="text-xs text-[#94a3b8]">Full Name, National ID, EcoCash Number, Province, District, Ward, Village, Facility, Status</p>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">Cancel</button>
              <button onClick={() => { setShowImport(false); addToast('Import feature - please select a file', 'warning'); }} className="px-4 py-2 bg-[#0d9488] text-white text-sm rounded-md hover:bg-[#0f766e] transition-colors">Browse Files</button>
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
