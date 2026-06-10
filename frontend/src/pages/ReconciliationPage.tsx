import { useMemo, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, GitCompare, Search, X as XIcon, ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ReconciliationPage() {
  const [reconciliationData, setReconciliationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await api.getReconciliationData({
        province: selectedDistrict ? (selectedProvince ?? undefined) : undefined,
        district: selectedDistrict ?? undefined,
      });
      if (response.success) {
        setReconciliationData(response.data || []);
      } else {
        setReconciliationData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedProvince, selectedDistrict]);

  const totalCertified = reconciliationData.reduce((s, r) => s + r.certified, 0);
  const totalPaid = reconciliationData.reduce((s, r) => s + r.paid, 0);
  const totalVariance = totalCertified - totalPaid;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredReconciliationData = useMemo(() => {
    let data = reconciliationData;
    if (search) {
      const query = search.toLowerCase();
      data = data.filter(row => 
        (row.province?.toLowerCase().includes(query) || row.district?.toLowerCase().includes(query))
      );
    }
    if (statusFilter !== 'ALL') {
      data = data.filter(row => statusFilter === 'balanced' ? row.variance === 0 : row.variance !== 0);
    }
    return data;
  }, [reconciliationData, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReconciliationData.length / pageSize));
  const paginatedReconciliationData = filteredReconciliationData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-[#e2e8f0]">
        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Reconciliation</h1>
        <p className="text-sm text-[#475569] mt-0.5">Compare certified lists with executed payment batches</p>
      </div>

      {/* Breadcrumb Navigation */}
      {selectedProvince && (
        <div className="flex items-center gap-2 text-sm text-[#475569]">
          <button
            onClick={() => {
              setSelectedProvince(null);
              setSelectedDistrict(null);
            }}
            className="text-[#0d9488] hover:text-[#0f766e] font-medium"
          >
            National
          </button>
          <span>/</span>
          {!selectedDistrict && <span className="font-medium text-[#1e293b]">{selectedProvince}</span>}
          {selectedDistrict && (
            <>
              <button
                onClick={() => setSelectedDistrict(null)}
                className="text-[#0d9488] hover:text-[#0f766e] font-medium"
              >
                {selectedProvince}
              </button>
              <span>/</span>
              <span className="font-medium text-[#1e293b]">{selectedDistrict}</span>
            </>
          )}
        </div>
      )}

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
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#0d9488]" />
            <h3 className="text-base font-semibold text-[#1e293b]">
              {selectedDistrict ? 'District-by-District Reconciliation' : selectedProvince ? 'District-by-District Reconciliation' : 'Province-by-Province Reconciliation'}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search ${selectedDistrict ? 'districts' : selectedProvince ? 'districts' : 'provinces'}...`}
                className="w-[220px] bg-[#f1f5f9] border border-[#e2e8f0] rounded-md pl-9 pr-4 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="balanced">Balanced</option>
              <option value="discrepancy">Discrepancy</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0d9488] animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f1f5f9]">
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">
                      {selectedDistrict ? 'District' : 'Province'}
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Certified Beneficiaries</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Paid Beneficiaries</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Variance</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Status</th>
                    <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Variance %</th>
                    {!selectedDistrict && !selectedProvince && (
                      <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                {paginatedReconciliationData.map(row => (
                    <tr key={row.province || row.district} className={`border-b border-[#e2e8f0] transition-colors ${row.variance !== 0 ? 'bg-[rgba(220,38,38,0.02)]' : ''}`}>
                      <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">
                        {row.province || row.district}
                      </td>
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
                      {!selectedDistrict && !selectedProvince && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedProvince(row.province)}
                            className="text-[#0d9488] hover:text-[#0f766e] text-sm font-medium flex items-center gap-1"
                          >
                            View Districts <ChevronDown className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                      {!selectedDistrict && selectedProvince && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              // Drill-down: load district reconciliation for the selected province
                              // Backend supports district-level reconciliation via ?province&district,
                              // so we first set the province and keep district null.
                              setSelectedDistrict(null);
                            }}
                            className="text-[#0d9488] hover:text-[#0f766e] text-sm font-medium flex items-center gap-1"
                          >
                            View Districts <ChevronDown className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0]">
              <p className="text-xs text-[#475569]">
                Showing {filteredReconciliationData.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredReconciliationData.length)} of {filteredReconciliationData.length.toLocaleString()} {selectedDistrict ? 'districts' : 'provinces'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-xs text-[#475569] px-2">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 text-[#475569] hover:bg-[#f1f5f9] rounded disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
