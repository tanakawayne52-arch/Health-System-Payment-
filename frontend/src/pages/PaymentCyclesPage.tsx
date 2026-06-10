import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import Badge from '@/components/Badge';
import { Calendar, Plus, Lock, CheckCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import type { PaymentCycle, CycleStatus } from '@/types';

export default function PaymentCyclesPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<PaymentCycle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedListsCount, setRelatedListsCount] = useState<Record<string, number>>({});

  const loadCycles = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCycles();
      if (res.success && res.data) {
        // map backend keys
        const mapped = res.data.map((c: any) => ({
          ...c,
          periodStart: c.periodStart,
          periodEnd: c.periodEnd,
          createdBy: 'system' // Not strictly returned or needed here
        })) as PaymentCycle[];
        setCycles(mapped);
      }
    } catch (e) {
      addToast('Failed to load cycles', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  const handleStatusChange = async (cycle: PaymentCycle, newStatus: CycleStatus) => {
    try {
      const res = await api.updateCycleStatus(cycle.id, newStatus);
      if (res.success) {
        setCycles(cycles.map(c => c.id === cycle.id ? { ...c, status: newStatus } : c));
        addToast(`Cycle ${cycle.name} ${newStatus === 'locked' ? 'locked' : newStatus === 'closed' ? 'closed' : 'updated'}`, 'success');
      } else {
        addToast(res.message || 'Failed to update status', 'error');
      }
    } catch (e) {
      addToast('Error updating status', 'error');
    }
  };

  const handleCreate = async (name: string, periodStart: string, periodEnd: string) => {
    try {
      const res = await api.createCycle({ name, periodStart, periodEnd });
      if (res.success) {
        setShowCreate(false);
        addToast(`Payment cycle ${name} created`, 'success');
        loadCycles();
      } else {
        addToast(res.message || 'Failed to create cycle', 'error');
      }
    } catch (e) {
      addToast('Error creating cycle', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Payment Cycles</h1>
          <p className="text-sm text-[#475569] mt-0.5">Manage quarterly payment cycles</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-md text-sm font-medium hover:bg-[#0f766e] active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" /> Create Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cycles.map(cycle => {
          return (
            <div key={cycle.id} className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[rgba(13,148,136,0.1)] rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#0d9488]" />
                  </div>
                  <div>
                    <div className="relative group/tooltip">
                      <h3 className="text-base font-semibold text-[#1e293b] cursor-pointer hover:text-[#0d9488]">{cycle.name}</h3>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                        Click to view payment lists
                        <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                    <p className="text-xs text-[#475569]">{cycle.periodStart} to {cycle.periodEnd}</p>
                  </div>
                </div>
                <Badge status={cycle.status} />
              </div>
              <div className="space-y-2 pt-3 border-t border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[#475569]">
                    <FileText className="w-3 h-3" />
                    <span>Payment lists</span>
                  </div>
                  <button onClick={() => navigate('/payment-lists')} className="text-xs text-[#0d9488] hover:underline flex items-center gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {cycle.status === 'open' && (
                      <button onClick={() => handleStatusChange(cycle, 'locked')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#d97706] hover:bg-[rgba(217,119,6,0.1)] rounded transition-colors">
                        <Lock className="w-3 h-3" /> Lock
                      </button>
                    )}
                    {cycle.status === 'locked' && (
                      <button onClick={() => handleStatusChange(cycle, 'closed')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#16a34a] hover:bg-[rgba(22,163,74,0.1)] rounded transition-colors">
                        <CheckCircle className="w-3 h-3" /> Close
                      </button>
                    )}
                  </div>
                  <div className="relative group/tooltip">
                    <span className="text-xs text-[#94a3b8] font-mono">{cycle.id}</span>
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                      Cycle ID
                      <div className="absolute right-2 top-full border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateCycleModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

function CreateCycleModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, start: string, end: string) => void }) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-[440px] w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Create Payment Cycle</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Cycle Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Q3 2026"
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Period Start</label>
              <input type="date" value={start} onChange={e => setStart(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5 uppercase tracking-wide">Period End</label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#475569] hover:bg-[#f1f5f9] rounded-md">Cancel</button>
          <button onClick={() => { if (name && start && end) { onCreate(name, start, end); } }} disabled={!name || !start || !end}
            className="px-4 py-2 bg-[#0d9488] text-white text-sm rounded-md hover:bg-[#0f766e] disabled:opacity-50">Create Cycle</button>
        </div>
      </div>
    </div>
  );
}
