import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  ChevronDown,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react';
import { api } from '../lib/api';

interface ExportOptions {
  format: 'pdf' | 'excel';
  type: 'batch' | 'transactions' | 'beneficiaries' | 'summary';
  filters?: {
    startDate?: string;
    endDate?: string;
    province?: string;
    district?: string;
    status?: string;
    batchId?: string;
  };
}

interface ExportReportsProps {
  defaultFilters?: ExportOptions['filters'];
  availableTypes?: ExportOptions['type'][];
}

export const ExportReports: React.FC<ExportReportsProps> = ({
  defaultFilters,
  availableTypes = ['batch', 'transactions', 'beneficiaries', 'summary'],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'excel',
    type: 'transactions',
    filters: defaultFilters || {},
  });

  const exportTypes = [
    { value: 'batch', label: 'Payment Batches', description: 'Export batch summaries and status' },
    { value: 'transactions', label: 'Transactions', description: 'Detailed transaction records' },
    { value: 'beneficiaries', label: 'Beneficiaries', description: 'List of all beneficiaries' },
    { value: 'summary', label: 'Summary Report', description: 'Overview with charts and stats' },
  ].filter(t => availableTypes.includes(t.value as ExportOptions['type']));

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let blob: Blob;
      let filename: string;

      switch (options.type) {
        case 'batch':
          // For now, use a mock since api doesn't have batchReport
          blob = new Blob(['Mock batch report'], { type: 'text/plain' });
          filename = `batch-report.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'transactions':
          // Mock
          blob = new Blob(['Mock transactions report'], { type: 'text/plain' });
          filename = `transactions-${new Date().toISOString().split('T')[0]}.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'beneficiaries':
          blob = await api.exportBeneficiariesExcel(options.filters?.province, undefined);
          filename = `beneficiaries.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'summary':
          // Mock
          blob = new Blob(['Mock summary report'], { type: 'text/plain' });
          filename = `summary-report-${new Date().toISOString().split('T')[0]}.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="font-medium">Export</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Export Report</h3>
            <p className="text-sm text-slate-500 mt-1">Download data in your preferred format</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Report Type
              </label>
              <div className="space-y-2">
                {exportTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      options.type === type.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportType"
                      value={type.value}
                      checked={options.type === type.value}
                      onChange={(e) => setOptions(prev => ({ 
                        ...prev, 
                        type: e.target.value as ExportOptions['type'] 
                      }))}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{type.label}</p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOptions(prev => ({ ...prev, format: 'excel' }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    options.format === 'excel'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="font-medium">Excel</span>
                </button>
                <button
                  onClick={() => setOptions(prev => ({ ...prev, format: 'pdf' }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    options.format === 'pdf'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">PDF</span>
                </button>
              </div>
            </div>

            {/* Date Range (optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    value={options.filters?.startDate || ''}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      filters: { ...prev.filters, startDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Start date"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={options.filters?.endDate || ''}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      filters: { ...prev.filters, endDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <X className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                Export completed successfully!
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportReports;
