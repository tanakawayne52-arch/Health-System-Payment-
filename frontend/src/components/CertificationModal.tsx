import { useState } from 'react';
import { X, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import Badge from '@/components/Badge';
import type { PaymentList } from '@/types';

export interface PaymentListDetail extends PaymentList {
  beneficiaries?: Array<{
    beneficiaryId: string;
    fullName: string;
    nationalId: string;
    ecocashNumber: string;
    district: string;
    amount: number;
    status: string;
  }>;
  cycleName?: string | null;
}

interface CertificationModalProps {
  list: PaymentListDetail | null;
  mode: 'view' | 'certify' | 'reject';
  onClose: () => void;
  onCertify: (notes: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onReview?: () => Promise<void>;
  isLoading?: boolean;
}

export default function CertificationModal({
  list,
  mode,
  onClose,
  onCertify,
  onReject,
  onReview,
  isLoading = false,
}: CertificationModalProps) {
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  if (!list) return null;

  const canCertify = list.status === 'submitted' || list.status === 'under_review';
  const showActions = mode === 'certify' && canCertify;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#0d9488]" />
            <div>
              <h3 className="text-lg font-semibold text-[#1e293b]">
                {mode === 'certify' ? 'Certification Review' : 'Payment List Details'}
              </h3>
              <p className="text-xs text-[#64748b]">{list.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[#94a3b8] hover:text-[#475569]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-[10px] uppercase text-[#64748b]">Status</p>
              <Badge status={list.status} />
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-[10px] uppercase text-[#64748b]">Province</p>
              <p className="text-sm font-medium">{list.province}</p>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-[10px] uppercase text-[#64748b]">Beneficiaries</p>
              <p className="text-sm font-medium">{list.beneficiaryCount.toLocaleString()}</p>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-[10px] uppercase text-[#64748b]">Total</p>
              <p className="text-sm font-bold text-[#0d9488]">${list.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {list.certificationNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">Submission Notes</p>
              <p className="text-sm text-amber-900">{list.certificationNotes}</p>
            </div>
          )}

          {list.beneficiaries && list.beneficiaries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase mb-2 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Beneficiaries ({list.beneficiaries.length})
              </p>
              <div className="max-h-48 overflow-y-auto border border-[#e2e8f0] rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[#f1f5f9] sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-[10px] uppercase">Name</th>
                      <th className="text-left px-3 py-2 text-[10px] uppercase">ID</th>
                      <th className="text-right px-3 py-2 text-[10px] uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.beneficiaries.slice(0, 50).map(b => (
                      <tr key={b.beneficiaryId} className="border-t border-[#e2e8f0]">
                        <td className="px-3 py-1.5">{b.fullName}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{b.nationalId}</td>
                        <td className="px-3 py-1.5 text-right">${b.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showActions && (
            <div className="space-y-3 pt-2 border-t border-[#e2e8f0]">
              {list.status === 'submitted' && onReview && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onReview()}
                  className="w-full py-2 text-sm border border-[#8b5cf6] text-[#8b5cf6] rounded-md hover:bg-[#8b5cf6]/5"
                >
                  Mark Under Review
                </button>
              )}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Certification Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Approval notes for audit trail..."
                  rows={2}
                  className="w-full border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Rejection Reason (if rejecting)</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Required if rejecting this list..."
                  rows={2}
                  className="w-full border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#dc2626] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-[#475569] hover:bg-white rounded-md border border-[#e2e8f0]">
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading || !rejectReason.trim()}
              onClick={() => onReject(rejectReason)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#dc2626] border border-[#dc2626] rounded-md hover:bg-red-50 disabled:opacity-40"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onCertify(notes || 'Approved for payment')}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-[#16a34a] rounded-md hover:bg-[#15803d] disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" /> Certify & Lock
            </button>
          </div>
        )}

        {mode === 'view' && (
          <div className="px-6 py-4 border-t border-[#e2e8f0]">
            <button type="button" onClick={onClose} className="w-full py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f1f5f9] rounded-md">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
