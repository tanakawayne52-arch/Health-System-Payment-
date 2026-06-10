import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/pagination';
import { Search, Plus, Filter, Download, Upload, Landmark, Eye, Pencil, Trash2, X, Loader2, Activity, ArrowUpDown, ArrowUp, ArrowDown, Lock, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react';
import { PhysicalFacility, FACILITY_TYPES } from '@/data/mockData';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPhysicalFacilities, createPhysicalFacility, updatePhysicalFacility, deletePhysicalFacility, fetchProvinces, fetchFacilityTypes, apiLogin, fetchRoles } from '@/services/api';
import { parseCSV } from '@/utils/csvParser';
import { CSVUploadProgress, UploadSummary } from '@/components/CSVUploadProgress';
import { SearchableMultiSelectFilter } from '@/components/SearchableMultiSelectFilter';
import { DebouncedSearchInput } from '@/components/DebouncedSearchInput';


const SortIcon = ({ column, sortColumn, sortDirection }: { column: string, sortColumn: string, sortDirection: 'asc'|'desc' }) => {
  if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
};

const emptyForm = {
  facility_name: '', facility_code: '', province: '', district: '',
  facility_type: '', description: '', address: '', latitude: '', longitude: '',
};

const FormFields = ({ 
  data, 
  onChange, 
  currentUser, 
  provinces, 
  facilityTypes 
}: { 
  data: any; 
  onChange: (d: any) => void;
  currentUser: any;
  provinces: any[];
  facilityTypes: any[];
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Facility Name *</Label>
      <Input value={data.facility_name ?? ''} onChange={(e) => onChange({ ...data, facility_name: e.target.value })} placeholder="e.g. Rutore Clinic" />
    </div>
    <div className="space-y-2">
      <Label>Facility Code *</Label>
      <Input value={data.facility_code ?? ''} onChange={(e) => onChange({ ...data, facility_code: e.target.value })} placeholder="e.g. RTC001" />
    </div>
    <div className="space-y-2">
      <Label>Facility Type</Label>
      <Select value={data.facility_type ?? ''} onValueChange={(v) => onChange({ ...data, facility_type: v })}>
        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
        <SelectContent>
          {facilityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Province *</Label>
      <Combobox
        options={provinces
          .filter(p => currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_viewer' || currentUser?.role === 'gisp_manager' || p.name === currentUser?.province)
          .map((p) => ({ label: p.name, value: p.name }))}
        value={data.province}
        onChange={(v) => {
          const inNewProv = provinces.find(p => p.name === v)?.districts.includes(data.district);
          onChange({ ...data, province: v, district: inNewProv ? data.district : '' });
        }}
        placeholder="Search province..."
        disabled={currentUser?.role !== 'Administrator' && currentUser?.role !== 'gisp_viewer' && currentUser?.role !== 'gisp_manager'}
      />
    </div>
      <div className="space-y-2">
        <Label>District</Label>
        <Combobox
          options={(data.province ? (provinces.find((p) => p.name === data.province)?.districts || []) : (provinces.length > 0 ? provinces.flatMap(p => p.districts) : []))
            .sort()
            .map((d) => ({ label: d, value: d }))}
          value={data.district ?? ''}
        onChange={(v) => {
          const prov = provinces.find(p => p.districts.includes(v))?.name || data.province;
          onChange({ ...data, district: v, province: prov });
        }}
        placeholder="Search district..."
        disabled={currentUser?.role && currentUser.role.startsWith('DICTO')}
      />

    </div>
    <div className="space-y-2">
      <Label>Physical Address</Label>
      <Input value={data.address ?? ''} onChange={(e) => onChange({ ...data, address: e.target.value })} placeholder="Street or area name" />
    </div>
    <div className="space-y-2 sm:col-span-2">
      <Label>Description</Label>
      <Textarea value={data.description ?? ''} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="Brief description of the facility" rows={3} />
    </div>
  </div>
);

export default function PhysicalFacilities() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvince, setFilterProvince] = useState<string[]>([]);
  const [filterDistrict, setFilterDistrict] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const isProvincialRestricted = currentUser?.role?.startsWith('PICTO') || currentUser?.role === 'PHRO';
  const isDistrictRestricted = currentUser?.role?.startsWith('DICTO') || currentUser?.role === 'DHRO';

  useEffect(() => {
    if (currentUser) {
      if (isDistrictRestricted) {
        if (currentUser.province) setFilterProvince([currentUser.province]);
        if (currentUser.district) setFilterDistrict([currentUser.district]);
      } else if (isProvincialRestricted) {
        if (currentUser.province) setFilterProvince([currentUser.province]);
      }
    }
  }, [currentUser, isProvincialRestricted, isDistrictRestricted]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: facilitiesData, isLoading, isFetching, error } = useQuery({
    queryKey: ['physicalFacilities', currentUser?.role, currentUser?.province, currentUser?.district, searchTerm, currentPage, pageSize, filterProvince, filterDistrict, filterType, sortColumn, sortDirection],
    queryFn: () => fetchPhysicalFacilities(currentUser!, {
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      province: filterProvince.join(','),
      district: filterDistrict.join(','),
      facility_type: filterType.join(','),
      sort: sortColumn,
      order: sortDirection
    }),
    staleTime: 30000, // Cache for 30 seconds to reduce refetches
    refetchOnWindowFocus: false,
    refetchInterval: 900000, // Poll every 15 minutes
  });

  
  const facilities = facilitiesData?.results || [];
  const totalFacilities = facilitiesData?.total || 0;
  
    const totalPages = Math.max(1, Math.ceil(totalFacilities / pageSize));
  
  
  // Background loading logic
   useEffect(() => {
     if (facilitiesData && currentPage === 1 && totalPages > 1) {
       // Prefetch more pages in the background (up to 50 pages)
       const maxPrefetch = Math.min(totalPages, 50);
       for (let p = 2; p <= maxPrefetch; p++) {
         queryClient.prefetchQuery({
           queryKey: ['physicalFacilities', currentUser?.role, currentUser?.province, currentUser?.district, searchTerm, p, pageSize, filterProvince, filterDistrict, filterType, sortColumn, sortDirection],
           queryFn: () => fetchPhysicalFacilities(currentUser!, {
             page: p,
             limit: pageSize,
             search: searchTerm,
             province: filterProvince.join(','),
             district: filterDistrict.join(','),
             facility_type: filterType.join(','),
             sort: sortColumn,
             order: sortDirection
           }),
         });
       }
     }
   }, [facilitiesData, currentPage, totalPages, queryClient, currentUser, searchTerm, pageSize, filterProvince, filterDistrict, filterType, sortColumn, sortDirection]);

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: fetchProvinces,
  });

  const { data: facilityTypes = [] } = useQuery({
    queryKey: ['facilityTypes'],
    queryFn: fetchFacilityTypes,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => fetchRoles(),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [viewFacility, setViewFacility] = useState<PhysicalFacility | null>(null);
  const [editFacility, setEditFacility] = useState<PhysicalFacility | null>(null);
  const [deleteFac, setDeleteFac] = useState<PhysicalFacility | null>(null);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  
  const [uploadState, setUploadState] = useState({
    isOpen: false,
    fileName: '',
    total: 0,
    current: 0,
    success: 0,
    skipped: 0,
    errors: [] as string[]
  });
  const [isCsvProcessing, setIsCsvProcessing] = useState(false);
  const uploadAbortRef = useRef({ aborted: false });
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [pendingFileData, setPendingFileData] = useState<{ name: string, rows: any[] } | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    province: currentUser?.province || '',
    district: currentUser?.district || '',
  });

  const isViewer = currentUser?.role === 'PICTO_Viewer' || currentUser?.role === 'DICTO_Viewer' || currentUser?.role === 'PHRO' || currentUser?.role === 'DHRO';
  const isManager = currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_manager' || currentUser?.role === 'PICTO_Manager' || currentUser?.role === 'DICTO_Manager';

  const filtered = React.useMemo(() => {
    return facilities.filter((f) => {
      if (filterProvince.length > 0 && !filterProvince.includes(f.province)) return false;
      if (filterDistrict.length > 0 && !filterDistrict.includes(f.district)) return false;
      if (filterType.length > 0 && !filterType.includes(f.facility_type)) return false;
      return true;
    });
  }, [facilities, filterProvince, filterDistrict, filterType]);

  // Sorting logic with query invalidation
  const handleSort = (column: string) => {
    setSortColumn(prev => {
      if (prev === column) {
        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDirection('asc');
      return column;
    });
    setCurrentPage(1);
    // Invalidate query to force refetch with new sort
    queryClient.invalidateQueries({ queryKey: ['physicalFacilities'] });
  };

  const refetch = () => {
  console.log('Manual refetch triggered...');
  queryClient.invalidateQueries({ queryKey: ['physicalFacilities'] });
  queryClient.refetchQueries({ queryKey: ['physicalFacilities'] });
};

  const handleAdd = async () => {
    if (!form.facility_name || !form.facility_code || !form.province) {
      toast.error('Please complete all required fields.');
      return;
    }
    try {
      await createPhysicalFacility(form);
      setForm(emptyForm);
      setAddOpen(false);
      toast.success(`${form.facility_name} has been registered in the facility registry.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create facility.');
    }
  };

  const handleEdit = async () => {
    if (!editFacility) return;
    if (!editFacility.facility_name || !editFacility.facility_code || !editFacility.province) {
      toast.error('Please complete all required fields.');
      return;
    }
    try {
      await updatePhysicalFacility(editFacility);
      setEditFacility(null);
      toast.success('Facility record updated successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update facility.');
    }
  };

  const handleDelete = async () => {
    if (!deleteFac) return;
    try {
      await deletePhysicalFacility(deleteFac.id);
      setDeleteFac(null);
      toast.success('Facility record has been removed from the registry.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete facility.');
    }
  };

  const handleDownloadTemplate = () => {
    const headers = 'facility_code,facility_name,facility_type,province,district,description,address\n';
    const example = 'RTC001,Rutore Clinic,Rural Health Centre,Manicaland,Mutare,Primary healthcare facility,Rutore Village\n';
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'physical_facilities_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully.');
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) { 
        toast.error('CSV file appears to be empty or invalid.'); 
        return; 
      }
      
      setPendingFileData({ name: file.name, rows });
      setShowIntentModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processCsvUpload = async (intent: 'create' | 'update') => {
    if (!pendingFileData || isCsvProcessing) return;
    setShowIntentModal(false);
    uploadAbortRef.current.aborted = false;
    setIsCsvProcessing(true);

    const { name, rows } = pendingFileData;
    const totalLines = rows.length;

    setUploadState({
      isOpen: true,
      fileName: name,
      total: totalLines,
      current: 0,
      success: 0,
      skipped: 0,
      errors: []
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    
    let successCount = 0;
    let skippedCount = 0;
    const errorsList: string[] = [];
    const BATCH_SIZE = 5;

    const processBatch = async (batchRows: any[], startIdx: number) => {
      const promises = batchRows.map(async (row, i) => {
        const lineNum = startIdx + i + 1;
        try {
          const facilityCode = (row.facility_code || row['Facility Code'])?.toUpperCase();
          const facilityName = row.facility_name || row['Facility Name'];
          
          if (!facilityCode) throw new Error(`Missing Facility Code.`);

          // Logic A: Register New Records
          if (intent === 'create') {
            const existing = facilities.find(f => f.facility_code.toUpperCase() === facilityCode);
            if (existing) throw new Error(`Facility ${facilityCode} already exists.`);
          }

          // Logic B: Update Existing Data
          let existingId = '';
          if (intent === 'update') {
            const existing = facilities.find(f => f.facility_code.toUpperCase() === facilityCode);
            if (!existing) throw new Error(`Facility ${facilityCode} not found for update.`);
            existingId = existing.id;
          }

          const facilityData = {
            id: existingId,
            facility_name: facilityName || (intent === 'update' ? undefined : ''),
            facility_code: facilityCode,
            facility_type: row.facility_type || row['Facility Type'] || (intent === 'update' ? undefined : 'Clinic'),
            province: row.province || row['Province'] || (intent === 'update' ? undefined : ''),
            district: row.district || row['District'] || (intent === 'update' ? undefined : ''),
            address: row.address || row['Address'] || (intent === 'update' ? undefined : ''),
            description: row.description || row['Description'] || (intent === 'update' ? undefined : ''),
            latitude: row.latitude || null,
            longitude: row.longitude || null
          };

          if (intent === 'create') {
            await createPhysicalFacility(facilityData);
          } else {
            const updateData = Object.fromEntries(Object.entries(facilityData).filter(([_, v]) => v !== undefined));
            await updatePhysicalFacility(updateData);
          }
          successCount++;
        } catch (err: any) {
          skippedCount++;
          errorsList.push(`Row ${lineNum}: ${err.message}`);
        }
      });
      await Promise.all(promises);
    };

    for (let i = 0; i < totalLines; i += BATCH_SIZE) {
      if (uploadAbortRef.current.aborted) break;

      const batch = rows.slice(i, i + BATCH_SIZE);
      await processBatch(batch, i);
      setUploadState(prev => ({
        ...prev,
        current: Math.min(i + BATCH_SIZE, totalLines),
        success: successCount,
        skipped: skippedCount,
        errors: errorsList.slice(0, 250)
      }));
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    setIsCsvProcessing(false);
    setPendingFileData(null);
    refetch();

    if (!uploadAbortRef.current.aborted) {
      setUploadSummary({ total: totalLines, success: successCount, skipped: skippedCount, errors: errorsList.slice(0, 500) });
    } else {
      setUploadSummary({ total: totalLines, success: successCount, skipped: skippedCount, errors: ['Upload canceled by user'] });
    }

    setUploadState(prev => ({ ...prev, isOpen: false }));
  };

  const clearFilters = () => { 
    if (isDistrictRestricted) {
      setFilterProvince(currentUser?.province ? [currentUser.province] : []);
      setFilterDistrict(currentUser?.district ? [currentUser.district] : []);
    } else if (isProvincialRestricted) {
      setFilterProvince(currentUser?.province ? [currentUser.province] : []);
      setFilterDistrict([]);
    } else {
      setFilterProvince([]);
      setFilterDistrict([]);
    }
    setFilterType([]);
  };
  const activeFilters = [filterProvince, filterDistrict, filterType].reduce((a, b) => a + b.length, 0);

  // Direct search handling - DebouncedSearchInput handles debouncing
  const handleSearchChange = (val: string) => { 
    setSearchTerm(val); 
    setCurrentPage(1); 
  };
  
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPassword, setExportPassword] = useState('');


  const paginatedRows = filtered;

  const handleExportRequest = () => {
    if (currentUser?.role !== 'Administrator' && currentUser?.role !== 'gisp_manager') {
      toast.error('Only Administrators can export data.');
      return;
    }
    setExportPassword('');
    setShowExportDialog(true);
  };

  const handleExportConfirm = async () => {
    if (!exportPassword) {
      toast.error('Please enter your password to verify.');
      return;
    }
    try {
      await apiLogin(currentUser!.email, exportPassword);
      const headers = 'Facility Code,Facility Name,Type,Province,District,Address,Description\n';
      const rows = filtered.map((f) =>
        `"${f.facility_code}","${f.facility_name}","${f.facility_type}","${f.province}","${f.district}","${f.address || ''}","${f.description || ''}"`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `physical_facilities_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} physical facilities.`);
      setShowExportDialog(false);
    } catch {
      toast.error('Incorrect password. Export denied.');
    }
  };

  const scopeLabel = (currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_viewer' || currentUser?.role === 'gisp_manager')
    ? 'all provinces'
    : currentUser?.role?.startsWith('PICTO')
    ? `${currentUser.province} province`
    : `${currentUser.district} district`;



  if (error) {
    console.error('Physical facilities query error:', error);
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <p className="text-lg font-medium">Error loading facilities</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }





  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
              <h1 className="page-header flex items-center gap-2">
                <Landmark className="h-6 w-6 text-primary" />
                Physical Facilities Registry
                {/* removed isFetching spinner to avoid polling flicker */}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isViewer ? `Viewing facility registry for ${scopeLabel} (read-only)` : `National registry of healthcare facilities across ${scopeLabel}`}
              </p>
            </div>
          {isManager && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" /> Download Template
              </Button>
              {(currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_viewer' || currentUser?.role === 'gisp_manager') && (
                <Button variant="outline" size="sm" onClick={handleExportRequest}>
                  <Download className="h-4 w-4 mr-1" /> Export Data
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Upload CSV
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setForm(emptyForm)}>
                    <Plus className="h-4 w-4 mr-1" /> Register Facility
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Register Physical Facility</DialogTitle>
                    <DialogDescription>Add a new healthcare facility to the national registry. Fields marked with * are required.</DialogDescription>
                  </DialogHeader>
                  <FormFields 
                    data={form} 
                    onChange={setForm} 
                    currentUser={currentUser}
                    provinces={provinces}
                    facilityTypes={facilityTypes}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd}>Register Facility</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <DebouncedSearchInput 
                  placeholder="Search by facility name, code, or province…" 
                  initialValue={searchTerm} 
                  onSearch={(val: string) => { 
                    setSearchTerm(val); 
                    setCurrentPage(1); 
                  }} 
                />
              </div>
              <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-1" /> Filters {activeFilters > 0 && `(${activeFilters})`}
              </Button>
            </div>
            {showFilters && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Province</Label>
                    <MultiSelectFilter 
                      title="Province"
                      options={[
                        ...provinces.map(p => ({ label: p.name, value: p.name })),
                        { label: 'Blanks', value: '__blanks__' }
                      ]}
                      selected={filterProvince} 
                      onChange={setFilterProvince}
                      disabled={isProvincialRestricted || isDistrictRestricted} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">District</Label>
                    <MultiSelectFilter 
                      title="District"
                      options={[
                        ...(filterProvince.length > 0 
                          ? provinces
                            .filter(p => filterProvince.includes(p.name))
                            .flatMap(p => p.districts)
                          : provinces.flatMap(p => p.districts)
                        )
                        .filter((v, i, a) => a.indexOf(v) === i) // Deduplicate
                        .sort()
                        .map(d => ({ label: d, value: d })),
                        { label: 'Blanks', value: '__blanks__' }
                      ]}
                      selected={filterDistrict} 
                      onChange={setFilterDistrict}
                      disabled={isDistrictRestricted} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Facility Type</Label>
                    <MultiSelectFilter 
                      title="Type"
                      options={[
                        ...(facilityTypes.length > 0 ? facilityTypes : FACILITY_TYPES).map(t => ({ label: t, value: t })),
                        { label: 'Blanks', value: '__blanks__' }
                      ]}
                      selected={filterType} onChange={setFilterType} />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-3 w-3 mr-1" /> Clear All Filters</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && facilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Fetching physical facilities registry…</p>
              </div>
            ) : (
              <>
                <div className="px-4 pb-2 pt-2 text-xs text-muted-foreground">
                  <span>Showing {totalFacilities > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalFacilities)} of {totalFacilities} facilities</span>
                  {isFetching && <span className="flex items-center gap-1 ml-2"><Loader2 className="h-3 w-3 animate-spin" /> Syncing…</span>}
                </div>

                <div className="relative overflow-x-auto">
                  {(isLoading) && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-50 transition-opacity">
                      <div className="bg-card border shadow-lg rounded-xl px-5 py-3 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Loading records…</span>
                      </div>
                    </div>
                  )}
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('facility_code')}>
                          <span className="flex items-center gap-1">Facility Code <SortIcon column="facility_code" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('facility_name')}>
                          <span className="flex items-center gap-1">Facility Name <SortIcon column="facility_name" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('facility_type')}>
                          <span className="flex items-center gap-1">Type <SortIcon column="facility_type" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                        </TableHead>
                        <TableHead className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('province')}>
                          <span className="flex items-center gap-1">Province <SortIcon column="province" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                        </TableHead>
                        <TableHead className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('district')}>
                          <span className="flex items-center gap-1">District <SortIcon column="district" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                        </TableHead>
                       <TableHead className="hidden xl:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('description')}>
                         <span className="flex items-center gap-1">Description <SortIcon column="description" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                       </TableHead>
                      {isManager && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilities.length === 0 ? (
                      <TableRow><TableCell colSpan={isManager ? 7 : 6} className="text-center py-12 text-muted-foreground">No facilities match your search criteria.</TableCell></TableRow>
                    ) : (
                      facilities.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-sm">{f.facility_code}</TableCell>
                          <TableCell className="font-medium">{f.facility_name}</TableCell>
                          <TableCell><Badge variant="outline">{f.facility_type}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{f.province}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{f.district}</TableCell>
                          <TableCell className="hidden xl:table-cell text-sm max-w-[200px] truncate">{f.description}</TableCell>
                          {isManager && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewFacility(f)}><Eye className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditFacility({ ...f })}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDeleteFac(f); setDeleteConfirmed(false); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
                {/* Pagination Controls */}
                {facilities.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Showing {totalFacilities > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalFacilities)} of {totalFacilities} facilities
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

        {/* View */}
        <Dialog open={!!viewFacility} onOpenChange={() => setViewFacility(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Facility Details</DialogTitle>
              <DialogDescription>Registry record for {viewFacility?.facility_name}</DialogDescription>
            </DialogHeader>
            {viewFacility && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Facility Name</p><p className="font-medium">{viewFacility.facility_name}</p></div>
                <div><p className="text-muted-foreground text-xs">Facility Code</p><p className="font-medium font-mono">{viewFacility.facility_code}</p></div>
                <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{viewFacility.facility_type}</p></div>
                <div><p className="text-muted-foreground text-xs">Province</p><p className="font-medium">{viewFacility.province}</p></div>
                <div><p className="text-muted-foreground text-xs">District</p><p className="font-medium">{viewFacility.district}</p></div>
                <div><p className="text-muted-foreground text-xs">Address</p><p className="font-medium">{viewFacility.address || '—'}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs">Description</p><p className="font-medium">{viewFacility.description || '—'}</p></div>
                <div><p className="text-muted-foreground text-xs">Registered On</p><p className="font-medium">{new Date(viewFacility.created_at).toLocaleDateString()}</p></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit */}
        <Dialog open={!!editFacility} onOpenChange={() => setEditFacility(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Facility Record</DialogTitle>
              <DialogDescription>Update details for {editFacility?.facility_name}.</DialogDescription>
            </DialogHeader>
            {editFacility && (
              <FormFields 
                data={editFacility} 
                onChange={setEditFacility} 
                currentUser={currentUser}
                provinces={provinces}
                facilityTypes={facilityTypes}
              />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditFacility(null)}>Cancel</Button>
              <Button onClick={() => {
                if (!editFacility?.facility_name || !editFacility?.facility_code || !editFacility?.province) {
                  toast.error('Please complete all required fields.');
                  return;
                }
                setShowConfirmEdit(true);
              }}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <Dialog open={!!deleteFac} onOpenChange={(open) => { if (!open) setDeleteFac(null); }}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Warning: Permanent Deletion
              </DialogTitle>
              <DialogDescription className="sr-only">
                Confirm facility deletion.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <p className="text-foreground">
                Are you sure you want to permanently remove facility <strong>{deleteFac?.facility_name}</strong> ({deleteFac?.facility_code}) from the registry?
              </p>
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs">
                  Warning: This action is irreversible. The record will be permanently deleted from the database. Any associated data or reference might be affected.
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="confirm-delete-facility" 
                  checked={deleteConfirmed} 
                  onCheckedChange={(checked) => setDeleteConfirmed(!!checked)} 
                />
                <label 
                  htmlFor="confirm-delete-facility" 
                  className="text-xs font-medium leading-none cursor-pointer select-none"
                >
                  I understand this action is permanent and cannot be undone.
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteFac(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={!deleteConfirmed}
              >
                Permanently Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Confirmation */}
        <Dialog open={showConfirmEdit} onOpenChange={setShowConfirmEdit}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Caution: Confirm Update
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to update this facility record? Please verify that all the details are correct.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmEdit(false)}>Cancel</Button>
              <Button onClick={() => {
                setShowConfirmEdit(false);
                handleEdit();
              }}>Yes, Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CSV Upload Progress Overlay */}
        <CSVUploadProgress 
          isOpen={uploadState.isOpen}
          onClose={(summary) => {
            setUploadState(prev => ({ ...prev, isOpen: false }));
            if (summary) {
              setUploadSummary(summary);
              if (summary.success > 0) {
                toast.success(`Upload finished! ${summary.success} records added.`);
              } else {
                toast.error(`Upload completed with ${summary.skipped} skipped rows.`);
              }
            }
            setIsCsvProcessing(false);
          }}
          onCancel={() => {
            uploadAbortRef.current.aborted = true;
            setIsCsvProcessing(false);
            setUploadState(prev => ({ ...prev, isOpen: false }));
            toast.warning('CSV upload interrupted by user.');
          }}
          fileName={uploadState.fileName}
          totalRows={uploadState.total}
          currentRow={uploadState.current}
          successCount={uploadState.success}
          skippedCount={uploadState.skipped}
          errors={uploadState.errors}
        />

        {/* Upload Summary Feedback */}
        <Dialog open={!!uploadSummary} onOpenChange={() => setUploadSummary(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Processing Results
              </DialogTitle>
              <DialogDescription>Summary of the last CSV import attempt.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted p-3 rounded-lg border">
                  <p className="text-2xl font-bold">{uploadSummary?.total}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Processed</p>
                </div>
                <div className="bg-success/10 p-3 rounded-lg text-success border border-success/20">
                  <p className="text-2xl font-bold">{uploadSummary?.success}</p>
                  <p className="text-[10px] text-success/70 uppercase tracking-wider">Successful</p>
                </div>
                <div className="bg-destructive/10 p-3 rounded-lg text-destructive border border-destructive/20">
                  <p className="text-2xl font-bold">{uploadSummary?.skipped}</p>
                  <p className="text-[10px] text-destructive/70 uppercase tracking-wider">Issues</p>
                </div>
              </div>
              
              {uploadSummary?.errors && uploadSummary.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Detailed Error Log
                  </Label>
                  <ScrollArea className="h-[180px] w-full rounded-md border bg-muted/30 p-2">
                    <ul className="text-xs space-y-1.5">
                      {uploadSummary.errors.map((err, i) => (
                        <li key={i} className="text-destructive font-mono bg-destructive/5 p-1 rounded">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setUploadSummary(null)}>Dismiss Feedback</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Intent Selection Modal */}
        <Dialog open={showIntentModal} onOpenChange={setShowIntentModal}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Upload Intent
              </DialogTitle>
              <DialogDescription className="text-base">
                What are you trying to achieve with this file?
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-1 text-left hover:border-primary hover:bg-primary/5 transition-all card-elevated whitespace-normal"
                onClick={() => processCsvUpload('create')}
              >
                <div className="flex items-center gap-2 font-bold text-primary">
                  <Plus className="h-4 w-4" /> Register New Records
                </div>
                <p className="text-xs text-muted-foreground font-normal">
                  Use this if you are adding new healthcare facilities to the registry for the first time. The system will create new records for every Facility Code provided.
                </p>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-1 text-left hover:border-accent hover:bg-accent/5 transition-all card-elevated whitespace-normal"
                onClick={() => processCsvUpload('update')}
              >
                <div className="flex items-center gap-2 font-bold text-accent">
                  <Pencil className="h-4 w-4" /> Update Existing Data
                </div>
                <p className="text-xs text-muted-foreground font-normal">
                  Use this if you are correcting info or changing metadata for existing facilities. The system will look for matching Facility Codes and only update the fields provided in your file.
                </p>
              </Button>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button variant="ghost" onClick={() => { setShowIntentModal(false); setPendingFileData(null); }}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Password Verification Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Verify Identity
              </DialogTitle>
              <DialogDescription>
                You are about to export sensitive facility data. Please enter your password to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter your password…"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExportConfirm()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
              <Button onClick={handleExportConfirm}>Confirm & Export</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}


const MultiSelectFilter = ({ title, options, selected, onChange, disabled }: any) => (
  <SearchableMultiSelectFilter
    title={title}
    options={options}
    selected={selected}
    onChange={onChange}
    searchable={options.length > 8}
    disabled={disabled}
  />
);
