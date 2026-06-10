import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Search, FileText, Download, Loader2, Lock, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs, apiLogin, recordAuditLogExport } from '@/services/api';

import { PROVINCES, DISTRICTS } from '@/data/mockData';
import { DebouncedSearchInput } from '@/components/DebouncedSearchInput';

const actionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' => {
  switch (action) {
    case 'Create': return 'success';
    case 'Update': return 'secondary';
    case 'Delete': return 'destructive';
    case 'Export': return 'default';
    case 'Transfer': return 'outline';
    default: return 'outline';
  }
};

const SortIcon = ({ column, sortColumn, sortDirection }: { column: string, sortColumn: string, sortDirection: 'asc' | 'desc' }) => {
  if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
};

export default function AuditLog() {
  const { user: currentUser } = useAuth();
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const PAGE_SIZE = 10;

  // Set default jurisdiction filters based on user role
  useEffect(() => {
    if (!currentUser) return;
    
    const isNational = currentUser.role === 'Administrator' || currentUser.role === 'gisp_viewer' || currentUser.role === 'gisp_manager';
    const isProvincial = currentUser.role === 'PICTO_Manager' || currentUser.role === 'PICTO_Viewer' || currentUser.role === 'PHRO';
    const isDistrict = currentUser.role === 'DHRO' || currentUser.role === 'DICTO_Manager' || currentUser.role === 'DICTO_Viewer';
    
    if (!isNational) {
      if (currentUser.province) {
        setFilterProvince(currentUser.province);
      }
      if (isDistrict && currentUser.district) {
        setFilterDistrict(currentUser.district);
      }
    }
  }, [currentUser]);

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['auditLogs', sortColumn, sortDirection, filterProvince, filterDistrict, currentUser?.role],
    queryFn: () => fetchAuditLogs(currentUser!, {
      sort: sortColumn,
      order: sortDirection,
      province: filterProvince,
      district: filterDistrict,
    }),
    enabled: !!currentUser,
    refetchInterval: 900000,
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  const tables = [...new Set(auditLogs.map((l) => l.target_table))];

  const filtered = auditLogs.filter((log) => {
    const matchSearch =
      `${log.user_email} ${log.details} ${log.target_record_id}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = filterAction === 'all' || log.action_type === filterAction;
    const matchTable = filterTable === 'all' || log.target_table === filterTable;
    const matchProvince = filterProvince === 'all' || (log as any).province === filterProvince;
    const matchDistrict = filterDistrict === 'all' || (log as any).district === filterDistrict;
    const logDate = new Date(log.created_at);
    const matchDateFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchDateTo = !dateTo || logDate <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchAction && matchTable && matchProvince && matchDistrict && matchDateFrom && matchDateTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedLogs = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            System Audit Trail
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review all system activities, changes, and access events
          </p>
        </div>
        {(currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_viewer' || currentUser?.role === 'gisp_manager') && (
          <Button variant="outline" size="sm" onClick={() => {
            setExportPassword('');
            setShowExportDialog(true);
          }}>
            <Download className="h-4 w-4 mr-1" /> Export Logs
          </Button>
        )}
      </div>

      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <DebouncedSearchInput
                placeholder="Search by user email, details, or record ID…"
                initialValue={searchTerm}
                onSearch={setSearchTerm}
              />
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Create">Create</SelectItem>
                  <SelectItem value="Update">Update</SelectItem>
                  <SelectItem value="Delete">Delete</SelectItem>
                  <SelectItem value="Export">Export</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  {tables.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* Province filter */}
              <Select value={filterProvince} onValueChange={(v) => { setFilterProvince(v); setFilterDistrict('all'); }} disabled={currentUser?.role !== 'Administrator' && currentUser?.role !== 'gisp_viewer' && currentUser?.role !== 'gisp_manager'}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* District filter */}
              <Select value={filterDistrict} onValueChange={setFilterDistrict} disabled={!filterProvince || (currentUser?.role === 'DHRO')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {(DISTRICTS[filterProvince] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[160px]"
                />
              </div>
               {(dateFrom || dateTo || searchTerm || filterAction !== 'all' || filterTable !== 'all' || filterProvince || filterDistrict) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterAction('all');
                    setFilterTable('all');
                    setDateFrom('');
                    setDateTo('');
                    setFilterProvince('all');
                    setFilterDistrict('all');
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Loading audit logs…</p>
            </div>
          ) : (
            <>
              <div className="px-4 pb-2 pt-2 text-xs text-muted-foreground">
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                        <span className="flex items-center">Date & Time <SortIcon column="created_at" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('user_email')}>
                        <span className="flex items-center">User <SortIcon column="user_email" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('action_type')}>
                        <span className="flex items-center">Action <SortIcon column="action_type" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('target_table')}>
                        <span className="flex items-center">Target <SortIcon column="target_table" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => handleSort('target_record_id')}>
                        <span className="flex items-center">Record ID <SortIcon column="target_record_id" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('details')}>
                        <span className="flex items-center">Details <SortIcon column="details" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No audit log entries match your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                            <span className="text-muted-foreground">{new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                          </TableCell>
                          <TableCell className="text-sm">{log.user_email}</TableCell>
                          <TableCell>
                            <Badge variant={actionBadgeVariant(log.action_type)}>{log.action_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.target_table}</TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-sm">{log.target_record_id}</TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate">{log.details}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} entries
                  </p>
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Password Verification Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Export Audit Logs
            </DialogTitle>
            <DialogDescription>
              Select a date range and verify your identity to export audit log data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={exportDateFrom}
                  onChange={(e) => setExportDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={exportDateTo}
                  onChange={(e) => setExportDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter your password…"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setExportPassword('');
              setExportDateFrom('');
              setExportDateTo('');
              setShowExportDialog(false);
            }}>Cancel</Button>
            <Button onClick={async () => {
              if (!exportPassword) { toast.error('Please enter your password.'); return; }
              try {
                await apiLogin(currentUser!.email, exportPassword);
                
                // Filter logs by date range
                const exportLogs = filtered.filter((log) => {
                  const logDate = new Date(log.created_at);
                  const from = exportDateFrom ? new Date(exportDateFrom) : null;
                  const to = exportDateTo ? new Date(exportDateTo + 'T23:59:59') : null;
                  if (from && logDate < from) return false;
                  if (to && logDate > to) return false;
                  return true;
                });

                // Create CSV content
                const headers = 'Date,User,Action,Target,Record ID,Details\n';
                const exportRows = exportLogs.map((log) =>
                  `"${new Date(log.created_at).toISOString()}","${log.user_email}","${log.action_type}","${log.target_table}","${log.target_record_id}","${log.details}"`
                ).join('\n');
                const blob = new Blob([headers + exportRows], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`Exported ${exportLogs.length} log entries.`);
                
                // Record export action in audit logs
                try {
                  await recordAuditLogExport(exportDateFrom, exportDateTo, exportLogs.length);
                } catch (err) {
                  console.error('Failed to record export in audit logs:', err);
                }
                
                // Reset dialog
                setExportPassword('');
                setExportDateFrom('');
                setExportDateTo('');
                setShowExportDialog(false);
              } catch { toast.error('Incorrect password. Export denied.'); }
            }}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
