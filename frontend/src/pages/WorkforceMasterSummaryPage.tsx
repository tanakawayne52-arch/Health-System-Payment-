import React from 'react';
import { useVhwMasterList } from '../hooks/useData';
import PivotTables from '../components/PivotTables';
import { BarChart3, Download } from 'lucide-react';

const WorkforceMasterSummaryPage: React.FC = () => {
  const [vhwMasterList] = useVhwMasterList();

  const exportAnalytics = () => {
    // Basic export logic placeholder
    console.log('Exporting analytics...');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Workforce Master Summary</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Comprehensive cross-province analytical overview of the VHW workforce</p>
        </div>
        <button 
          onClick={exportAnalytics}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
        >
          <Download className="w-4 h-4" /> Export Analytics
        </button>
      </div>

      <div className="card-professional overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">National Level Pivot Tables</h3>
          </div>
        </div>
        <div className="p-8 overflow-x-auto">
          <PivotTables data={vhwMasterList} />
        </div>
      </div>
    </div>
  );
};

export default WorkforceMasterSummaryPage;
