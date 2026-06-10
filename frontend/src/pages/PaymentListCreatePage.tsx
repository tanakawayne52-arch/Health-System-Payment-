import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { Search, ChevronRight, ChevronLeft, Check, Upload } from 'lucide-react';

interface BeneficiaryRow {
  id: string;
  full_name: string;
  national_id: string;
  ecocash_number: string;
  district: string;
  status: string;
}

export default function PaymentListCreatePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedBens, setSelectedBens] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [amount] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRow[]>([]);
  const [cycles, setCycles] = useState<Array<{ id: string; name: string; status: string }>>([]);

  const province = user?.province || 'BULAWAYO';
  const activeCycle = cycles.find(c => c.status === 'open');

  useEffect(() => {
    api.getBeneficiaries({ province, status: 'active', limit: 1000 }).then(res => {
      if (res.success && Array.isArray(res.data)) {
        setBeneficiaries(res.data as BeneficiaryRow[]);
      }
    });
    api.getCycles().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCycles(res.data);
      }
    });
  }, [province]);

  const filtered = useMemo(() => {
    if (!search) return beneficiaries;
    const s = search.toLowerCase();
    return beneficiaries.filter(b =>
      b.full_name.toLowerCase().includes(s) ||
      b.national_id.toLowerCase().includes(s) ||
      b.ecocash_number.includes(s)
    );
  }, [beneficiaries, search]);

  const toggleBen = (id: string) => {
    setSelectedBens(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedBens(selectedBens.length === filtered.length ? [] : filtered.map(b => b.id));
  };

  const handleSubmit = async () => {
    if (!activeCycle) {
      addToast('No open payment cycle available', 'error');
      return;
    }
    setIsSubmitting(true);
    const createRes = await api.createPaymentList({
      cycleId: activeCycle.id,
      name: `${province} - ${activeCycle.name}`,
      province,
      beneficiaryIds: selectedBens,
      amount,
      notes,
      evidenceNotes,
    });
    if (!createRes.success || !createRes.data?.id) {
      addToast(createRes.message || 'Failed to create list', 'error');
      setIsSubmitting(false);
      return;
    }

    const submitRes = await api.submitPaymentList(createRes.data.id, { evidenceNotes, notes });
    setIsSubmitting(false);
    if (submitRes.success) {
      addToast('Payment list submitted for certification', 'success');
      navigate('/payment-lists');
    } else {
      addToast(submitRes.message || 'Created as draft but submit failed', 'warning');
      navigate('/payment-lists');
    }
  };

  const totalAmount = selectedBens.length * amount;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="pb-4 border-b border-[#e2e8f0]">
        <h1 className="text-[28px] font-bold text-[#1e293b]">Create Payment List</h1>
        <p className="text-sm text-[#475569]">{province} — {activeCycle?.name || 'No open cycle'}</p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded ${step >= s ? 'bg-[#0d9488]' : 'bg-[#e2e8f0]'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Select Active Beneficiaries</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm border rounded-md w-56" />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#f1f5f9]">
                <tr>
                  <th className="px-4 py-2"><input type="checkbox" checked={selectedBens.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th className="text-left text-xs uppercase px-4 py-2">Name</th>
                  <th className="text-left text-xs uppercase px-4 py-2">National ID</th>
                  <th className="text-left text-xs uppercase px-4 py-2">EcoCash</th>
                  <th className="text-left text-xs uppercase px-4 py-2">District</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ben => (
                  <tr key={ben.id} onClick={() => toggleBen(ben.id)} className="border-b cursor-pointer hover:bg-teal-50/50">
                    <td className="px-4 py-2"><input type="checkbox" checked={selectedBens.includes(ben.id)} onChange={() => toggleBen(ben.id)} onClick={e => e.stopPropagation()} /></td>
                    <td className="px-4 py-2 text-sm">{ben.full_name}</td>
                    <td className="px-4 py-2 text-sm font-mono">{ben.national_id}</td>
                    <td className="px-4 py-2 text-sm">{ben.ecocash_number}</td>
                    <td className="px-4 py-2 text-sm">{ben.district}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between px-5 py-4 border-t">
            <button onClick={() => navigate('/payment-lists')} className="px-4 py-2 text-sm text-[#475569]">Cancel</button>
            <button disabled={selectedBens.length === 0} onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-md text-sm disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="font-semibold">Review & Notes</h3>
          <p className="text-sm">Selected: <strong>{selectedBens.length}</strong> · Total: <strong className="text-[#0d9488]">${totalAmount.toLocaleString()}</strong></p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Submission notes for Head Office..."
            rows={3} className="w-full border rounded-md px-3 py-2 text-sm" />
          <textarea value={evidenceNotes} onChange={e => setEvidenceNotes(e.target.value)} placeholder="Evidence summary (attendance registers, supervisor sign-off)..."
            rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-2 text-sm"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-md text-sm">Next <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <Upload className="w-10 h-10 text-[#0d9488] mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-4">Confirm Submission</h3>
          <div className="bg-[#f8fafc] rounded-lg p-4 text-left text-sm space-y-2 mb-6 max-w-md mx-auto">
            <div className="flex justify-between"><span>Beneficiaries</span><span>{selectedBens.length}</span></div>
            <div className="flex justify-between"><span>Total</span><span className="font-bold text-[#0d9488]">${totalAmount.toLocaleString()}</span></div>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm border rounded-md">Back</button>
            <button onClick={() => void handleSubmit()} disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-semibold disabled:opacity-50">
              <Check className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit for Certification'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
