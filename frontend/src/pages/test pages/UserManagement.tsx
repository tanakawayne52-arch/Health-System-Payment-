import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Search, Plus, Filter, Download, Upload, Users, Eye, EyeOff, Pencil, Trash2, X, Loader2, Activity, AlertCircle, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Lock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Employee } from '@/data/mockData';
import { UserRole } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, fetchProvinces, fetchRoles, fetchFacilities, FacilityEntry } from '@/services/api';
import { parseCSV } from '@/utils/csvParser';
import { CSVUploadProgress, UploadSummary } from '@/components/CSVUploadProgress';
import { SearchableMultiSelectFilter } from '@/components/SearchableMultiSelectFilter';
import { DebouncedSearchInput } from '@/components/DebouncedSearchInput';

const roleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' | 'success' => {
  switch (role) {
    case 'Administrator': return 'default';
    case 'gisp_manager': return 'default';
    case 'PICTO_Manager': case 'PICTO_Viewer': return 'secondary';
    case 'DICTO_Manager': case 'DICTO_Viewer': return 'outline';
    default: return 'outline';
  }
};


const emptyForm = {
  first_name: '', last_name: '', ec_number: '', email: '', backup_email: '', phone_number: '', password: '',
  role: 'General_User' as UserRole, facility: undefined, facility_code: undefined, physical_facilities_id: undefined, province: '', district: '',
  rank_level: 8, is_active: true,
};



