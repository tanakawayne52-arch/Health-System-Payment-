import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, PaymentListRecord } from '@/lib/api';
import Badge from '@/components/Badge';
import PaginationControls from '@/components/PaginationControls';
import CertificationModal, { type PaymentListDetail } from '@/components/CertificationModal';
import { PAGE_SIZE, defaultPagination, type PaginationMeta } from '@/constants/pagination';
import { PROVINCES } from '@/types';
import type { PaymentList } from '@/types';
import {
  Search, Plus, Eye, Pencil, Send, Trash2, ShieldCheck,
  ClipboardCheck, Filter, Unlock, Upload,
} from 'lucide-react';

function mapList(row: PaymentListRecord): PaymentList {
  return {
    id: row.id,
    cycleId: row.cycleId,
    province: row.province,
    district: row.district,
    name: row.name,
    status: row.status as PaymentList['status'],
    submittedBy: row.submittedBy ?? '',
    submittedAt: row.submittedAt,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    certificationNotes: row.certificationNotes,
    beneficiaryCount: row.beneficiaryCount,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt,
  };
}

export default function PaymentListsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const canCreate = user?.role === 'provincial_officer';
  const canCertify = user?.role === 'finance_officer' || user?.role === 'national_admin';
  const province = user?.province;

  const [lists, setLists] = useState<PaymentList[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(defaultPagination());
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [queueTab, setQueueTab] = useState<'all' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [cycles, setCycles] = useState<Array<{ id: string; name: string }>>([]);

  const [modalList, setModalList] = useState<PaymentListDetail | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'certify'>('view');
  const [modalLoading, setModalLoading] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<PaymentList | null>(null);
  const [unlockReason, setUnlockReason] = useState('');

  const [evidenceTarget, setEvidenceTarget] = useState<PaymentList | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');

  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getPaymentLists({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        cycleId: cycleFilter !== 'ALL' ? cycleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        province: provinceFilter !== 'ALL' ? provinceFilter : undefined,
        pendingCertification: queueTab === 'pending',
      });
      if (result.success && Array.isArray(result.data)) {
        setLists(result.data.map(mapList));
        if (result.pagination) setPagination(result.pagination);
      }
    } catch {
      addToast('Failed to load payment lists', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, cycleFilter, statusFilter, provinceFilter, queueTab, addToast]);

  useEffect(() => {
    void fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    api.getCycles().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCycles(res.data.map(c => ({ id: c.id, name: c.name })));
      }
    });
  }, []);

  const openDetail = async (list: PaymentList, mode: 'view' | 'certify' = 'view') => {
    setModalLoading(true);
    setModalMode(mode);
    const res = await api.getPaymentList(list.id);
    if (res.success && res.data) {
      setModalList(res.data as PaymentListDetail);
    } else {
      addToast('Could not load list details', 'error');
    }
    setModalLoading(false);
  };

  const promptSubmit = (list: PaymentList) => {
    setEvidenceTarget(list);
    setEvidenceFile(null);
    setEvidenceNotes('');
  };

  const handleConfirmSubmit = async () => {
    if (!evidenceTarget) return;
    setModalLoading(true);
    const res = await api.submitPaymentList(evidenceTarget.id, {
      file: evidenceFile || undefined,
      evidenceNotes: evidenceNotes.trim() || undefined,
    });
    setModalLoading(false);
    if (res.success) {
      addToast('Payment list submitted for certification', 'success');
      setEvidenceTarget(null);
      void fetchLists();
    } else {
      addToast(res.message || 'Submit failed', 'error');
    }
  };

  const handleDelete = async (list: PaymentList) => {
    if (!confirm('Delete this draft list?')) return;
    const res = await api.deletePaymentList(list.id);
    if (res.success) {
      addToast('Payment list deleted', 'warning');
      void fetchLists();
    } else {
      addToast(res.message || 'Delete failed', 'error');
    }
  };

  const handleCertify = async (notes: string) => {
    if (!modalList) return;
    setModalLoading(true);
    const res = await api.certifyPaymentList(modalList.id, notes);
    setModalLoading(false);
    if (res.success) {
      addToast('List certified and locked', 'success');
      setModalList(null);
      void fetchLists();
    } else {
      addToast(res.message || 'Certification failed', 'error');
    }
  };

  const handleReject = async (reason: string) => {
    if (!modalList) return;
    setModalLoading(true);
    const res = await api.rejectPaymentList(modalList.id, reason);
    setModalLoading(false);
    if (res.success) {
      addToast('List rejected', 'warning');
      setModalList(null);
      void fetchLists();
    } else {
      addToast(res.message || 'Rejection failed', 'error');
    }
  };

  const handleReview = async () => {
    if (!modalList) return;
    setModalLoading(true);
    const res = await api.reviewPaymentList(modalList.id);
    setModalLoading(false);
    if (res.success) {
      addToast('List marked under review', 'success');
      await openDetail(mapList(modalList), 'certify');
    } else {
      addToast(res.message || 'Review update failed', 'error');
    }
  };

  const handleUnlockRequest = async () => {
    if (!unlockTarget || !unlockReason.trim()) return;
    const res = await api.requestUnlockPaymentList(unlockTarget.id, unlockReason);
    if (res.success) {
      addToast('Unlock request submitted to National Admin', 'success');
      setUnlockTarget(null);
      setUnlockReason('');
    } else {
      addToast(res.message || 'Unlock request failed', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Payment Lists</h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Manage and submit payment lists{province ? ` for ${province}` : ''}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/payment-lists/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] transition-all"
          >
            <Plus className="w-4 h-4" /> Create New List
          </button>
        )}
      </div>

      {canCertify && (
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm w-fit">
          <button
            onClick={() => { setQueueTab('all'); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${queueTab === 'all' ? 'bg-[#0d9488] text-white' : 'text-[#475569]'}`}
          >
            All Lists
          </button>
          <button
            onClick={() => { setQueueTab('pending'); setStatusFilter('ALL'); setPage(1); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${queueTab === 'pending' ? 'bg-[#8b5cf6] text-white' : 'text-[#475569]'}`}
          >
            <ClipboardCheck className="w-4 h-4" /> Certification Queue
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search list name..."
            className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md pl-9 pr-4 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
          />
        </div>
        <select value={cycleFilter} onChange={e => { setCycleFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm">
          <option value="ALL">All Cycles</option>
          {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {queueTab === 'all' && (
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm">
            <option value="ALL">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="certified">Certified</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
        {canCertify && (
          <select value={provinceFilter} onChange={e => { setProvinceFilter(e.target.value); setPage(1); }}
            className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm">
            <option value="ALL">All Provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <button type="button" onClick={() => void fetchLists()}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-[#475569] border border-[#e2e8f0] rounded-md hover:bg-[#f1f5f9]">
          <Filter className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase px-4 py-2.5">List Name</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase px-4 py-2.5">Cycle</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase px-4 py-2.5">Province</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase px-4 py-2.5">Beneficiaries</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase px-4 py-2.5">Amount</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase px-4 py-2.5">Status</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#94a3b8]">Loading...</td></tr>
              ) : lists.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#94a3b8]">No payment lists found</td></tr>
              ) : lists.map(list => (
                <tr key={list.id} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)]">
                  <td className="px-4 py-3 text-sm font-medium text-[#1e293b]">{list.name}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{cycles.find(c => c.id === list.cycleId)?.name || list.cycleId}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{list.province}</td>
                  <td className="px-4 py-3 text-sm">{list.beneficiaryCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">${list.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge status={list.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => void openDetail(list, 'view')} title="View" className="p-1.5 hover:bg-[#f1f5f9] rounded">
                        <Eye className="w-3.5 h-3.5 text-[#475569]" />
                      </button>
                      {canCertify && (list.status === 'submitted' || list.status === 'under_review') && (
                        <button onClick={() => void openDetail(list, 'certify')} title="Certify" className="p-1.5 hover:bg-green-50 rounded">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#16a34a]" />
                        </button>
                      )}
                      {list.status === 'draft' && canCreate && (
                        <>
                          <button onClick={() => navigate(`/payment-lists/new?edit=${list.id}`)} title="Edit" className="p-1.5 hover:bg-[#f1f5f9] rounded">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => promptSubmit(list)} title="Submit" className="p-1.5 hover:bg-green-50 rounded">
                            <Send className="w-3.5 h-3.5 text-[#16a34a]" />
                          </button>
                          <button onClick={() => void handleDelete(list)} title="Delete" className="p-1.5 hover:bg-red-50 rounded">
                            <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                          </button>
                        </>
                      )}
                      {list.status === 'rejected' && canCreate && (
                        <button onClick={() => navigate(`/payment-lists/new?edit=${list.id}`)} title="Edit & resubmit" className="p-1.5 hover:bg-[#f1f5f9] rounded">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {list.status === 'certified' && (canCreate || user?.role === 'national_admin') && (
                        <button onClick={() => setUnlockTarget(list)} title="Request unlock" className="p-1.5 hover:bg-amber-50 rounded">
                          <Unlock className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} onPageChange={setPage} />
      </div>

      <CertificationModal
        list={modalList}
        mode={modalMode}
        onClose={() => setModalList(null)}
        onCertify={handleCertify}
        onReject={handleReject}
        onReview={modalList?.status === 'submitted' ? handleReview : undefined}
        isLoading={modalLoading}
      />

      {unlockTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setUnlockTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Request Unlock</h3>
            <p className="text-sm text-[#64748b] mb-4">
              Certified list <strong>{unlockTarget.name}</strong> requires National Admin approval to edit.
            </p>
            <textarea
              value={unlockReason}
              onChange={e => setUnlockReason(e.target.value)}
              placeholder="Justification (required)..."
              rows={4}
              className="w-full border border-[#e2e8f0] rounded-md px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setUnlockTarget(null)} className="flex-1 py-2 text-sm border rounded-md">Cancel</button>
              <button onClick={() => void handleUnlockRequest()} disabled={!unlockReason.trim()}
                className="flex-1 py-2 text-sm bg-amber-600 text-white rounded-md disabled:opacity-50">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {evidenceTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEvidenceTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Submit Payment List</h3>
            <p className="text-sm text-[#64748b] mb-4">
              Please upload signed evidence (PDF/Excel) and/or provide notes before submitting <strong>{evidenceTarget.name}</strong> for certification.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Evidence File (Optional)</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 border-2 border-dashed border-[#e2e8f0] rounded-md px-3 py-4 text-center cursor-pointer hover:border-[#0d9488] transition-colors">
                  <Upload className="w-5 h-5 text-[#94a3b8] mx-auto mb-1" />
                  <span className="text-xs text-[#64748b]">{evidenceFile ? evidenceFile.name : 'Click to browse'}</span>
                  <input type="file" className="hidden" onChange={e => setEvidenceFile(e.target.files?.[0] || null)} />
                </label>
                {evidenceFile && (
                  <button onClick={() => setEvidenceFile(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Submission Notes</label>
              <textarea
                value={evidenceNotes}
                onChange={e => setEvidenceNotes(e.target.value)}
                placeholder="Add any remarks for the finance team..."
                rows={3}
                className="w-full border border-[#e2e8f0] rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEvidenceTarget(null)} className="flex-1 py-2 text-sm border rounded-md" disabled={modalLoading}>Cancel</button>
              <button onClick={() => void handleConfirmSubmit()} disabled={modalLoading}
                className="flex-1 py-2 text-sm bg-[#16a34a] text-white rounded-md disabled:opacity-50">
                {modalLoading ? 'Submitting...' : 'Submit List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
