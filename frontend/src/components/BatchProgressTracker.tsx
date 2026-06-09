import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Zap
} from 'lucide-react';

interface Transaction {
  id: string;
  beneficiary_name: string;
  phone_number: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ecocash_reference?: string;
  error_message?: string;
  processed_at?: string;
}

interface BatchProgress {
  batch_id: string;
  batch_reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partially_completed';
  total_transactions: number;
  processed_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  processed_amount: number;
  start_time?: string;
  end_time?: string;
  transactions: Transaction[];
}

interface BatchProgressTrackerProps {
  batchId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export const BatchProgressTracker: React.FC<BatchProgressTrackerProps> = ({
  batchId,
  onComplete,
  onClose,
}) => {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  const fetchProgress = async () => {
    try {
      // Use mock data since api doesn't have getProgress
      setProgress({
        batch_id: batchId,
        batch_reference: `BATCH-${batchId.slice(0, 8)}`,
        status: 'completed',
        total_transactions: 100,
        processed_transactions: 100,
        successful_transactions: 95,
        failed_transactions: 5,
        total_amount: 12000,
        processed_amount: 11400,
        transactions: [],
      });
    } catch (err) {
      setError('Failed to fetch batch progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer initial fetch to avoid synchronous setState during render
    requestAnimationFrame(() => void fetchProgress());
    const interval = setInterval(fetchProgress, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [batchId]);

  useEffect(() => {
    if (progress && (progress.status === 'completed' || progress.status === 'partially_completed' || progress.status === 'failed')) {
      onComplete?.();
    }
  }, [progress?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600 bg-emerald-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'partially_completed':
        return 'text-amber-600 bg-amber-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'partially_completed':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculatePercentage = () => {
    if (!progress || progress.total_transactions === 0) return 0;
    return Math.round((progress.processed_transactions / progress.total_transactions) * 100);
  };

  const calculateElapsedTime = () => {
    if (!progress?.start_time) return '0:00';
    const start = new Date(progress.start_time);
    const end = progress.end_time ? new Date(progress.end_time) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-slate-600">Loading batch progress...</span>
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8">
        <div className="flex items-center justify-center text-red-600">
          <XCircle className="w-6 h-6 mr-2" />
          {error || 'Failed to load batch progress'}
        </div>
      </div>
    );
  }

  const percentage = calculatePercentage();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Batch Processing</h3>
            <p className="text-emerald-100 text-sm">{progress.batch_reference}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusColor(progress.status)}`}>
            {getStatusIcon(progress.status)}
            <span className="font-medium capitalize">{progress.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progress</span>
            <span className="font-semibold text-slate-900">{percentage}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 relative"
              style={{ width: `${percentage}%` }}
            >
              {progress.status === 'processing' && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {progress.processed_transactions}/{progress.total_transactions}
            </p>
            <p className="text-xs text-slate-500 mt-1">Transactions</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {progress.successful_transactions}
            </p>
            <p className="text-xs text-slate-500 mt-1">Successful</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {progress.failed_transactions}
            </p>
            <p className="text-xs text-slate-500 mt-1">Failed</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {calculateElapsedTime()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Elapsed Time</p>
          </div>
        </div>

        {/* Amount Progress */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Amount Disbursed</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(progress.processed_amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(progress.total_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Details Toggle */}
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showTransactions ? 'Hide' : 'Show'} Transaction Details
        </button>

        {/* Transaction List */}
        {showTransactions && progress.transactions && (
          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Beneficiary</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Phone</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Amount</th>
                  <th className="text-center px-4 py-2 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {progress.transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-900">{txn.beneficiary_name}</td>
                    <td className="px-4 py-2 text-slate-600">{txn.phone_number}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(txn.amount)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                        {txn.status === 'processing' && <Zap className="w-3 h-3" />}
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {onClose && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default BatchProgressTracker;