const EmployeeFormFields = ({ 
  data, 
  onChange, 
  showStatus, 
  isEdit,
  currentUser, 
  allFacilities, 
  provinces, 
  roles,
  onPasswordChange
}: { 
  data: typeof emptyForm | Employee; 
  onChange: (d: any) => void; 
  showStatus?: boolean;
  isEdit?: boolean;
  currentUser: any;
  allFacilities: any[];
  provinces: any[];
  roles: any[];
  onPasswordChange?: () => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>First Name(s) *</Label>
        <Input value={data.first_name ?? ''} onChange={(e) => onChange({ ...data, first_name: e.target.value })} placeholder="Enter first name(s)" />
      </div>
      <div className="space-y-2">
        <Label>Last Name *</Label>
        <Input value={data.last_name ?? ''} onChange={(e) => onChange({ ...data, last_name: e.target.value })} placeholder="Enter last name" />
      </div>
      <div className="space-y-2">
        <Label>EC Number *</Label>
        <Input value={data.ec_number ?? ''} onChange={(e) => onChange({ ...data, ec_number: e.target.value })} placeholder="e.g. EC009" />
      </div>
      <div className="space-y-2">
        <Label>Email Address *</Label>
        <Input type="email" value={data.email ?? ''} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="user@mohcc.gov.zw" />
      </div>
      <div className="space-y-2">
        <Label>Backup Email <span className="text-xs text-muted-foreground">(Personal)</span></Label>
        <Input type="email" value={data.backup_email ?? ''} onChange={(e) => onChange({ ...data, backup_email: e.target.value })} placeholder="e.g. personal@gmail.com" />
      </div>
      <div className="space-y-2">
        <Label>Phone Number</Label>
        <Input value={data.phone_number ?? ''} onChange={(e) => onChange({ ...data, phone_number: e.target.value })} placeholder="e.g. +263 770 000 000" />
      </div>
      {!isEdit && (
        <div className="space-y-2">
          <Label>Password *</Label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              value={data.password} 
              onChange={(e) => onChange({ ...data, password: e.target.value })} 
              placeholder="Set account password" 
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}
      {/* Role selection: Administrators, PICTO Managers, and DICTO Managers can change roles/ranks */}
      {(currentUser?.role === 'Administrator' || currentUser?.role === 'PICTO_Manager' || currentUser?.role === 'DICTO_Manager') && (
        <div className="space-y-2">
          <Label>System Role</Label>
          <Select 
            value={data.role || 'General_User'} 
            onValueChange={(v) => onChange({ ...data, role: v as UserRole })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles
                .filter(r => {
                  if (currentUser?.role === 'Administrator') return true;
                  const myRank = roles.find(x => x.role_key === currentUser?.role)?.rank_level || 99;
                  return r.rank_level > myRank;
                })
                .map((r) => (
                  <SelectItem key={r.id} value={r.role_key}>{r.role_name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(currentUser?.role !== 'Administrator' && currentUser?.role !== 'PICTO_Manager' && currentUser?.role !== 'DICTO_Manager') && (
        <div className="space-y-2">
          <Label>System Role</Label>
          <Input value={roles.find(r => r.role_key === data.role)?.role_name || data.role || 'General User'} disabled className="bg-muted/50" />
          <p className="text-[10px] text-muted-foreground italic">Role modification restricted to higher-level managers.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Facility Code {currentUser?.role === 'gisp_manager' ? <span className="text-xs text-muted-foreground">(optional)</span> : '*'}</Label>
        <Input 
          value={data.facility_code || ''} 
          onChange={(e) => {
            const code = e.target.value;
            const f = allFacilities.find(x => x.facility_code.toUpperCase() === code.toUpperCase());
            if (f) {
              onChange({ 
                ...data, 
                facility_code: code, 
                facility: f.facility_name, 
                physical_facilities_id: String(f.id), 
                province: f.province, 
                district: f.district 
              });
            } else {
              onChange({ ...data, facility_code: code, physical_facilities_id: undefined, facility: undefined });
            }
          }}
          placeholder="e.g. RTC001" 
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Facility Name</Label>
        <Combobox
          options={allFacilities
            .filter(f => (!data.province || f.province === data.province) && (!data.district || f.district === data.district))
            .map(f => ({ label: f.facility_name, value: String(f.id) }))}
          value={String(data.physical_facilities_id || '')}
          onChange={(id) => {
            const f = allFacilities.find(x => String(x.id) === id);
            if (f) {
              onChange({ 
                ...data, 
                physical_facilities_id: String(f.id), 
                facility: f.facility_name, 
                facility_code: f.facility_code,
                province: f.province,
                district: f.district
              });
            } else {
              onChange({ ...data, physical_facilities_id: undefined, facility: undefined, facility_code: undefined });
            }
          }}
          placeholder="Select facility..."
        />
      </div>
      <div className="space-y-2">
        <Label>Province</Label>
        <Combobox
          options={provinces
            .filter(p => currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_manager' || p.name === currentUser?.province)
            .map((p) => ({ label: p.name, value: p.name }))}
          value={data.province || ''}
          onChange={(v) => {
            const inNewProv = (provinces.find(p => p.name === v)?.districts || []).includes(data.district);
            const district = inNewProv ? data.district : '';
            const facility_id = inNewProv && data.physical_facilities_id && allFacilities.some(f => String(f.id) === data.physical_facilities_id && f.province === v) ? data.physical_facilities_id : '';
            onChange({ ...data, province: v, district, physical_facilities_id: facility_id, facility_code: facility_id ? data.facility_code : '' });
          }}
          placeholder="Search province..."
          disabled={currentUser?.role !== 'Administrator' && currentUser?.role !== 'gisp_manager'}
        />
      </div>
      <div className="space-y-2">
        <Label>District <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Combobox
          options={(data.province ? (provinces.find((p) => p.name === data.province)?.districts || []) : (provinces.length > 0 ? provinces.flatMap(p => p.districts) : []))
            .sort()
            .map((d) => ({ label: d, value: d }))}
          value={data.district || ''}
          onChange={(v) => {
            const prov = provinces.find(p => p.districts.includes(v))?.name || data.province;
            const currentFacilityInNewDist = allFacilities.find(f => String(f.id) === data.physical_facilities_id && f.district === v);
            onChange({ 
              ...data, 
              district: v, 
              province: prov, 
              physical_facilities_id: currentFacilityInNewDist ? String(currentFacilityInNewDist.id) : '',
              facility_code: currentFacilityInNewDist ? currentFacilityInNewDist.facility_code : '',
              facility: currentFacilityInNewDist ? currentFacilityInNewDist.facility_name : ''
            });
          }}
          placeholder={data.province ? "Search district..." : "Select a province first"}
          disabled={!data.province}
        />
      </div>
      {isEdit && onPasswordChange && (
        <div className="sm:col-span-2">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full justify-start text-primary border-primary hover:bg-primary/5"
            onClick={onPasswordChange}
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </div>
      )}
      {showStatus && 'is_active' in data && (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 col-span-1 sm:col-span-2">
          <div className="space-y-0.5">
            <Label>Active Status</Label>
            <p className="text-xs text-muted-foreground">Toggle to enable or disable this account.</p>
          </div>
          <Switch checked={data.is_active} onCheckedChange={(c) => onChange({ ...data, is_active: c })} />
        </div>
      )}
    </div>
  );
};
const SortIcon = ({ column, sortColumn, sortDirection }: { column: string, sortColumn: string, sortDirection: 'asc'|'desc' }) => {
  if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: fetchProvinces,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => fetchRoles(),
  });

  const { data: allFacilities = [] } = useQuery<FacilityEntry[]>({
    queryKey: ['allFacilities'],
    queryFn: () => fetchFacilities(),
  });

  const [filterProvince, setFilterProvince] = useState<string[]>([]);
  const [filterDistrict, setFilterDistrict] = useState<string[]>([]);
  const [filterFacility, setFilterFacility] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employeesData, isLoading, isFetching, refetch: refetchEmployeesData } = useQuery({
    queryKey: ['employees', currentUser?.role, currentUser?.province, currentUser?.district, searchTerm, currentPage, pageSize, filterProvince, filterDistrict, filterRole, filterStatus, filterFacility, sortColumn, sortDirection],
    queryFn: () => fetchEmployees(currentUser!, { 
       page: currentPage, 
       limit: pageSize, 
       search: searchTerm,
       province: filterProvince.join(','),
       district: filterDistrict.join(','),
       role_key: filterRole.join(','),
       facility: filterFacility.join(','),
       is_active: filterStatus.includes('active') && filterStatus.includes('inactive') ? undefined : filterStatus.includes('active') ? 1 : filterStatus.includes('inactive') ? 0 : undefined,
       sort: sortColumn,
       order: sortDirection
    }),
    enabled: !!currentUser,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchInterval: 900000, // Poll every 15 minutes

  });

  const employees: Employee[] = useMemo(() => employeesData?.results || [], [employeesData]);
  const totalEmployees = employeesData?.total || 0;
  const totalPages = Math.ceil(totalEmployees / pageSize);

  // Background loading logic
   useEffect(() => {
     if (employeesData && currentPage === 1 && totalPages > 1) {
       // Prefetch more pages in the background (up to 50 pages)
       const maxPrefetch = Math.min(totalPages, 50);
       for (let p = 2; p <= maxPrefetch; p++) {
         queryClient.prefetchQuery({
           queryKey: ['employees', currentUser?.role, currentUser?.province, currentUser?.district, searchTerm, p, pageSize, filterProvince, filterDistrict, filterRole, filterStatus, filterFacility, sortColumn, sortDirection],
           queryFn: () => fetchEmployees(currentUser!, { 
              page: p, 
              limit: pageSize, 
              search: searchTerm,
              province: filterProvince.join(','),
              district: filterDistrict.join(','),
              role_key: filterRole.join(','),
              facility: filterFacility.join(','),
              is_active: filterStatus.includes('active') && filterStatus.includes('inactive') ? undefined : filterStatus.includes('active') ? 1 : filterStatus.includes('inactive') ? 0 : undefined,
              sort: sortColumn,
              order: sortDirection
           }),
         });
       }
     }
   }, [employeesData, currentPage, totalPages, queryClient, currentUser, searchTerm, pageSize, filterProvince, filterDistrict, filterRole, filterStatus, filterFacility, sortColumn, sortDirection]);

  // Export password dialog
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPassword, setExportPassword] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [passwordChangeEmp, setPasswordChangeEmp] = useState<Employee | null>(null);
  const [showConfirmPasswordChange, setShowConfirmPasswordChange] = useState(false);
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  const [deleteEmp, setDeleteEmp] = useState<Employee | null>(null);
  const [uploadIntent, setUploadIntent] = useState<'create' | 'update' | null>(null);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [pendingFileData, setPendingFileData] = useState<{ name: string, rows: any[] } | null>(null);

  const [form, setForm] = useState({
    ...emptyForm,
    province: currentUser?.province || '',
    district: currentUser?.district || '',
  });

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

  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{ id: string; password?: string; error?: string } | null>(null);
  const [isRevealingPassword, setIsRevealingPassword] = useState(false);
  const isViewer = currentUser?.role === 'PICTO_Viewer' || currentUser?.role === 'DICTO_Viewer' || currentUser?.role === 'PHRO' || currentUser?.role === 'DHRO';

    const [duplicateUserError, setDuplicateUserError] = useState<{
      show: boolean;
      duplicate_field?: string;
      field_value?: string;
      existing_employee_id?: number;
      attempted_name?: string;
    }>({ show: false });
  const isManager = currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_manager' || currentUser?.role === 'PICTO_Manager' || currentUser?.role === 'DICTO_Manager';
  const showActions = isManager || currentUser?.role === 'PHRO' || currentUser?.role === 'DHRO';
  const canSeePasswords = true; // Everyone can view plain passwords / verified codes

  // Since we are doing server side search/page, we can just use the results directly
  // or apply minor client-side filtering if needed for the current chunk.
  const facilityOptions = useMemo(() => {
    const set = new Set<string>();
    allFacilities.forEach(f => {
      if (filterProvince.length > 0 && !filterProvince.includes(f.province)) return;
      if (filterDistrict.length > 0 && !filterDistrict.includes(f.district)) return;
      if (f.facility_name) set.add(f.facility_name);
    });
    return Array.from(set).sort().map(s => ({ label: s, value: s }));
  }, [allFacilities, filterProvince, filterDistrict]);
  const filtered = employees;

  // Quick search with immediate results
  const handleSearchChange = (val: string) => { 
    setSearchInput(val);
    setSearchTerm(val); 
    setCurrentPage(1);
  };
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (val: string[]) => { 
    setter(val); 
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['employees'] });

  const handlePasswordChange = async () => {
    if (!passwordChangeEmp || !passwordForm.newPassword) return;

    try {
      await updateEmployee({
        ...passwordChangeEmp,
        password: passwordForm.newPassword
      });
      setPasswordChangeEmp(null);
      setShowPasswordChangeForm(false);
      setShowConfirmPasswordChange(false);
      setPasswordForm({
        newPassword: '',
        confirmPassword: '',
        showPassword: false,
        showConfirmPassword: false
      });
      toast.success(`Password for ${passwordChangeEmp.first_name} has been updated.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.');
    }
  };

  const capitalize = (s: string) => (s || '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const handleAdd = async () => {
    // GISP managers are allowed to register personnel without facility/station details.
    if (currentUser?.role === 'gisp_manager') {
      if (!form.first_name || !form.last_name || !form.ec_number || !form.email || !form.password) {
        toast.error('Please complete all required fields (First name, Last name, EC number, Email, and Password). Facility details may be filled later by PICTO/DICTO/Administrators.');
        return;
      }
    } else {
      if (!form.first_name || !form.last_name || !form.ec_number || !form.email || !form.physical_facilities_id) {
        toast.error('Please complete all required fields, including selecting a facility.');
        return;
      }
    }
    const data = {
      ...form,
      first_name: capitalize(form.first_name),
      last_name: capitalize(form.last_name)
    };
    try {
      await createEmployee(data);
      setForm(emptyForm);
      setAddOpen(false);
      toast.success(`${data.first_name} ${data.last_name} has been registered successfully.`);
      
      // Notify other tabs that user data may have changed
      const currentUser = sessionStorage.getItem('user');
      if (currentUser) {
        const userObj = JSON.parse(currentUser);
        // If creating record for current user, trigger profile refresh
        if (data.email === userObj.email || data.ec_number === userObj.ec_number) {
          localStorage.setItem('userProfileUpdated', Date.now().toString());
          localStorage.removeItem('userProfileUpdated');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create employee.');
    }
  };

  const handleEdit = async () => {
    if (!editEmployee) return;
    // Allow GISP managers to edit personal details without forcing facility assignment
    if (currentUser?.role === 'gisp_manager') {
      if (!editEmployee.first_name || !editEmployee.last_name || !editEmployee.ec_number || !editEmployee.email) {
        toast.error('Please provide first name(s), last name, EC number and email. Facility details may be left empty.');
        return;
      }
    } else {
      if (!editEmployee.first_name || !editEmployee.last_name || !editEmployee.ec_number || !editEmployee.email || !editEmployee.physical_facilities_id) {
        toast.error('Please complete all required fields, including selecting a facility.');
        return;
      }
    }
    const data = {
      ...editEmployee,
      first_name: capitalize(editEmployee.first_name),
      last_name: capitalize(editEmployee.last_name)
    };
    try {
      await updateEmployee(data);
      setEditEmployee(null);
      toast.success('Employee record updated successfully.');
      refetch();
      
      // Notify other tabs that user data may have changed
      const currentUser = sessionStorage.getItem('user');
      if (currentUser) {
        const userObj = JSON.parse(currentUser);
        // If updating current user's record, trigger profile refresh
        if (editEmployee.id === userObj.id || editEmployee.email === userObj.email) {
          localStorage.setItem('userProfileUpdated', Date.now().toString());
          localStorage.removeItem('userProfileUpdated');
        }
        // Also notify for phone number changes
        if (editEmployee.id === userObj.id && editEmployee.phone_number !== userObj.phone_number) {
          localStorage.setItem('userProfileUpdated', Date.now().toString());
          localStorage.removeItem('userProfileUpdated');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update employee.');
    }
  };

  const handleDelete = async () => {
    if (!deleteEmp) return;
    try {
      await deleteEmployee(deleteEmp.id);
      setDeleteEmp(null);
      toast.success('Employee record has been removed.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete employee.');
    }
  };

  const handleDownloadTemplate = () => {
    const headers = 'ec_number,first_name,last_name,email,backup_email,password,facility_code,facility,province,district\n';
    const example = 'EC010,Jane,Doe,jdoe@mohcc.gov.zw,personal@gmail.com,Welcome@2026,RTC001,Harare Central Hospital,Harare,Harare\n';
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded. Fill all fields below the header.');
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
  };

  const handleRevealPassword = async (id: string) => {
    setIsRevealingPassword(true);
    try {
      const { apiGetEmployeePassword } = await import('@/services/api');
      const res = await apiGetEmployeePassword(Number(id));
      setRevealedPassword({ id, password: res.verified_password, error: res.error });
    } catch (err: any) {
      setRevealedPassword({ id, error: err.message });
    } finally {
      setIsRevealingPassword(false);
    }
  };

  const processCsvUpload = async (intent: 'create' | 'update') => {
    if (!pendingFileData) return;
    setShowIntentModal(false);
    
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
    
    let successCount = 0;
    let skippedCount = 0;
    const errorsList: string[] = [];
    const BATCH_SIZE = 5; 
    
    const employeeMap = new Map(employees.map(e => [e.ec_number, e]));
    
    const processBatch = async (batchRows: any[], startIdx: number) => {
      const promises = batchRows.map(async (row, i) => {
        const lineNum = startIdx + i + 1;
        try {
          const ecNumber = row['ec_number'] || row['ec-number'] || row['ec number'] || row['EC Number'] || row['ecnumber'];
          const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
          const firstName = capitalize(row['first_name'] || row['first_names'] || row['First Name'] || '');
          const lastName = capitalize(row['last_name'] || row['Last Name'] || '');
          const email = row['email'] || row['Email'];
          const backupEmail = row['backup_email'] || row['Backup Email'] || row['backup email'] || '';
          const password = String(row['password'] || row['Password'] || 'Welcome@2026');
          // Role selection: Only Administrators can set roles via CSV; others are forced to General_User
          let roleKey = 'General_User' as any;
          if (currentUser?.role === 'Administrator' && (row['role'] || row['Role'])) {
            roleKey = row['role'] || row['Role'];
          }

          if (!ecNumber) {
            throw new Error(`Missing EC Number.`);
          }

          // Optimized lookup via Map
          const existing = employeeMap.get(ecNumber);

          // Logic A: Register New Records
          if (intent === 'create' && existing) {
            throw new Error(`Employee ${ecNumber} already exists.`);
          }

          // Logic B: Update Existing Data
          let existingId = '';
          if (intent === 'update') {
            if (!existing) throw new Error(`Employee ${ecNumber} not found for update.`);
            existingId = existing.id;
          }

          // Smarter Reference Logic: Resolve facility metadata via facility_code
          let facilityId = '';
          let resolvedProvince = row.province || '';
          let resolvedDistrict = row.district || '';
          const facilityCode = row['facility_code'] || row['Facility Code'];

          if (facilityCode) {
            const f = allFacilities.find(x => x.facility_code.toUpperCase() === String(facilityCode).toUpperCase());
            if (f) {
              facilityId = String(f.id);
              resolvedProvince = f.province;
              resolvedDistrict = f.district;
            }
          }

          const employeeData = {
            id: existingId,
            first_name: firstName || (intent === 'update' ? undefined : ''),
            last_name: lastName || (intent === 'update' ? undefined : ''),
            ec_number: ecNumber,
            email: email || (intent === 'update' ? undefined : ''),
            backup_email: backupEmail || (intent === 'update' ? undefined : ''),
            password: password,
            role: roleKey,
            physical_facilities_id: facilityId,
            province: resolvedProvince || (intent === 'update' ? undefined : ''),
            district: resolvedDistrict || (intent === 'update' ? undefined : ''),
            is_active: true
          };

          if (intent === 'create') {
            await createEmployee(employeeData);
          } else {
            const updateData = Object.fromEntries(Object.entries(employeeData).filter(([_, v]) => v !== undefined));
            await updateEmployee(updateData);
          }
          successCount++;
        } catch (err: any) {
          skippedCount++;
          errorsList.push(`Row ${lineNum}: ${err.message}`);
        }
      });
      await Promise.all(promises);
    };

    // Process in chunks
    for (let i = 0; i < totalLines; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await processBatch(batch, i);
      
      // Update progress after each batch
      setUploadState(prev => ({
        ...prev,
        current: Math.min(i + BATCH_SIZE, totalLines),
        success: successCount,
        skipped: skippedCount,
        errors: [...errorsList]
      }));
    }
    
    setPendingFileData(null);
    refetch();
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
    setFilterFacility([]);
    setFilterRole([]);
    setFilterStatus([]);
  };
  const activeFilters = [filterProvince, filterDistrict, filterFacility, filterRole, filterStatus].reduce((a, b) => a + b.length, 0);

  const scopeLabel = (currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_viewer' || currentUser?.role === 'gisp_manager')
    ? 'all facilities'
    : currentUser?.role?.startsWith('PICTO')
    ? `${currentUser.province} province`
    : `${currentUser.district} district`;

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
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const SortIcon = ({ column, sortColumn, sortDirection }: { column: string, sortColumn: string, sortDirection: 'asc' | 'desc' }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // For page-based pagination, employees are already paginated from server
  const paginatedRows = filtered; // Employees are already paginated from server
  
  // Export with password verification (admin only)
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
      const { apiLogin } = await import('@/services/api');
      await apiLogin(currentUser!.email, exportPassword);
      // Password verified — proceed with export
      const headers = 'EC Number,First Name(s),Last Name,Corporate Email,Backup Email,Role,Facility Code,Facility,Province,District,Status\n';
      const rows = filtered.map((e) =>
        `"${e.ec_number}","${e.first_name}","${e.last_name}","${e.email}","${e.backup_email || ''}","${e.role}","${e.facility_code || ''}","${e.facility || ''}","${e.province || ''}","${e.district || ''}","${e.is_active ? 'Active' : 'Inactive'}"`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} employee records.`);
      setShowExportDialog(false);
    } catch {
      toast.error('Incorrect password. Export denied.');
    }
  };






  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Employee Management
            {/* removed isFetching spinner to avoid polling flicker */}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isViewer ? `Viewing personnel records for ${scopeLabel} (read-only)` : `Manage personnel records across ${scopeLabel}`}
          </p>
        </div>

        {isManager && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-1" /> Download Template
            </Button>
            {(currentUser?.role === 'Administrator' || currentUser?.role === 'gisp_manager') && (
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
                  <Plus className="h-4 w-4 mr-1" /> Register Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Employee</DialogTitle>
                  <DialogDescription>Enter the details of the new staff member. Fields marked with * are required.</DialogDescription>
                </DialogHeader>
                <EmployeeFormFields 
                  data={form} 
                  onChange={setForm} 
                  currentUser={currentUser}
                  allFacilities={allFacilities}
                  provinces={provinces}
                  roles={roles}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd}>Register Employee</Button>
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
                  placeholder="Search by name, EC number, or email address…" 
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
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Province</Label>
                    <MultiSelectFilter 
                      title="Province"
                      options={[
                        ...provinces.map(p => ({ label: p.name, value: p.name })),
                        { label: 'Blanks', value: '__blanks__' }
                      ]}
                      selected={filterProvince} 
                      onChange={handleFilterChange(setFilterProvince)}
                      disabled={isProvincialRestricted || isDistrictRestricted} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">District</Label>
                    <MultiSelectFilter 
                      title="District"
                      options={[
                        ...provinces
                        .filter(p => filterProvince.length === 0 || filterProvince.includes(p.name))
                        .flatMap(p => p.districts).map(d => ({ label: d, value: d })),
                        { label: 'Blanks', value: '__blanks__' }
                      ]}
                      selected={filterDistrict} 
                      onChange={handleFilterChange(setFilterDistrict)}
                      disabled={isDistrictRestricted} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Facility</Label>
                    <MultiSelectFilter 
                      title="Facility"
                      options={[
                        ...facilityOptions,
                        { label: 'Blanks', value: '__blanks__' }
                      ]}
                      selected={filterFacility} onChange={handleFilterChange(setFilterFacility)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <MultiSelectFilter 
                      title="Role"
                      options={roles.map(r => ({ label: r.role_name, value: r.role_key }))}
                      selected={filterRole} onChange={handleFilterChange(setFilterRole)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <MultiSelectFilter 
                      title="Status"
                      options={[{label: 'Active', value: 'active'}, {label: 'Inactive', value: 'inactive'}]}
                      selected={filterStatus} onChange={handleFilterChange(setFilterStatus)} />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" /> Clear All Filters
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Fetching employee records…</p>
              </div>
            ) : (
              <>
                <div className="px-4 pb-2 pt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Showing {totalEmployees > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalEmployees)} of {totalEmployees} records</span>
                </div>
                <div className="relative overflow-x-auto max-h-[80vh] overflow-y-auto border rounded-lg">
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
                      <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('ec_number')}>
                        <span className="flex items-center gap-1">EC Number <SortIcon column="ec_number" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('first_name')}>
                        <span className="flex items-center gap-1">Full Name <SortIcon column="first_name" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('email')}>
                        <span className="flex items-center gap-1">Corporate Email <SortIcon column="email" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('role')}>
                        <span className="flex items-center gap-1">Role <SortIcon column="role" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('facility_code')}>
                        <span className="flex items-center gap-1">Facility Code <SortIcon column="facility_code" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('facility')}>
                        <span className="flex items-center gap-1">Facility Name <SortIcon column="facility" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('province')}>
                        <span className="flex items-center gap-1">Province <SortIcon column="province" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('district')}>
                        <span className="flex items-center gap-1">District <SortIcon column="district" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort('is_active')}>
                        <span className="flex items-center gap-1">Status <SortIcon column="is_active" sortColumn={sortColumn} sortDirection={sortDirection} /></span>
                      </TableHead>
                     {showActions && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {filtered.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={showActions ? 8 : 7} className="text-center py-12 text-muted-foreground">
                         No employee records match your search criteria.
                       </TableCell>
                     </TableRow>
                  ) : (
                    paginatedRows.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-sm">{emp.ec_number}</TableCell>
                         <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                         <TableCell className="hidden md:table-cell text-sm">{emp.email}</TableCell>
                        <TableCell><Badge variant={roleBadgeVariant(emp.role)}>{roles.find(r => r.role_key === emp.role)?.role_name || emp.role}</Badge></TableCell>
                         <TableCell className="hidden lg:table-cell text-sm font-mono">{emp.facility_code || '—'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{emp.facility}</TableCell>
                         <TableCell className="hidden lg:table-cell text-sm">{emp.province}</TableCell>
                         <TableCell className="hidden lg:table-cell text-sm">{emp.district}</TableCell>
                          <TableCell>
                            <Badge variant={emp.is_active ? 'success' : 'destructive'}>{emp.is_active ? 'Active' : 'Inactive'}</Badge>
                          </TableCell>
                          {showActions && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewEmployee(emp)} title="View Details"><Eye className="h-3.5 w-3.5" /></Button>
                                {isManager && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditEmployee({ ...emp })} title="Edit Record"><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDeleteEmp(emp); setDeleteConfirmed(false); }} title="Delete Record"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Proper Pagination Controls */}
              {employees.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {totalEmployees > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalEmployees)} of {totalEmployees} records
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
        <Dialog open={!!viewEmployee} onOpenChange={(open) => { 
          if (!open) {
            setViewEmployee(null);
            setRevealedPassword(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>Personnel record for {viewEmployee?.first_name} {viewEmployee?.last_name}</DialogDescription>
            </DialogHeader>
            {viewEmployee && (
              <>
                {console.log('viewEmployee data:', viewEmployee)}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Full Name</p><p className="font-medium">{viewEmployee.first_name} {viewEmployee.last_name}</p></div>
                  <div><p className="text-muted-foreground text-xs">EC Number</p><p className="font-medium font-mono">{viewEmployee.ec_number}</p></div>
                  
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">Email</p><p className="font-medium break-all">{viewEmployee.email}</p></div>
                  
                  <div><p className="text-muted-foreground text-xs">Backup Email</p><p className="font-medium break-all">{viewEmployee.backup_email || '—'}</p></div>
                  <div><p className="text-muted-foreground text-xs">Phone Number</p><p className="font-medium">{viewEmployee.phone_number || '—'}</p></div>
                  
                  {currentUser?.role !== 'PHRO' && currentUser?.role !== 'DHRO' && (
                    <div>
                      <p className="text-muted-foreground text-xs">Verified Password</p>
                      {revealedPassword?.id === String(viewEmployee.id) ? (
                        revealedPassword.error ? (
                          <p className="text-xs text-destructive">{revealedPassword.error}</p>
                        ) : (
                          <p className="font-medium font-mono">{revealedPassword.password || '—'}</p>
                        )
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-xs px-2 mt-1" 
                          onClick={() => handleRevealPassword(viewEmployee.id)}
                          disabled={isRevealingPassword}
                        >
                          {isRevealingPassword ? 'Fetching...' : 'Reveal Password'}
                        </Button>
                      )}
                    </div>
                  )}
                  <div><p className="text-muted-foreground text-xs">Role</p><Badge variant={roleBadgeVariant(viewEmployee.role)}>{roles.find(r => r.role_key === viewEmployee.role)?.role_name || viewEmployee.role}</Badge></div>
                  
                  <div><p className="text-muted-foreground text-xs">Facility Code</p><p className="font-medium font-mono">{viewEmployee.facility_code || '—'}</p></div>
                  <div><p className="text-muted-foreground text-xs">Facility</p><p className="font-medium">{viewEmployee.facility}</p></div>
                  
                  <div><p className="text-muted-foreground text-xs">Province</p><p className="font-medium">{viewEmployee.province}</p></div>
                  <div><p className="text-muted-foreground text-xs">District</p><p className="font-medium">{viewEmployee.district}</p></div>
                  
                  <div><p className="text-muted-foreground text-xs">Status</p><Badge variant={viewEmployee.is_active ? 'success' : 'destructive'}>{viewEmployee.is_active ? 'Active' : 'Inactive'}</Badge></div>
                  <div><p className="text-muted-foreground text-xs">Registered On</p><p className="font-medium">{new Date(viewEmployee.created_at).toLocaleDateString()}</p></div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit */}
        <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>Update the record for {editEmployee?.first_name} {editEmployee?.last_name}.</DialogDescription>
            </DialogHeader>
            {editEmployee && (
              <EmployeeFormFields 
                data={editEmployee} 
                onChange={setEditEmployee} 
                showStatus 
                isEdit={true}
                currentUser={currentUser}
                allFacilities={allFacilities}
                provinces={provinces}
                roles={roles}
                onPasswordChange={() => {
                  setPasswordChangeEmp(editEmployee);
                  setShowPasswordChangeForm(true);
                }}
              />
            )}
            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
                <Button onClick={() => {
                  if (currentUser?.role === 'gisp_manager') {
                    if (!editEmployee?.first_name || !editEmployee.last_name || !editEmployee.ec_number || !editEmployee.email) {
                      toast.error('Please provide first name(s), last name, EC number and email.');
                      return;
                    }
                  } else {
                    if (!editEmployee?.first_name || !editEmployee?.last_name || !editEmployee?.ec_number || !editEmployee?.email || !editEmployee?.physical_facilities_id) {
                      toast.error('Please complete all required fields, including selecting a facility.');
                      return;
                    }
                  }
                  setShowConfirmEdit(true);
                }}>Save Changes</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <Dialog open={!!deleteEmp} onOpenChange={(open) => { if (!open) setDeleteEmp(null); }}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Warning: Permanent Deletion
              </DialogTitle>
              <DialogDescription className="sr-only">
                Confirm employee deletion.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <p className="text-foreground">
                Are you sure you want to permanently remove employee <strong>{deleteEmp?.first_name} {deleteEmp?.last_name}</strong> ({deleteEmp?.ec_number})?
              </p>
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs">
                  Warning: This action is irreversible. The record will be permanently deleted from the database. Any associated data or reference might be affected.
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="confirm-delete-user" 
                  checked={deleteConfirmed} 
                  onCheckedChange={(checked) => setDeleteConfirmed(!!checked)} 
                />
                <label 
                  htmlFor="confirm-delete-user" 
                  className="text-xs font-medium leading-none cursor-pointer select-none"
                >
                  I understand this action is permanent and cannot be undone.
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteEmp(null)}>Cancel</Button>
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
                Are you sure you want to update this employee record? Please verify that all the details are correct.
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

        {/* Password Change Form Pop-up (Nested) */}
        <Dialog open={showPasswordChangeForm} onOpenChange={setShowPasswordChangeForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter a new password for <strong>{passwordChangeEmp?.first_name} {passwordChangeEmp?.last_name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input 
                    type={passwordForm.showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword} 
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} 
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  >
                    {passwordForm.showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    type={passwordForm.showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword} 
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} 
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                  >
                    {passwordForm.showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordChangeForm(false)}>Cancel</Button>
              <Button 
                onClick={() => {
                  if (!passwordForm.newPassword) {
                    toast.error('Please enter a new password.');
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    toast.error('Passwords do not match.');
                    return;
                  }
                  setShowConfirmPasswordChange(true);
                }}
              >
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Change Confirmation */}
        <Dialog open={showConfirmPasswordChange} onOpenChange={setShowConfirmPasswordChange}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Confirm Password Change
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to change the password for <strong>{passwordChangeEmp?.first_name} {passwordChangeEmp?.last_name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-muted-foreground">New password: <span className="font-mono font-medium text-foreground">{passwordForm.newPassword}</span></p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmPasswordChange(false)}>Cancel</Button>
              <Button onClick={handlePasswordChange}>Yes, Change Password</Button>
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
              }
            }
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Upload Intent
              </DialogTitle>
              <DialogDescription>
                What are you trying to achieve with this file?
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
              <button
                className="w-full text-left rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 p-4 transition-all whitespace-normal"
                onClick={() => processCsvUpload('create')}
              >
                <div className="flex items-center gap-2 font-bold text-primary mb-1">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Register New Records</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use this if you are adding new employees or health workers to the system for the first time. The system will create new accounts for every EC-Number provided.
                </p>
              </button>

              <button
                className="w-full text-left rounded-lg border-2 border-border hover:border-destructive hover:bg-destructive/5 p-4 transition-all whitespace-normal"
                onClick={() => processCsvUpload('update')}
              >
                <div className="flex items-center gap-2 font-bold text-destructive mb-1">
                  <Pencil className="h-4 w-4 shrink-0" />
                  <span>Update Existing Data</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use this if you are correcting info or changing roles for current staff. The system will look for matching EC-Numbers and only update the fields provided in your file, leaving other data untouched.
                </p>
              </button>
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
                You are about to export sensitive employee data. Please enter your password to confirm.
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

const MultiSelectFilter = ({ title, options, selected, onChange, disabled }: any) => {
    return (
      <SearchableMultiSelectFilter
        title={title}
        options={options}
        selected={selected}
        onChange={onChange}
        searchable={options.length > 8}
        disabled={disabled}
      />
    );
};



