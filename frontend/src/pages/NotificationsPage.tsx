import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, AlertCircle, Clock, CheckCircle2, ChevronRight, Filter } from 'lucide-react';
import Badge from '../components/Badge';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'approval' | 'error' | 'info';
  timestamp: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data for notifications/tasks based on role
  const getTasksByRole = (role: string): Task[] => {
    switch (role) {
      case 'national_admin':
        return [
          { id: '1', title: 'Unlock Request: Mashonaland East', description: 'Exception request from Provincial Officer for Q1 Cycle unlocking.', priority: 'high', type: 'approval', timestamp: '2 hours ago' },
          { id: '2', title: 'System Audit Alert', description: 'Multiple failed login attempts detected from IP 192.168.1.45', priority: 'medium', type: 'error', timestamp: '5 hours ago' },
        ];
      case 'finance_officer':
        return [
          { id: '3', title: 'Batch Validation Required', description: 'Batch "PAY-2026-Q2-HARARE" is ready for final validation.', priority: 'high', type: 'approval', timestamp: '1 hour ago' },
          { id: '4', title: 'Reconciliation Discrepancy', description: 'Difference detected in Matabeleland North Q1 disbursements.', priority: 'high', type: 'error', timestamp: '1 day ago' },
        ];
      case 'provincial_officer':
        return [
          { id: '5', title: 'Payment List Rejected', description: 'Your submitted list for Bulawayo Central was rejected. Reason: Missing ward data.', priority: 'high', type: 'error', timestamp: '3 hours ago' },
          { id: '6', title: 'Submit Q2 Records', description: 'Deadline for Q2 beneficiary record updates is approaching in 3 days.', priority: 'medium', type: 'info', timestamp: '6 hours ago' },
        ];
      default:
        return [
          { id: '7', title: 'System Update', description: 'FEPMS will undergo scheduled maintenance this Sunday at 02:00 CAT.', priority: 'low', type: 'info', timestamp: '1 day ago' },
        ];
    }
  };

  const tasks = getTasksByRole(user?.role || '');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Notifications & Tasks</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Urgent actions and system alerts requiring your attention</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">Filter: Priority</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.length > 0 ? tasks.map((task) => (
          <div key={task.id} className="card-professional p-6 flex items-start gap-5 hover:border-teal-200 transition-all cursor-pointer group">
            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${
              task.priority === 'high' ? 'bg-rose-50 text-rose-500' :
              task.priority === 'medium' ? 'bg-amber-50 text-amber-500' :
              'bg-blue-50 text-blue-500'
            }`}>
              {task.type === 'approval' ? <Clock className="w-6 h-6" /> :
               task.type === 'error' ? <AlertCircle className="w-6 h-6" /> :
               <Bell className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-1">
                <h3 className="text-base font-bold text-slate-900 truncate">{task.title}</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{task.timestamp}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{task.description}</p>
              <div className="flex items-center gap-3">
                <Badge status={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'}>
                  {task.priority.toUpperCase()} PRIORITY
                </Badge>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.type}</span>
              </div>
            </div>

            <div className="self-center p-2 rounded-xl bg-slate-50 text-slate-300 group-hover:text-teal-500 group-hover:bg-teal-50 transition-all">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        )) : (
          <div className="card-professional p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">You're all caught up!</h3>
            <p className="text-slate-500 max-w-sm">There are no urgent tasks or notifications requiring your attention at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
