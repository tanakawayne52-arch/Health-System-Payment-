import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import type { AuditLog } from '@/types';
import PaginationControls from '@/components/PaginationControls';
import { PAGE_SIZE, defaultPagination, type PaginationMeta } from '@/constants/pagination';
import Badge from '@/components/Badge';
import { Search, Download, X, Eye, Copy, User, Calendar, Shield, Info } from 'lucide-react';

export default function AuditTrailPage() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(defaultPagination());
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    const result = await api.getAuditLogs({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      action: actionFilter !== 'ALL' ? actionFilter : undefined,
      entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
    });
    if (result.success && Array.isArray(result.data)) {
      setLogs(result.data.map(l => ({
        id: l.id,
        userId: l.userId ?? '',
        userName: l.userName,
        userRole: l.userRole,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        oldValues: l.oldValues,
        newValues: l.newValues,
        reason: l.reason,
        ipAddress: l.ipAddress,
        timestamp: l.timestamp,
      })));
      if (result.pagination) setPagination(result.pagination);
    }
    setIsLoading(false);
  }, [page, search, actionFilter, entityFilter]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  const exportLogs = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString(), l.userName, l.userRole, l.action,
      l.entityType, l.entityId, l.reason || '-', l.ipAddress
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-trail.csv';
    a.click();
  };

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'CERTIFY', 'REJECT', 'VALIDATE', 'EXECUTE', 'LOGIN', 'LOGOUT', 'APPROVE_EXCEPTION'];
  const entities = ['PaymentList', 'PaymentBatch', 'Beneficiary', 'PaymentCycle', 'User', 'ExceptionRequest'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-[28px] font-bold text-[#1e293b] leading-tight">Audit Trail</h1>
          <p className="text-sm text-[#475569] mt-0.5">Complete log of all system actions</p>
        </div>
        <button onClick={exportLogs}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-md text-sm font-medium hover:bg-[#f1f5f9] transition-all">
          <Download className="w-4 h-4" /> Export Audit Log
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search user, action, or entity..."
            className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md pl-9 pr-4 py-2 text-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20" />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"><X className="w-4 h-4" /></button>}
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
          <option value="ALL">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-3 py-2 text-sm focus:border-[#0d9488] focus:outline-none">
          <option value="ALL">All Entities</option>
          {entities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a365d]">
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3 w-10"></th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Timestamp</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">User</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Role</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Action</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Entity</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">Details</th>
                <th className="text-left text-[11px] font-semibold text-white uppercase tracking-wide px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#94a3b8]">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#94a3b8]"><p className="text-base font-semibold text-[#1e293b] mb-1">No audit events found</p></td></tr>
              ) : (
                logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr className="border-b border-[#e2e8f0] hover:bg-[rgba(13,148,136,0.03)] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <button onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="p-1 text-[#94a3b8] hover:text-[#0d9488] transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            View details
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <div className="flex items-center gap-1 text-xs text-[#475569] whitespace-nowrap">
                            <Calendar className="w-3 h-3 text-[#0d9488]" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            {new Date(log.timestamp).toLocaleString()}
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <div className="flex items-center gap-1 text-sm text-[#1e293b] font-medium">
                            <User className="w-3 h-3 text-[#0d9488]" />
                            {log.userName}
                          </div>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            User: {log.userName}
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <div className="flex items-center gap-1 text-xs text-[#475569]">
                            <Shield className="w-3 h-3 text-[#0d9488]" />
                            {log.userRole}
                          </div>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            User role
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status={log.action?.toLowerCase() || 'info'}>{log.action}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="relative group/tooltip">
                          <div className="flex items-center gap-1 text-xs text-[#475569]">
                            <span>{log.entityType}</span>
                            <button onClick={() => { navigator.clipboard.writeText(log.entityId); addToast('Entity ID copied to clipboard', 'success'); }} className="text-[#94a3b8] hover:text-[#0d9488] opacity-0 group-hover:opacity-100 transition-opacity">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            ID: {log.entityId}
                            <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#475569] max-w-[150px] truncate">{log.reason || `${log.action} ${log.entityType}`}</td>
                      <td className="px-4 py-3 text-xs text-[#475569] font-mono">{log.ipAddress}</td>
                    </tr>
                    {expandedLog === log.id && (log.oldValues || log.newValues) && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-[#f8fafc]">
                          <div className="mb-3 flex items-center gap-2 pb-2 border-b border-[#e2e8f0]">
                            <Info className="w-4 h-4 text-[#0d9488]" />
                            <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Change Details</span>
                            <span className="text-xs text-[#94a3b8] font-mono ml-auto">{log.entityId}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {log.oldValues && (
                              <div>
                                <p className="text-[10px] font-semibold text-[#dc2626] uppercase mb-1 flex items-center gap-1">Before</p>
                                <pre className="text-xs text-[#475569] bg-white p-2 rounded border border-[#e2e8f0] overflow-auto">{JSON.stringify(log.oldValues, null, 2)}</pre>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <p className="text-[10px] font-semibold text-[#16a34a] uppercase mb-1 flex items-center gap-1">After</p>
                                <pre className="text-xs text-[#475569] bg-white p-2 rounded border border-[#e2e8f0] overflow-auto">{JSON.stringify(log.newValues, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
