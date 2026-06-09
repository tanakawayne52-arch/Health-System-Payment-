import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getBatches, getPaymentLists, saveBatches, getAuditLogs, saveAuditLogs } from '@/data/seed';
import Badge from '@/components/Badge';
import { PROVINCES } from '@/types';
import { Search, Plus, Eye, CheckCircle, PlayCircle, RefreshCw, Trash2, X, ChevronLeft, ChevronRight, ExternalLink, Info, Calendar, Users, DollarSign, FileText } from 'lucide-react';
import type { PaymentBatch } from '@/types';

export default function PaymentBatchesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const canManage = user?.role === 'finance_officer' || user?.role === 'national_admin';

  const [batches, setBatches] = useState<PaymentBatch[]>(getBatches());
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showExecute, setShowExecute] = useState<PaymentBatch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<PaymentBatch | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const pageSize = 15;

  const filtered = useMemo(() => {
    let data = [...batches];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(b => b.name.toLowerCase().includes(s) || b.id.toLowerCase().includes(s));
    }
    if (provinceFilter !== 'ALL') data = data.filter(b => b.province === provinceFilter);
    if (statusFilter !== 'ALL') data = data.filter(b => b.status === statusFilter);
    return data;
  }, [batches, search, provinceFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleValidate = (batch: PaymentBatch) => {
    const updated = batches.map(b => b.id === batch.id ? { ...b, status: 'validated' as const, validatedAt: new Date().toISOString(), validatedBy: user?.id || 'u3' } : b);
    setBatches(updated);
    saveBatches(updated);
    const logs = getAuditLogs();
     
    logs.unshift({
      id: `a${Date.now()}`, userId: user?.id || '', userName: user?.fullName || '', userRole: user?.role || '',
      action: 'VALIDATE', entityType: 'PaymentBatch', entityId: batch.id,
      oldValues: { status: batch.status }, newValues: { status: 'validated' },
      reason: null, ipAddress: '192.168.1.30', timestamp: new Date().toISOString(),
    });
    saveAuditLogs(logs);
    addToast('Batch validated successfully', 'success');
  };

  const handleExecute = (batch: PaymentBatch) => {
    setShowExecute(batch);
    setConfirmChecked(false);
  };

  const confirmExecute = () => {
    if (!showExecute) return;
    const updated = batches.map(b => b.id === showExecute.id ? { ...b, status: 'completed' as const, executedAt: new Date().toISOString(), executedBy: user?.id || 'u3' } : b);
    setBatches(updated);
    saveBatches(updated);
    const logs = getAuditLogs();
     
    logs.unshift({
      id: `a${Date.now()}`, userId: user?.id || '', userName: user?.fullName || '', userRole: user?.role || '',
      action: 'EXECUTE', entityType: 'PaymentBatch', entityId: showExecute.id,
      oldValues: { status: showExecute.status }, newValues: { status: 'completed' },
      reason: null, ipAddress: '192.168.1.30', timestamp: new Date().toISOString(),
    });
    saveAuditLogs(logs);
    addToast(`Payment batch executed: ${showExecute.totalBeneficiaries} beneficiaries processed`, 'success');
    setShowExecute(null);
  };

  const handleRetry = (batch: PaymentBatch) => {
    const updated = batches.map(b => b.id === batch.id ? { ...b, status: 'pending' as const, failureReason: null } : b);
    setBatches(updated);
    saveBatches(updated);
    addToast('Batch reset to pending for retry', 'success');
  };

  const handleDelete = (batch: PaymentBatch) => {
    if (!confirm('Delete this batch?')) return;
    const updated = batches.filter(b => b.id !== batch.id);
    setBatches(updated);
    saveBatches(updated);
    addToast('Batch deleted', 'warning');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Payment Batches</h1>
          <p className="text-sm text-[#475569] mt-0.5">Create and manage payment batches for execution</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Batch
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search batch..."
            className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md pl-9 pr-4 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"><X className="w-4 h-4" /></button>}
        </div>
        <select value={provinceFilter} onChange={e => { setProvinceFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
          <option value="ALL">All Provinces</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
          <option value="ALL">All Status</option>
          <option value="pending">Pending</option>
          <option value="validated">Validated</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Batch ID</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Name</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Province</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Beneficiaries</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Total Amount</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#94a3b8]"><p className="text-base font-semibold text-[#1e293b] mb-1">No batches found</p></td></tr>
              ) : (
                paginated.map(batch => (
                    <tr key={batch.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <span className="text-sm text-[#1e293b] font-mono cursor-pointer hover:text-[#0d9488] underline decoration-dotted">{batch.id}</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            Click to view batch details
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <span className="text-sm text-[#1e293b] font-medium cursor-pointer hover:text-[#0d9488]">{batch.name}</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            Batch name and quarter
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{batch.province}</td>
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <div className="flex items-center gap-1 text-sm text-[#1e293b]">
                            <Users className="w-3 h-3 text-[#0d9488]" />
                            {batch.totalBeneficiaries.toLocaleString()}
                          </div>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            Total beneficiaries in batch
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <div className="flex items-center gap-1 text-sm text-[#1e293b] font-medium">
                            <DollarSign className="w-3 h-3 text-[#0d9488]" />
                            ${batch.totalAmount.toLocaleString()}
                          </div>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            Total payment amount (USD)
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status={batch.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewingBatch(batch)} className="p-1.5 text-[#475569] hover:text-[#0d9488] hover:bg-[#f1f5f9] rounded transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        {canManage && batch.status === 'pending' && (
                          <button onClick={() => handleValidate(batch)} className="p-1.5 text-[#475569] hover:text-[#16a34a] hover:bg-[#f1f5f9] rounded transition-colors" title="Validate"><CheckCircle className="w-3.5 h-3.5" /></button>
                        )}
                        {canManage && batch.status === 'validated' && (
                          <button onClick={() => handleExecute(batch)} className="p-1.5 text-[#0d9488] hover:text-[#0f766e] hover:bg-[#f1f5f9] rounded transition-colors" title="Execute"><PlayCircle className="w-3.5 h-3.5" /></button>
                        )}
                        {canManage && batch.status === 'failed' && (
                          <button onClick={() => handleRetry(batch)} className="p-1.5 text-[#475569] hover:text-[#d97706] hover:bg-[#f1f5f9] rounded transition-colors" title="Retry"><RefreshCw className="w-3.5 h-3.5" /></button>
                        )}
                        {canManage && (
                          <button onClick={() => handleDelete(batch)} className="p-1.5 text-[#475569] hover:text-[#dc2626] hover:bg-[#f1f5f9] rounded transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0]">
          <p className="text-xs text-[#475569]">Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-[#475569] px-2">Page {page} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreate && (
        <CreateBatchModal
          onClose={() => setShowCreate(false)}
          onCreate={(batch) => {
            setBatches(prev => [batch, ...prev]);
            saveBatches([batch, ...batches]);
            addToast('Payment batch created successfully', 'success');
            setShowCreate(false);
          }}
        />
      )}

      {/* Execute Batch Modal */}
      {showExecute && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowExecute(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-[480px] w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Execute Payment Batch</h3>
            <div className="bg-[#f8fafc] rounded-lg p-4 mb-4 space-y-2">
              <p className="text-sm"><strong>Batch:</strong> {showExecute.name}</p>
              <p className="text-sm"><strong>Beneficiaries:</strong> {showExecute.totalBeneficiaries.toLocaleString()}</p>
              <p className="text-sm"><strong>Total Amount:</strong> ${showExecute.totalAmount.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-[rgba(22,163,74,0.1)] rounded-md mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
              <span className="text-sm text-[#16a34a] font-medium">EcoCash API Ready</span>
            </div>
            <p className="text-sm text-[#475569] mb-4">This action is irreversible. Once executed, payment instructions will be sent to EcoCash for processing.</p>
            <label className="flex items-start gap-2 mb-5 cursor-pointer">
              <input type="checkbox" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-[#e2e8f0] text-[#0d9488] focus:ring-[#0d9488]" />
              <span className="text-sm text-[#1e293b]">I confirm this batch has been validated and is ready for execution</span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowExecute(null)} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">Cancel</button>
              <button onClick={confirmExecute} disabled={!confirmChecked} className="px-4 py-2 bg-[#0d9488] text-white text-sm rounded-md hover:bg-[#0f766e] active:scale-[0.98] transition-all disabled:opacity-50">
                Execute Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Batch Modal */}
      {viewingBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewingBatch(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-[600px] w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1e293b]">Payment Batch Details</h3>
              <button onClick={() => setViewingBatch(null)} className="p-1 text-[#94a3b8] hover:text-[#475569]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="bg-[#f8fafc] rounded-lg p-4 border-l-4 border-[#0d9488]">
                <p className="text-xs text-[#475569] mb-1">Batch ID</p>
                <p className="text-sm font-mono text-[#1e293b] flex items-center gap-2">
                  {viewingBatch.id}
                  <button onClick={() => { navigator.clipboard.writeText(viewingBatch.id); addToast('ID copied to clipboard', 'success'); }} className="text-[#94a3b8] hover:text-[#0d9488]">
                    <Info className="w-4 h-4" />
                  </button>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Status</p>
                  <Badge status={viewingBatch.status} />
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Name</p>
                  <p className="text-sm font-medium text-[#1e293b]">{viewingBatch.name}</p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Province</p>
                  <p className="text-sm text-[#1e293b]">{viewingBatch.province}</p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Cycle ID</p>
                  <p className="text-sm text-[#1e293b] font-mono">{viewingBatch.cycleId}</p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Beneficiaries</p>
                  <p className="text-sm text-[#1e293b] flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#0d9488]" />
                    {viewingBatch.totalBeneficiaries.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Total Amount</p>
                  <p className="text-sm font-medium text-[#0d9488] flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${viewingBatch.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              {viewingBatch.validatedAt && (
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Validated At</p>
                  <p className="text-sm text-[#1e293b] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#0d9488]" />
                    {new Date(viewingBatch.validatedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {viewingBatch.executedAt && (
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Executed At</p>
                  <p className="text-sm text-[#1e293b] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#0d9488]" />
                    {new Date(viewingBatch.executedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {viewingBatch.validatedBy && (
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Validated By</p>
                  <p className="text-sm text-[#1e293b]">{viewingBatch.validatedBy}</p>
                </div>
              )}
              {viewingBatch.executedBy && (
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Executed By</p>
                  <p className="text-sm text-[#1e293b]">{viewingBatch.executedBy}</p>
                </div>
              )}
              {viewingBatch.failureReason && (
                <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
                  <p className="text-xs text-red-700 mb-1">Failure Reason</p>
                  <p className="text-sm text-red-900">{viewingBatch.failureReason}</p>
                </div>
              )}
              <div className="bg-[#f8fafc] rounded-lg p-3">
                <p className="text-xs text-[#475569] mb-2">Related Payment Lists</p>
                {getPaymentLists().filter(l => l.cycleId === viewingBatch.cycleId && l.province === viewingBatch.province).length > 0 ? (
                  <div className="space-y-2">
                    {getPaymentLists().filter(l => l.cycleId === viewingBatch.cycleId && l.province === viewingBatch.province).map(list => (
                      <button key={list.id} onClick={() => { setViewingBatch(null); navigate('/payment-lists'); }} className="w-full text-left text-sm text-[#0d9488] hover:underline flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {list.name}
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#94a3b8]">No related payment lists found</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setViewingBatch(null)} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateBatchModal({ onClose, onCreate }: { onClose: () => void; onCreate: (batch: PaymentBatch) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [province, setProvince] = useState('BULAWAYO');
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const certifiedLists = getPaymentLists().filter(l => l.status === 'certified');
  const provinceLists = certifiedLists.filter(l => l.province === province);

  const totalBens = provinceLists.filter(l => selectedLists.includes(l.id)).reduce((s, l) => s + l.beneficiaryCount, 0);

  const handleCreate = () => {
     
    const batch: PaymentBatch = {
      id: `batch${Date.now()}`,
      cycleId: 'c6',
      name: name || `${province} - Q2 2026`,
      province,
      district: null,
      status: 'pending',
      totalBeneficiaries: totalBens,
      totalAmount: totalBens * 100,
      validatedBy: null,
      validatedAt: null,
      executedBy: null,
      executedAt: null,
      failureReason: null,
      createdBy: user?.id || 'u3',
      createdAt: new Date().toISOString(),
    };
    onCreate(batch);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-[560px] w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Create Payment Batch</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Batch Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Auto-generated if left blank"
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Province</label>
            <select value={province} onChange={e => { setProvince(e.target.value); setSelectedLists([]); }}
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Select Certified Lists</label>
            <div className="border border-[#e2e8f0] rounded-md max-h-[200px] overflow-y-auto">
              {provinceLists.length === 0 ? (
                <p className="text-sm text-[#94a3b8] p-4 text-center">No certified lists for {province}</p>
              ) : (
                provinceLists.map(list => (
                  <label key={list.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] cursor-pointer">
                    <input type="checkbox" checked={selectedLists.includes(list.id)} onChange={e => {
                      setSelectedLists(prev => e.target.checked ? [...prev, list.id] : prev.filter(x => x !== list.id));
                    }} className="w-4 h-4 rounded border-[#e2e8f0] text-[#0d9488] focus:ring-[#0d9488]" />
                    <div className="flex-1">
                      <p className="text-sm text-[#1e293b]">{list.name}</p>
                      <p className="text-xs text-[#475569]">{list.beneficiaryCount.toLocaleString()} beneficiaries | ${list.totalAmount.toLocaleString()}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="bg-[#f8fafc] rounded-md p-4">
            <p className="text-sm text-[#475569]">Total Beneficiaries: <strong className="text-[#1e293b]">{totalBens.toLocaleString()}</strong></p>
            <p className="text-sm text-[#475569]">Total Amount: <strong className="text-[#0d9488]">${(totalBens * 100).toLocaleString()}</strong></p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={selectedLists.length === 0} className="px-4 py-2 bg-[#0d9488] text-white text-sm rounded-md hover:bg-[#0f766e] active:scale-[0.98] transition-all disabled:opacity-50">
            Create Batch
          </button>
        </div>
      </div>
    </div>
  );
}
