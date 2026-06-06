import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getPaymentLists, getCycles, savePaymentLists, getAuditLogs, saveAuditLogs } from '@/data/seed';
import Badge from '@/components/Badge';
import { Search, Plus, Eye, Pencil, Send, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaymentListsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const canCreate = user?.role === 'provincial_officer';
  const province = user?.province;

  const [lists, setLists] = useState(getPaymentLists());
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [viewingList, setViewingList] = useState<typeof lists[0] | null>(null);
  const pageSize = 15;

  const cycles = getCycles();

  const filtered = useMemo(() => {
    let data = [...lists];
    if (user?.role === 'provincial_officer' && province) {
      data = data.filter(l => l.province === province);
    }
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(l => l.name.toLowerCase().includes(s));
    }
    if (cycleFilter !== 'ALL') data = data.filter(l => l.cycleId === cycleFilter);
    if (statusFilter !== 'ALL') data = data.filter(l => l.status === statusFilter);
    return data;
  }, [lists, search, cycleFilter, statusFilter, user, province]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSubmit = (list: typeof lists[0]) => {
    const updated = lists.map(l => l.id === list.id ? { ...l, status: 'submitted' as const, submittedAt: new Date().toISOString() } : l);
    setLists(updated);
    savePaymentLists(updated);
    const logs = getAuditLogs();
    logs.unshift({
      id: `a${Date.now()}`, userId: user?.id || '', userName: user?.fullName || '', userRole: user?.role || '',
      action: 'SUBMIT', entityType: 'PaymentList', entityId: list.id,
      oldValues: { status: list.status }, newValues: { status: 'submitted' },
      reason: null, ipAddress: '192.168.1.20', timestamp: new Date().toISOString(),
    });
    saveAuditLogs(logs);
    addToast('Payment list submitted for certification', 'success');
  };

  const handleDelete = (list: typeof lists[0]) => {
    if (!confirm('Delete this draft list?')) return;
    const updated = lists.filter(l => l.id !== list.id);
    setLists(updated);
    savePaymentLists(updated);
    addToast('Payment list deleted', 'warning');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Payment Lists</h1>
          <p className="text-sm text-[#475569] mt-0.5">Manage and submit payment lists{province ? ` for ${province}` : ''}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/payment-lists/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Create New List
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search list name..."
            className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md pl-9 pr-4 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={cycleFilter}
          onChange={e => { setCycleFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
        >
          <option value="ALL">All Cycles</option>
          {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="certified">Certified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">List Name</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Cycle</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Province</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Beneficiaries</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Amount</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#94a3b8]">
                    <p className="text-base font-semibold text-[#1e293b] mb-1">No payment lists found</p>
                    <p className="text-sm">Create a new list to get started</p>
                  </td>
                </tr>
              ) : (
                paginated.map(list => {
                  const cycle = cycles.find(c => c.id === list.cycleId);
                  return (
                    <tr key={list.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{list.name}</td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{cycle?.name || list.cycleId}</td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{list.province}</td>
                      <td className="px-4 py-3 text-sm text-[#1e293b]">{list.beneficiaryCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#1e293b]">${list.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge status={list.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewingList(list)} className="p-1.5 text-[#475569] hover:text-[#0d9488] hover:bg-[#f1f5f9] rounded transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {list.status === 'draft' && canCreate && (
                            <>
                              <button onClick={() => navigate(`/payment-lists/new?edit=${list.id}`)} className="p-1.5 text-[#475569] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded transition-colors" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleSubmit(list)} className="p-1.5 text-[#475569] hover:text-[#16a34a] hover:bg-[#f1f5f9] rounded transition-colors" title="Submit">
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(list)} className="p-1.5 text-[#475569] hover:text-[#dc2626] hover:bg-[#f1f5f9] rounded transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {list.status === 'rejected' && canCreate && (
                            <>
                              <button onClick={() => navigate(`/payment-lists/new?edit=${list.id}`)} className="p-1.5 text-[#475569] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded transition-colors" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleSubmit(list)} className="p-1.5 text-[#475569] hover:text-[#16a34a] hover:bg-[#f1f5f9] rounded transition-colors" title="Resubmit">
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0]">
          <p className="text-xs text-[#475569]">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#475569] px-2">Page {page} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View List Modal */}
      {viewingList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewingList(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-[600px] w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1e293b]">Payment List Details</h3>
              <button onClick={() => setViewingList(null)} className="p-1 text-[#94a3b8] hover:text-[#475569]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">List Name</p>
                  <p className="text-sm font-medium text-[#1e293b]">{viewingList.name}</p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Status</p>
                  <Badge status={viewingList.status} />
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Province</p>
                  <p className="text-sm text-[#1e293b]">{viewingList.province}</p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Cycle</p>
                  <p className="text-sm text-[#1e293b]">{cycles.find(c => c.id === viewingList.cycleId)?.name || viewingList.cycleId}</p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Beneficiaries</p>
                  <p className="text-sm text-[#1e293b]">{viewingList.beneficiaryCount.toLocaleString()}</p>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Total Amount</p>
                  <p className="text-sm font-medium text-[#0d9488]">${viewingList.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              {viewingList.submittedAt && (
                <div className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#475569] mb-1">Submitted At</p>
                  <p className="text-sm text-[#1e293b]">{new Date(viewingList.submittedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setViewingList(null)} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
