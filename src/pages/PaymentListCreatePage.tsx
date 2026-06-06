import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getBeneficiaries, getCycles, savePaymentLists, getPaymentLists, saveListBeneficiaries, getListBeneficiaries, getAuditLogs, saveAuditLogs } from '@/data/seed';
import { Search, ChevronRight, ChevronLeft, Check, Upload } from 'lucide-react';

export default function PaymentListCreatePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedBens, setSelectedBens] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [amount] = useState(100);
  const province = user?.province || 'BULAWAYO';

  const beneficiaries = getBeneficiaries().filter(b => b.province === province && b.status === 'active');
  const cycles = getCycles().filter(c => c.status === 'open');
  const activeCycle = cycles[0];

  const filtered = useMemo(() => {
    if (!search) return beneficiaries;
    const s = search.toLowerCase();
    return beneficiaries.filter(b =>
      b.fullName.toLowerCase().includes(s) ||
      b.nationalId.toLowerCase().includes(s) ||
      b.ecocashNumber.includes(s)
    );
  }, [beneficiaries, search]);

  const toggleBen = (id: string) => {
    setSelectedBens(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedBens.length === filtered.length) {
      setSelectedBens([]);
    } else {
      setSelectedBens(filtered.map(b => b.id));
    }
  };

  const handleSubmit = () => {
    const lists = getPaymentLists();
    const newList = {
      id: `l${Date.now()}`,
      cycleId: activeCycle?.id || 'c6',
      province,
      district: null,
      name: `${province} - ${activeCycle?.name || 'Q2 2026'}`,
      status: 'submitted' as const,
      submittedBy: user?.id || 'u1',
      submittedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      certificationNotes: notes || null,
      beneficiaryCount: selectedBens.length,
      totalAmount: selectedBens.length * amount,
      createdAt: new Date().toISOString(),
    };

    const listBens = getListBeneficiaries();
    const newListBens = selectedBens.map(benId => ({
      id: `lb${Date.now()}-${benId}`,
      listId: newList.id,
      beneficiaryId: benId,
      amount,
      status: 'included' as const,
      exclusionReason: null as string | null,
    }));

    savePaymentLists([newList, ...lists]);
    saveListBeneficiaries([...newListBens, ...listBens]);

    const logs = getAuditLogs();
    logs.unshift({
      id: `a${Date.now()}`, userId: user?.id || '', userName: user?.fullName || '', userRole: user?.role || '',
      action: 'SUBMIT', entityType: 'PaymentList', entityId: newList.id,
      oldValues: null, newValues: { name: newList.name, beneficiaries: selectedBens.length },
      reason: notes || null, ipAddress: '192.168.1.20', timestamp: new Date().toISOString(),
    });
    saveAuditLogs(logs);

    addToast('Payment list submitted successfully', 'success');
    navigate('/payment-lists');
  };

  const selectedBeneficiaries = beneficiaries.filter(b => selectedBens.includes(b.id));
  const totalAmount = selectedBens.length * amount;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#e2e8f0]">
        <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Create Payment List</h1>
        <p className="text-sm text-[#475569] mt-0.5">{province} — {activeCycle?.name || 'Q2 2026'}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {['Select Beneficiaries', 'Review', 'Submit'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step > i + 1 ? 'bg-[#16a34a] text-white' : step === i + 1 ? 'bg-[#0d9488] text-white' : 'bg-[#e2e8f0] text-[#475569]'
            }`}>
              {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}>{label}</span>
            {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-[#16a34a]' : 'bg-[#e2e8f0]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Beneficiaries */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search beneficiaries..."
                  className="w-[280px] bg-[#f1f5f9] border border-[#e2e8f0] rounded-md pl-9 pr-4 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedBens.length === filtered.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-[#e2e8f0] text-[#0d9488] focus:ring-[#0d9488]"
                />
                Select All ({filtered.length})
              </label>
            </div>
            <div className="text-sm text-[#475569]">
              Selected: <strong className="text-[#0d9488]">{selectedBens.length}</strong> | ${totalAmount.toLocaleString()}
            </div>
          </div>
          <div className="max-h-[450px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#f1f5f9]">
                <tr>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5 w-10"></th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Name</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">National ID</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">EcoCash</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">District</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ben => (
                  <tr
                    key={ben.id}
                    className={`border-b border-[#e2e8f0] cursor-pointer transition-colors ${selectedBens.includes(ben.id) ? 'bg-[rgba(13,148,136,0.05)]' : 'hover:bg-[rgba(13,148,136,0.03)]'}`}
                    onClick={() => toggleBen(ben.id)}
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedBens.includes(ben.id)}
                        onChange={() => toggleBen(ben.id)}
                        className="w-4 h-4 rounded border-[#e2e8f0] text-[#0d9488] focus:ring-[#0d9488]"
                        onClick={e => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-[#1e293b]">{ben.fullName}</td>
                    <td className="px-4 py-2.5 text-sm text-[#475569] font-mono">{ben.nationalId}</td>
                    <td className="px-4 py-2.5 text-sm text-[#475569]">{ben.ecocashNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-[#475569]">{ben.district}</td>
                    <td className="px-4 py-2.5 text-sm text-[#1e293b] font-medium">${amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#e2e8f0]">
            <button onClick={() => navigate('/payment-lists')} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">Cancel</button>
            <button
              onClick={() => selectedBens.length > 0 && setStep(2)}
              disabled={selectedBens.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0]">
            <h3 className="text-base font-semibold text-[#1e293b]">Review Selected Beneficiaries</h3>
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#f1f5f9]">
                <tr>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Name</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">National ID</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">EcoCash</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">District</th>
                  <th className="text-left text-[11px] font-semibold text-[#475569] uppercase tracking-wide px-4 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedBeneficiaries.map(ben => (
                  <tr key={ben.id} className="border-b border-[#e2e8f0]">
                    <td className="px-4 py-2.5 text-sm text-[#1e293b]">{ben.fullName}</td>
                    <td className="px-4 py-2.5 text-sm text-[#475569] font-mono">{ben.nationalId}</td>
                    <td className="px-4 py-2.5 text-sm text-[#475569]">{ben.ecocashNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-[#475569]">{ben.district}</td>
                    <td className="px-4 py-2.5 text-sm text-[#1e293b] font-medium">${amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#475569]">Total Beneficiaries: <strong className="text-[#1e293b]">{selectedBens.length.toLocaleString()}</strong></p>
                <p className="text-sm text-[#475569]">Total Amount: <strong className="text-[#0d9488]">${totalAmount.toLocaleString()}</strong></p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Submission Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any notes for the certification review..."
                rows={3}
                className="w-full bg-white border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 resize-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#e2e8f0]">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Submit */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[rgba(13,148,136,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-[#0d9488]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1e293b] mb-1">Confirm Submission</h3>
            <p className="text-sm text-[#475569]">Review your payment list before submitting for certification</p>
          </div>

          <div className="bg-[#f8fafc] rounded-lg p-5 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[#475569]">List Name</span>
              <span className="text-sm font-medium text-[#1e293b]">{province} - {activeCycle?.name || 'Q2 2026'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#475569]">Province</span>
              <span className="text-sm font-medium text-[#1e293b]">{province}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#475569]">Beneficiaries</span>
              <span className="text-sm font-medium text-[#1e293b]">{selectedBens.length.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#475569]">Total Amount</span>
              <span className="text-sm font-bold text-[#0d9488]">${totalAmount.toLocaleString()}</span>
            </div>
            {notes && (
              <div className="flex justify-between">
                <span className="text-sm text-[#475569]">Notes</span>
                <span className="text-sm text-[#1e293b] max-w-[300px] text-right">{notes}</span>
              </div>
            )}
          </div>

          <div className="border-2 border-dashed border-[#e2e8f0] rounded-lg p-6 text-center mb-6 hover:border-[#0d9488] transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
            <p className="text-sm text-[#475569]">Upload supporting documents (optional)</p>
            <p className="text-xs text-[#94a3b8]">Attendance registers, supervisor sign-off (max 5 files, 10MB each)</p>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-semibold hover:bg-[#0f766e] active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4" /> Submit for Certification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
