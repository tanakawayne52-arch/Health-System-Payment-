export type UserRole = 'provincial_officer' | 'hr_custodian' | 'finance_officer' | 'national_admin';
export type { VhwRecord, NationalLevelData } from './vhw';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  province: string | null;
  district: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export type BeneficiaryStatus = 'active' | 'inactive' | 'exited';

export interface Beneficiary {
  id: string;
  fullName: string;
  nationalId: string;
  ecocashNumber: string;
  province: string;
  district: string;
  ward: string;
  village: string;
  facility: string;
  status: BeneficiaryStatus;
  exitDate: string | null;
  exitReason: string | null;
  dateJoined: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CycleStatus = 'open' | 'locked' | 'closed';

export interface PaymentCycle {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: CycleStatus;
  createdBy: string;
  createdAt: string;
}

export type PaymentListStatus = 'draft' | 'submitted' | 'under_review' | 'certified' | 'rejected';

export interface PaymentList {
  id: string;
  cycleId: string;
  province: string;
  district: string | null;
  name: string;
  status: PaymentListStatus;
  submittedBy: string;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  certificationNotes: string | null;
  beneficiaryCount: number;
  totalAmount: number;
  createdAt: string;
}

export interface PaymentListBeneficiary {
  id: string;
  listId: string;
  beneficiaryId: string;
  amount: number;
  status: 'included' | 'excluded' | 'duplicate_flagged';
  exclusionReason: string | null;
}

export type BatchStatus = 'pending' | 'validated' | 'processing' | 'completed' | 'failed';

export interface PaymentBatch {
  id: string;
  cycleId: string;
  name: string;
  province: string;
  district: string | null;
  status: BatchStatus;
  totalBeneficiaries: number;
  totalAmount: number;
  validatedBy: string | null;
  validatedAt: string | null;
  executedBy: string | null;
  executedAt: string | null;
  failureReason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  batchId: string;
  beneficiaryId: string;
  ecocashNumber: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  referenceCode: string | null;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  reason: string | null;
  ipAddress: string;
  timestamp: string;
}

export interface ExceptionRequest {
  id: string;
  type: 'unlock_certified' | 'override_duplicate' | 'emergency_batch';
  province: string;
  requestedBy: string;
  requesterName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export const PROVINCES = [
  'BULAWAYO',
  'HARARE',
  'MANICALAND',
  'MASHONALAND CENTRAL',
  'MASHONALAND EAST',
  'MASHONALAND WEST',
  'MASVINGO',
  'MATABELELAND NORTH',
  'MATABELELAND SOUTH',
  'MIDLANDS',
] as const;

export const DISTRICTS: Record<string, string[]> = {
  'BULAWAYO': ['Bulawayo Central', 'Bulawayo West', 'Bulawayo Suburban', 'Nkulumane'],
  'HARARE': ['Harare Central', 'Harare East', 'Harare West', 'Harare South', 'Chitungwiza', 'Epworth'],
  'MANICALAND': ['Mutare', 'Mutasa', 'Nyanga', 'Makoni', 'Chipinge', 'Buhera', 'Chimanimani'],
  'MASHONALAND CENTRAL': ['Bindura', 'Mazowe', 'Guruve', 'Mbire', 'Mount Darwin', 'Rushinga', 'Shamva', 'Muzarabani'],
  'MASHONALAND EAST': ['Marondera', 'Murewa', 'Mutoko', 'Mudzi', 'Goromonzi', 'Hwedza', 'Chikomba', 'Seke', 'Uzumba Maramba Pfungwe'],
  'MASHONALAND WEST': ['Chinhoyi', 'Kadoma', 'Chegutu', 'Hurungwe', 'Kariba', 'Makonde', 'Zvimba', 'Sanyati', 'Mhondoro-Ngezi'],
  'MASVINGO': ['Masvingo', 'Bikita', 'Chivi', 'Gutu', 'Mwenezi', 'Zaka', 'Chiredzi'],
  'MATABELELAND NORTH': ['Lupane', 'Hwange', 'Victoria Falls', 'Binga', 'Nkayi', 'Tsholotsho', 'Umguza'],
  'MATABELELAND SOUTH': ['Gwanda', 'Beitbridge', 'Bulilima', 'Insiza', 'Mangwe', 'Matobo', 'Umzingwane'],
  'MIDLANDS': ['Gweru', 'Kwekwe', 'Shurugwi', 'Chirumanzu', 'Gokwe North', 'Gokwe South', 'Mberengwa', 'Zvishavane'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  provincial_officer: 'Provincial Officer',
  hr_custodian: 'HR/Custodian',
  finance_officer: 'Finance Officer',
  national_admin: 'National Administrator',
};

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  children?: NavItem[];
}

export const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  provincial_officer: [
    { label: 'Overview', icon: 'LayoutDashboard', path: '/overview/' },
    { 
      label: 'VHW Management', 
      icon: 'Users', 
      path: '/vhw',
      children: [
        { label: 'National Dashboard', icon: 'BarChart3', path: '/vhw-national-dashboard' },
        { label: 'Provincial Dashboard', icon: 'BarChart3', path: '/vhw-provincial-dashboard' },
        { label: 'District Dashboard', icon: 'BarChart3', path: '/vhw-district-dashboard' },
        { label: 'VHW Records', icon: 'Users', path: '/beneficiaries' },
      ]
    },
    { 
      label: 'Payments', 
      icon: 'FileText', 
      path: '/payments',
      children: [
        { label: 'Payment Lists', icon: 'FileText', path: '/payment-lists' },
        { label: 'Reports', icon: 'BarChart3', path: '/reports' },
      ]
    },
    { label: 'Audit Log', icon: 'ClipboardList', path: '/audit-trail' },
  ],
  hr_custodian: [
    { label: 'Overview', icon: 'LayoutDashboard', path: '/overview/' },
    { 
      label: 'VHW Management', 
      icon: 'Users', 
      path: '/vhw',
      children: [
        { label: 'National Dashboard', icon: 'BarChart3', path: '/vhw-national-dashboard' },
        { label: 'Provincial Dashboard', icon: 'BarChart3', path: '/vhw-provincial-dashboard' },
        { label: 'District Dashboard', icon: 'BarChart3', path: '/vhw-district-dashboard' },
        { label: 'VHW Records', icon: 'Users', path: '/beneficiaries' },
      ]
    },
    {
      label: 'Facilities',
      icon: 'Landmark',
      path: '/facilities-mgmt',
      children: [
        { label: 'Physical Facilities', icon: 'Landmark', path: '/facilities' },
        { label: 'Facility Types', icon: 'Settings', path: '/facility-types' },
      ]
    },
    { 
      label: 'System', 
      icon: 'Settings', 
      path: '/system',
      children: [
        { label: 'Payment Cycles', icon: 'Calendar', path: '/payment-cycles' },
        { label: 'Reports', icon: 'BarChart3', path: '/reports' },
      ]
    },
    { label: 'Audit Log', icon: 'ClipboardList', path: '/audit-trail' },
  ],
  finance_officer: [
    { label: 'Overview', icon: 'LayoutDashboard', path: '/overview/' },
    { 
      label: 'VHW Analytics', 
      icon: 'BarChart3', 
      path: '/vhw-analytics',
      children: [
        { label: 'National Dashboard', icon: 'BarChart3', path: '/vhw-national-dashboard' },
        { label: 'Provincial Dashboard', icon: 'BarChart3', path: '/vhw-provincial-dashboard' },
        { label: 'District Dashboard', icon: 'BarChart3', path: '/vhw-district-dashboard' },
      ]
    },
    { 
      label: 'Disbursements', 
      icon: 'Wallet', 
      path: '/disbursements',
      children: [
        { label: 'Payment Batches', icon: 'Wallet', path: '/payment-batches' },
        { label: 'Payment Lists', icon: 'FileText', path: '/payment-lists' },
        { label: 'Reconciliation', icon: 'GitCompare', path: '/reconciliation' },
      ]
    },
    { label: 'Reports', icon: 'BarChart3', path: '/reports' },
    { label: 'Audit Log', icon: 'ClipboardList', path: '/audit-trail' },
  ],
  national_admin: [
    { label: 'Overview', icon: 'LayoutDashboard', path: '/overview/' },
    { 
      label: 'Dashboards', 
      icon: 'LayoutDashboard', 
      path: '/dashboards',
      children: [
        { label: 'National Dashboard', icon: 'BarChart3', path: '/vhw-national-dashboard' },
        { label: 'Provincial Dashboard', icon: 'BarChart3', path: '/vhw-provincial-dashboard' },
        { label: 'District Dashboard', icon: 'BarChart3', path: '/vhw-district-dashboard' },
        { label: 'Workforce Summary', icon: 'ClipboardList', path: '/workforce-summary' },
      ]
    },
    { 
      label: 'System Management', 
      icon: 'UserCog', 
      path: '/admin',
      children: [
        { label: 'User Management', icon: 'UserCog', path: '/users' },
        { label: 'Audit Trail', icon: 'ClipboardList', path: '/audit-trail' },
      ]
    },
    { 
      label: 'Operations', 
      icon: 'Activity', 
      path: '/ops',
      children: [
        { label: 'VHW Records', icon: 'Users', path: '/beneficiaries' },
        { label: 'Physical Facilities', icon: 'Landmark', path: '/facilities' },
        { label: 'Payment Batches', icon: 'Wallet', path: '/payment-batches' },
        { label: 'Reports', icon: 'BarChart3', path: '/reports' },
      ]
    },
    { label: 'Notifications', icon: 'Bell', path: '/notifications' },
    { label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
};
