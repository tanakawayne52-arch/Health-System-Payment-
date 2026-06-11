import { useState } from 'react';
import { getBatches, getPaymentLists, getBeneficiaries } from '@/data/seed';
import { PROVINCES } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PieChartComponent from '@/components/PieChartComponent';
import EcopayTransactions from '@/components/EcopayTransactions';
import { FileBarChart, Users, Wallet, AlertTriangle, CreditCard } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'reconciliation' | 'beneficiary' | 'ecopay'>('summary');

  const batches = getBatches();
  const lists = getPaymentLists();
  const beneficiaries = getBeneficiaries();

  const provinceData = PROVINCES.map(prov => {
    const provBens = beneficiaries.filter(b => b.province === prov);
    const provLists = lists.filter(l => l.province === prov && l.status === 'certified');
    const provBatches = batches.filter(b => b.province === prov && b.status === 'completed');
    return {
      province: prov,
      label: prov.slice(0, 6),
      beneficiaries: provBens.length,
      active: provBens.filter(b => b.status === 'active').length,
      inactive: provBens.filter(b => b.status === 'inactive').length,
      exited: provBens.filter(b => b.status === 'exited').length,
      certified: provLists.reduce((s, l) => s + l.beneficiaryCount, 0),
      paid: provBatches.reduce((s, b) => s + b.totalBeneficiaries, 0),
    };
  });

  const statusData = [
    { name: 'Active', value: beneficiaries.filter(b => b.status === 'active').length, color: '#16a34a' },
    { name: 'Inactive', value: beneficiaries.filter(b => b.status === 'inactive').length, color: '#ca8a04' },
    { name: 'Exited', value: beneficiaries.filter(b => b.status === 'exited').length, color: '#dc2626' },
  ];

  const totalPaid = batches.filter(b => b.status === 'completed').reduce((s, b) => s + b.totalAmount, 0);
  const totalFailed = batches.filter(b => b.status === 'failed').reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-[#e2e8f0]">
        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Reports</h1>
        <p className="text-sm text-[#475569] mt-0.5">Generate and export payment reports</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)] w-fit">
        {[
          { key: 'summary' as const, label: 'Payment Summary', icon: FileBarChart },
          { key: 'reconciliation' as const, label: 'Reconciliation', icon: Wallet },
          { key: 'beneficiary' as const, label: 'Beneficiary Report', icon: Users },
          { key: 'ecopay' as const, label: 'Ecopay Transactions', icon: CreditCard },
        ].map(tab => (
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

      {/* Payment Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[rgba(13,148,136,0.1)] rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#0d9488]" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase tracking-wide">Total Paid</p>
                  <p className="text-2xl font-bold text-[#16a34a]">${totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[rgba(220,38,38,0.1)] rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase tracking-wide">Failed Amount</p>
                  <p className="text-2xl font-bold text-[#dc2626]">${totalFailed.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[rgba(8,145,178,0.1)] rounded-lg flex items-center justify-center">
                  <FileBarChart className="w-5 h-5 text-[#0891b2]" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase tracking-wide">Total Batches</p>
                  <p className="text-2xl font-bold text-[#1e293b]">{batches.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <h3 className="text-base font-semibold text-[#1e293b] mb-4">Payment Summary by Province</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(value, name) => {
                    return [value, name === 'certified' ? 'Certified' : name === 'paid' ? 'Paid' : name];
                  }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="certified" fill="#0891b2" name="Certified" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" fill="#16a34a" name="Paid" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0]">
            <h3 className="text-base font-semibold text-[#1e293b]">Certified Lists vs Executed Batches</h3>
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
                </tr>
              </thead>
              <tbody>
                {provinceData.map(row => (
                  <tr key={row.province} className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors">
                    <td className="px-4 py-3 text-sm text-[#1e293b] font-medium">{row.province}</td>
                    <td className="px-4 py-3 text-sm text-[#1e293b]">{row.certified.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#1e293b]">{row.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: row.certified === row.paid ? '#16a34a' : '#dc2626' }}>
                      {row.certified - row.paid === 0 ? '0' : `+${row.certified - row.paid}`}
                    </td>
                    <td className="px-4 py-3">
                      {row.certified === row.paid ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#16a34a] font-medium">
                          <div className="w-2 h-2 rounded-full bg-[#16a34a]" /> Balanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#dc2626] font-medium">
                          <div className="w-2 h-2 rounded-full bg-[#dc2626]" /> Discrepancy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Beneficiary Report */}
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
                legendPosition="bottom"
                paddingAngle={3}
                labelFormatter={(name, percent) => `${name} (${percent}%)`}
                tooltipFormatter={(value) => value.toLocaleString()}
              />
            </div>
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <h3 className="text-base font-semibold text-[#1e293b] mb-4">Beneficiaries by Province</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={provinceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="beneficiaries" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ecopay Transactions */}
      {activeTab === 'ecopay' && <EcopayTransactions />}
    </div>
  );
}
