import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Beneficiary } from '@/lib/api';
import Faux3DBarChart from '@/components/Faux3DBarChart';
import PieChartComponent from '@/components/PieChartComponent';
import EcopayTransactions from '@/components/EcopayTransactions';
import { ExportReports } from '@/components/ExportReports';
import ReconciliationPage from '@/pages/ReconciliationPage';
import { FileBarChart, Users, Wallet, AlertTriangle, CreditCard, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

type ReconciliationRow = {
  province?: string;
  district?: string;
  certified: number;
  paid: number;
  variance: number;
};

type DuplicateGroup = {
  field: 'national_id' | 'ecocash_number';
  value: string;
  members: Beneficiary[];
};

const normalizeIdentifier = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'summary' | 'reconciliation' | 'beneficiary' | 'ecopay'>('summary');
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [beneficiarySummary, setBeneficiarySummary] = useState<{ paid: number; failed: number; excluded: number } | null>(null);
  const [reconciliationRows, setReconciliationRows] = useState<ReconciliationRow[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        const [reconRes, benSummaryRes, beneficiariesRes, provincesRes] = await Promise.all([
          api.getReconciliationData({}),
          api.getBeneficiarySummary(),
          api.getBeneficiaries({ limit: 1000 }),
          api.getProvinces(),
        ]);
        
        if (!cancelled) {
          const provincesData = provincesRes ? (Array.isArray(provincesRes) ? provincesRes : provincesRes.data || []) : [];
          setProvinces(provincesData);

          if (reconRes.success && Array.isArray((reconRes as any).data)) {
            setReconciliationRows((reconRes as any).data as ReconciliationRow[]);
          } else {
            setReconciliationRows([]);
          }

          if (benSummaryRes.success && (benSummaryRes as any).data) {
            setBeneficiarySummary((benSummaryRes as any).data);
          } else {
            setBeneficiarySummary(null);
          }

          if (beneficiariesRes.success && (beneficiariesRes as any).data) {
            const raw = (beneficiariesRes as any).data;
            const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
            setBeneficiaries(list as Beneficiary[]);
          } else {
            setBeneficiaries([]);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setReconciliationRows([]);
          setBeneficiarySummary(null);
          setBeneficiaries([]);
          addToast('Failed to load report data', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const totalPaid = useMemo(() => beneficiarySummary?.paid ?? 0, [beneficiarySummary]);
  const totalFailed = useMemo(() => beneficiarySummary?.failed ?? 0, [beneficiarySummary]);
  const totalExcluded = useMemo(() => beneficiarySummary?.excluded ?? 0, [beneficiarySummary]);

  const statusData = useMemo(
    () => [
      { name: 'Paid', value: beneficiarySummary?.paid ?? 0, color: '#16a34a' },
      { name: 'Failed', value: beneficiarySummary?.failed ?? 0, color: '#dc2626' },
      { name: 'Excluded', value: beneficiarySummary?.excluded ?? 0, color: '#ca8a04' },
    ],
    [beneficiarySummary],
  );

  const reconciliationProvinceData = useMemo(
    () =>
      provinces.map((province) => {
        const row = reconciliationRows.find((r) => r.province === province);
        return {
          province,
          label: province.slice(0, 6),
          certified: row?.certified ?? 0,
          paid: row?.paid ?? 0,
          variance: row?.variance ?? 0,
        };
      }),
    [reconciliationRows, provinces],
  );

  const beneficiariesByProvince = useMemo(
    () =>
      provinces.map((province) => ({
        province,
        count: beneficiaries.filter((ben) => ben.province === province).length,
      })),
    [beneficiaries, provinces],
  );

  const beneficiariesByDistrict = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ben of beneficiaries) {
      const district = ben.district || 'Unknown';
      counts.set(district, (counts.get(district) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([district, count]) => ({ district, count }));
  }, [beneficiaries]);

  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, DuplicateGroup>();

    for (const ben of beneficiaries) {
      const national = normalizeIdentifier(ben.national_id);
      if (national) {
        const key = `national_id:${national}`;
        const group = groups.get(key);
        if (group) {
          group.members.push(ben);
        } else {
          groups.set(key, { field: 'national_id', value: national, members: [ben] });
        }
      }

      const ecocash = normalizeIdentifier(ben.ecocash_number);
      if (ecocash) {
        const key = `ecocash_number:${ecocash}`;
        const group = groups.get(key);
        if (group) {
          group.members.push(ben);
        } else {
          groups.set(key, { field: 'ecocash_number', value: ecocash, members: [ben] });
        }
      }
    }

    return Array.from(groups.values()).filter((group) => {
      const provinces = new Set(group.members.map((member) => member.province));
      return provinces.size > 1;
    });
  }, [beneficiaries]);

  const nationalIdDuplicateGroups = useMemo(
    () => duplicateGroups.filter((group) => group.field === 'national_id').length,
    [duplicateGroups],
  );

  const ecocashDuplicateGroups = useMemo(
    () => duplicateGroups.filter((group) => group.field === 'ecocash_number').length,
    [duplicateGroups],
  );

  const duplicateProvinceData = useMemo(
    () =>
      provinces.map((province) => ({
        label: province,
        duplicates: duplicateGroups.reduce(
          (sum, group) => sum + group.members.filter((member) => member.province === province).length,
          0,
        ),
      })),
    [duplicateGroups, provinces],
  );

  const totalCrossProvinceDuplicates = useMemo(
    () => duplicateProvinceData.reduce((sum, item) => sum + item.duplicates, 0),
    [duplicateProvinceData],
  );

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-sm text-[#475569]">
        Loading report data...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Reports</h1>
          <p className="text-sm text-[#475569] mt-0.5">Generate and export payment reports</p>
        </div>
        <ExportReports availableTypes={['transactions', 'beneficiaries', 'summary']} />
      </div>

      <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)] w-fit">
        {[
          { key: 'summary' as const, label: 'Payment Summary', icon: FileBarChart },
          { key: 'reconciliation' as const, label: 'Reconciliation', icon: Wallet },
          { key: 'beneficiary' as const, label: 'Beneficiary Report', icon: Users },
          { key: 'ecopay' as const, label: 'Ecopay Transactions', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-[#0d9488] text-white' : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div
              className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow cursor-pointer group"
              onClick={() => navigate('/payment-batches')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[rgba(13,148,136,0.1)] rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#0d9488]" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase tracking-wide">Total Paid</p>
                  <p className="text-2xl font-bold text-[#16a34a]">{totalPaid.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View payment summary</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
            <div
              className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow cursor-pointer group"
              onClick={() => navigate('/payment-batches')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[rgba(220,38,38,0.1)] rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase tracking-wide">Failed Amount</p>
                  <p className="text-2xl font-bold text-[#dc2626]">{totalFailed.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View failed batches</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
            <div
              className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow cursor-pointer group"
              onClick={() => navigate('/payment-lists')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[rgba(8,145,178,0.1)] rounded-lg flex items-center justify-center">
                  <FileBarChart className="w-5 h-5 text-[#0891b2]" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase tracking-wide">Province Summary</p>
                  <p className="text-2xl font-bold text-[#1e293b]">{reconciliationProvinceData.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View province reconciliation</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
            <div
              className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow cursor-pointer group"
              onClick={() => navigate('/payment-lists')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[rgba(245,158,11,0.1)] rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase tracking-wide">Cross-Province Duplicates</p>
                  <p className="text-2xl font-bold text-[#7c2d12]">{totalCrossProvinceDuplicates}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Review duplicate risk</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <p className="text-xs text-[#475569] uppercase tracking-wide mb-1">National ID duplicate groups</p>
              <p className="text-2xl font-bold text-[#0d9488]">{nationalIdDuplicateGroups}</p>
            </div>
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <p className="text-xs text-[#475569] uppercase tracking-wide mb-1">Ecocash duplicate groups</p>
              <p className="text-2xl font-bold text-[#0f766e]">{ecocashDuplicateGroups}</p>
            </div>
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <p className="text-xs text-[#475569] uppercase tracking-wide mb-1">Excluded beneficiaries</p>
              <p className="text-2xl font-bold text-[#7c2d12]">{totalExcluded}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Payment Summary by Province</h3>
            <div className="h-[350px]">
              <Faux3DBarChart
                data={reconciliationProvinceData.map((p) => ({ label: p.label, certified: p.certified, paid: p.paid }))}
                categoriesKey="label"
                series={[{ key: 'certified', color: '#0891b2' }, { key: 'paid', color: '#16a34a' }]}
                height={350}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1e293b]">Cross-Province Duplicate Risk</h3>
                <p className="text-sm text-[#64748b]">Detects beneficiaries with the same National ID or Ecocash number across provinces.</p>
              </div>
              <span className="text-sm font-semibold text-[#7c2d12]">{totalCrossProvinceDuplicates} flagged</span>
            </div>
            {duplicateProvinceData.some((item) => item.duplicates > 0) ? (
              <div className="h-[280px]">
                <Faux3DBarChart
                  data={duplicateProvinceData.filter((item) => item.duplicates > 0)}
                  categoriesKey="label"
                  series={[{ key: 'duplicates', color: '#f97316' }]}
                  height={280}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 text-sm text-[#334155]">
                No cross-province duplicates were detected in the current beneficiary data set.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <ReconciliationPage />
        </div>
      )}

      {activeTab === 'beneficiary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <h3 className="text-base font-semibold text-[#1e293b] mb-4">Status Distribution</h3>
              <PieChartComponent
                data={statusData}
                height={280}
                outerRadius={90}
                showLabel={true}
                showLegend={true}
                showTooltip={true}
                paddingAngle={3}
                labelFormatter={(name, percent) => `${name} (${percent}%)`}
                tooltipFormatter={(value) => value.toLocaleString()}
              />
            </div>
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <h3 className="text-base font-semibold text-[#1e293b] mb-4">Beneficiaries by Province</h3>
              <div className="h-[280px]">
                <Faux3DBarChart
                  data={beneficiariesByProvince.map((item) => ({ label: item.province.slice(0, 6), beneficiaries: item.count }))}
                  categoriesKey="label"
                  series={[{ key: 'beneficiaries', color: '#0d9488' }]}
                  height={280}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-[#1e293b]">Top Districts by Beneficiary Count</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f1f5f9] text-left text-[11px] uppercase tracking-wide text-[#475569]">
                    <th className="px-4 py-2.5">District</th>
                    <th className="px-4 py-2.5">Beneficiaries</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiariesByDistrict.map((row) => (
                    <tr key={row.district} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)]">
                      <td className="px-4 py-3 text-[#1e293b]">{row.district}</td>
                      <td className="px-4 py-3 font-semibold text-[#0d9488]">{row.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ecopay' && <EcopayTransactions />}
    </div>
  );
}
