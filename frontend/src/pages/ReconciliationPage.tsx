import { useMemo } from 'react';
import { getBatches, getPaymentLists } from '@/data/seed';
import { PROVINCES } from '@/types';
import { CheckCircle, XCircle, GitCompare } from 'lucide-react';

export default function ReconciliationPage() {
  const batches = getBatches();
  const lists = getPaymentLists();

  const reconciliationData = useMemo(() => {
    return PROVINCES.map(prov => {
      const provLists = lists.filter(l => l.province === prov && l.status === 'certified');
      const provBatches = batches.filter(b => b.province === prov && b.status === 'completed');
      const certified = provLists.reduce((s, l) => s + l.beneficiaryCount, 0);
      const paid = provBatches.reduce((s, b) => s + b.totalBeneficiaries, 0);
      return { province: prov, certified, paid, variance: certified - paid };
    });
  }, [batches, lists]);

  const totalCertified = reconciliationData.reduce((s, r) => s + r.certified, 0);
  const totalPaid = reconciliationData.reduce((s, r) => s + r.paid, 0);
  const totalVariance = totalCertified - totalPaid;

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-[#e2e8f0]">
        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Reconciliation</h1>
        <p className="text-sm text-[#475569] mt-0.5">Compare certified lists with executed payment batches</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <p className="text-xs text-[#475569] uppercase tracking-wide mb-1">Total Certified</p>
          <p className="text-[28px] font-bold text-[#0891b2]">{totalCertified.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <p className="text-xs text-[#475569] uppercase tracking-wide mb-1">Total Paid</p>
          <p className="text-[28px] font-bold text-[#16a34a]">{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <p className="text-xs text-[#475569] uppercase tracking-wide mb-1">Total Variance</p>
          <p className={`text-[28px] font-bold ${totalVariance === 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>{totalVariance === 0 ? '0' : `${totalVariance > 0 ? '+' : ''}${totalVariance}`}</p>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e2e8f0]">
          <GitCompare className="w-5 h-5 text-[#0d9488]" />
          <h3 className="text-base font-semibold text-[#1e293b]">Province-by-Province Reconciliation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Province</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Certified Beneficiaries</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Paid Beneficiaries</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Variance</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Variance %</th>
              </tr>
            </thead>
            <tbody>
              {reconciliationData.map(row => (
                <tr key={row.province} className={`border-b border-[#e2e8f0] transition-colors ${row.variance !== 0 ? 'bg-[rgba(220,38,38,0.02)]' : ''}`}>
                  <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{row.province}</td>
                  <td className="px-4 py-3 text-sm text-[#1e293b]">{row.certified.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#1e293b]">{row.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: row.variance === 0 ? '#16a34a' : '#dc2626' }}>
                    {row.variance === 0 ? '0' : `${row.variance > 0 ? '+' : ''}${row.variance}`}
                  </td>
                  <td className="px-4 py-3">
                    {row.variance === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#16a34a] font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Balanced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#dc2626] font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Discrepancy
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: row.variance === 0 ? '#16a34a' : '#dc2626' }}>
                    {row.certified > 0 ? ((row.variance / row.certified) * 100).toFixed(2) : '0.00'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
