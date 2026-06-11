/// <reference types="vite/client" />
import { authenticateUser, getUserByEmail } from '@/data/users';
import { 
  getUsers, 
  getBeneficiaries, 
  getCycles, 
  getPaymentLists, 
  getBatches, 
  getAuditLogs, 
  getExceptions,
  seedAllData 
} from '@/data/seed';

// Seed data on first load
seedAllData();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private currentUser: User | null = null;
  private accessToken = 'dummy_access_token';

  // Helper to map app Beneficiary to API Beneficiary
  private mapBeneficiary(ben: any): Beneficiary {
    return {
      id: ben.id,
      full_name: ben.fullName,
      national_id: ben.nationalId,
      ecocash_number: ben.ecocashNumber,
      province: ben.province,
      district: ben.district,
      ward: ben.ward,
      village: ben.village,
      facility: ben.facility,
      status: ben.status,
      exit_date: ben.exitDate,
      exit_reason: ben.exitReason,
      date_joined: ben.dateJoined,
      created_at: ben.createdAt
    };
  }

  // Helper to map app PaymentBatch to API PaymentBatch
  private mapBatch(batch: any): PaymentBatch {
    return {
      id: batch.id,
      cycle_id: batch.cycleId,
      name: batch.name,
      province: batch.province,
      district: batch.district,
      status: batch.status,
      total_beneficiaries: batch.totalBeneficiaries,
      total_amount: batch.totalAmount,
      successful_count: 0,
      failed_count: 0,
      successful_amount: 0,
      failed_amount: 0,
      ecocash_batch_ref: null,
      created_at: batch.createdAt
    };
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> {
    try {
      const user = authenticateUser(email, password);
      if (user) {
        this.currentUser = user;
        // Generate dummy tokens for compatibility
        const accessToken = 'dummy_access_token';
        const refreshToken = 'dummy_refresh_token';
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('fepms_current_user', JSON.stringify(user));
        
        return {
          success: true,
          data: {
            user,
            accessToken,
            refreshToken
          }
        };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('[API] Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('fepms_current_user');
    return { success: true };
  }

  async getMe(): Promise<ApiResponse<User>> {
    try {
      // Check if we have a stored user in localStorage
      const storedUser = localStorage.getItem('fepms_current_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const dbUser = getUserByEmail(user.email);
        if (dbUser) {
          return { success: true, data: dbUser };
        }
      }
      return { success: false, error: 'Not authenticated' };
    } catch (error) {
      console.error('[API] Get me failed:', error);
      return { success: false, error: 'Failed to get user' };
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return { success: true };
  }

  // Dashboard endpoints
  async getDashboardStats(province?: string): Promise<ApiResponse<DashboardStats>> {
    return {
      success: true,
      data: {
        totalBeneficiaries: getBeneficiaries().length,
        activeBeneficiaries: getBeneficiaries().filter(b => b.status === 'active').length,
        totalDisbursed: getBatches().reduce((sum, b) => sum + b.totalAmount, 0),
        pendingPayments: 0,
        successRate: 0.95,
        monthlyStats: [],
        provinceStats: [],
        recentBatches: getBatches().slice(0, 5).map(b => ({
          id: b.id,
          name: b.name,
          province: b.province,
          status: b.status,
          totalAmount: b.totalAmount,
          totalBeneficiaries: b.totalBeneficiaries,
          successRate: 0.95,
          createdAt: b.createdAt
        })),
        recentTransactions: []
      }
    };
  }

  async getBatchProgress(): Promise<ApiResponse<BatchProgress[]>> {
    return {
      success: true,
      data: getBatches().slice(0, 5).map(b => ({
        id: b.id,
        name: b.name,
        province: b.province,
        status: b.status,
        total_beneficiaries: b.totalBeneficiaries,
        successful_count: Math.floor(b.totalBeneficiaries * 0.95),
        failed_count: Math.floor(b.totalBeneficiaries * 0.05),
        total_amount: b.totalAmount,
        successful_amount: Math.floor(b.totalAmount * 0.95),
        executed_at: b.executedAt || new Date().toISOString()
      }))
    };
  }

  async getTransactionAnalytics(params: any): Promise<ApiResponse<TransactionAnalytics[]>> {
    return { success: true, data: [] };
  }

  async getFailureAnalytics(province?: string): Promise<ApiResponse<FailureAnalytics>> {
    return {
      success: true,
      data: {
        failureCodes: [],
        failuresByProvince: []
      }
    };
  }

  async getProvinceAnalytics(): Promise<ApiResponse<ProvinceAnalytics[]>> {
    return { success: true, data: [] };
  }

  // Batches endpoints
  async getBatches(params: {
    province?: string;
    status?: string;
    cycleId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<PaymentBatch>>> {
    let batches = getBatches();
    if (params.province && params.province !== 'null') {
      batches = batches.filter(b => b.province === params.province);
    }
    if (params.status) {
      batches = batches.filter(b => b.status === params.status);
    }
    if (params.cycleId) {
      batches = batches.filter(b => b.cycleId === params.cycleId);
    }
    const limit = params.limit || 100;
    const page = params.page || 1;
    const total = batches.length;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: batches.slice((page - 1) * limit, page * limit).map(this.mapBatch),
        pagination: { page, limit, total, totalPages }
      }
    };
  }

  async getBatch(id: string): Promise<ApiResponse<PaymentBatchDetail>> {
    const batch = getBatches().find(b => b.id === id);
    if (batch) {
      return {
        success: true,
        data: {
          ...this.mapBatch(batch),
          transactions: []
        }
      };
    }
    return { success: false, error: 'Batch not found' };
  }

  async createBatch(data: any) {
    return { success: true, data: {} as PaymentBatch };
  }

  async validateBatch(id: string) {
    return {
      success: true,
      data: {
        batchId: id,
        totalTransactions: 0,
        validCount: 0,
        invalidCount: 0,
        validationResults: []
      }
    };
  }

  async executeBatch(id: string) {
    return {
      success: true,
      data: {
        status: 'ACCEPTED',
        batchReference: `ref-${id}`,
        message: 'Batch accepted',
        acceptedCount: 0,
        rejectedCount: 0
      }
    };
  }

  async getBatchStatus(id: string) {
    return {
      success: true,
      data: {
        batchReference: id,
        status: 'completed',
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0
      }
    };
  }

  async retryBatch(id: string) {
    return {
      success: true,
      data: {
        retriedCount: 0,
        message: 'Retry successful'
      }
    };
  }

  async getBatchTransactions(id: string, params: any): Promise<ApiResponse<PaginatedResponse<PaymentTransaction>>> {
    return {
      success: true,
      data: {
        data: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
      }
    };
  }

  // Beneficiaries endpoints
  async getBeneficiaries(params: {
    province?: string;
    district?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Beneficiary>>> {
    let beneficiaries = getBeneficiaries();
    if (params.province && params.province !== 'null') {
      beneficiaries = beneficiaries.filter(b => b.province === params.province);
    }
    if (params.district) {
      beneficiaries = beneficiaries.filter(b => b.district === params.district);
    }
    if (params.status) {
      beneficiaries = beneficiaries.filter(b => b.status === params.status);
    }
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      beneficiaries = beneficiaries.filter(b => 
        b.fullName.toLowerCase().includes(searchLower) ||
        b.nationalId.includes(searchLower) ||
        b.ecocashNumber.includes(searchLower)
      );
    }
    const limit = params.limit || 1000;
    const page = params.page || 1;
    const total = beneficiaries.length;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: beneficiaries.slice((page - 1) * limit, page * limit).map(this.mapBeneficiary),
        pagination: { page, limit, total, totalPages }
      }
    };
  }

  async getBeneficiary(id: string): Promise<ApiResponse<BeneficiaryDetail>> {
    const ben = getBeneficiaries().find(b => b.id === id);
    if (ben) {
      return {
        success: true,
        data: {
          ...this.mapBeneficiary(ben),
          paymentHistory: []
        }
      };
    }
    return { success: false, error: 'Beneficiary not found' };
  }

  async createBeneficiary(data: CreateBeneficiaryData): Promise<ApiResponse<Beneficiary>> {
    return { success: true, data: {} as Beneficiary };
  }

  async updateBeneficiary(id: string, data: Partial<CreateBeneficiaryData>): Promise<ApiResponse<Beneficiary>> {
    return { success: true, data: {} as Beneficiary };
  }

  async exitBeneficiary(id: string, exitDate: string, exitReason: string): Promise<ApiResponse<void>> {
    return { success: true };
  }

  async checkDuplicateBeneficiary(nationalId?: string, ecocashNumber?: string, excludeId?: string): Promise<ApiResponse<{ hasDuplicates: boolean; duplicates: DuplicateInfo[] }>> {
    return {
      success: true,
      data: {
        hasDuplicates: false,
        duplicates: []
      }
    };
  }

  // Notifications endpoints
  async getNotifications(params?: any): Promise<ApiResponse<{ notifications: Notification[]; unreadCount: number }>> {
    return {
      success: true,
      data: {
        notifications: [],
        unreadCount: 0
      }
    };
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    return { success: true };
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return { success: true };
  }

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return { success: true };
  }

  // Export endpoints
  async exportBatchExcel(id: string) {
    return new Blob();
  }

  async exportBatchPdf(id: string) {
    return new Blob();
  }

  async exportBeneficiariesExcel(province?: string, status?: string) {
    return new Blob();
  }

  async exportReconciliationExcel(startDate?: string, endDate?: string, province?: string) {
    return new Blob();
  }

  async getAnalytics(_params: any): Promise<ApiResponse<any>> {
    return { success: true, data: {} };
  }
}

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'provincial_officer' | 'hr_custodian' | 'finance_officer' | 'national_admin';
  province: string | null;
  district: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  totalDisbursed: number;
  pendingPayments: number;
  successRate: number;
  monthlyStats: MonthlyStats[];
  provinceStats: ProvinceStats[];
  recentBatches: BatchSummary[];
  recentTransactions: TransactionSummary[];
}

export interface MonthlyStats {
  month: string;
  disbursed: number;
  beneficiaries: number;
  successRate: number;
}

export interface ProvinceStats {
  province: string;
  beneficiaries: number;
  totalDisbursed: number;
  pendingAmount: number;
}

export interface BatchSummary {
  id: string;
  name: string;
  province: string;
  status: string;
  totalAmount: number;
  totalBeneficiaries: number;
  successRate: number;
  createdAt: string;
}

export interface TransactionSummary {
  id: string;
  beneficiaryName: string;
  ecocashNumber: string;
  amount: number;
  status: string;
  processedAt: string | null;
}

export interface BatchProgress {
  id: string;
  name: string;
  province: string;
  status: string;
  total_beneficiaries: number;
  successful_count: number;
  failed_count: number;
  total_amount: number;
  successful_amount: number;
  executed_at: string;
}

export interface TransactionAnalytics {
  period: string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  successful_amount: number;
  success_rate: number;
}

export interface FailureAnalytics {
  failureCodes: {
    failure_code: string;
    count: number;
    total_amount: number;
  }[];
  failuresByProvince: {
    province: string;
    failed_count: number;
    failed_amount: number;
  }[];
}

export interface ProvinceAnalytics {
  province: string;
  total_beneficiaries: number;
  active_beneficiaries: number;
  total_batches: number;
  completed_batches: number;
  total_disbursed: number;
  pending_amount: number;
  success_rate: number;
}

export interface PaymentBatch {
  id: string;
  cycle_id: string;
  name: string;
  province: string;
  district: string | null;
  status: string;
  total_beneficiaries: number;
  total_amount: number;
  successful_count: number;
  failed_count: number;
  successful_amount: number;
  failed_amount: number;
  ecocash_batch_ref: string | null;
  created_at: string;
  cycle_name?: string;
}

export interface PaymentBatchDetail extends PaymentBatch {
  transactions: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  batch_id: string;
  beneficiary_id: string;
  ecocash_number: string;
  amount: number;
  status: string;
  ecocash_reference: string | null;
  ecocash_transaction_id: string | null;
  failure_reason: string | null;
  failure_code: string | null;
  processed_at: string | null;
  beneficiary_name?: string;
  national_id?: string;
}

export interface BatchValidationResult {
  batchId: string;
  totalTransactions: number;
  validCount: number;
  invalidCount: number;
  validationResults: {
    transactionId: string;
    ecocashNumber: string;
    valid: boolean;
    error?: string;
  }[];
}

export interface BatchExecutionResult {
  status: 'ACCEPTED' | 'REJECTED';
  batchReference: string;
  message: string;
  acceptedCount: number;
  rejectedCount: number;
}

export interface EcoCashBatchStatus {
  batchReference: string;
  status: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
}

export interface BatchRetryResult {
  retriedCount: number;
  message: string;
}

export interface Beneficiary {
  id: string;
  full_name: string;
  national_id: string;
  ecocash_number: string;
  province: string;
  district: string;
  ward: string;
  village: string | null;
  facility: string | null;
  status: 'active' | 'inactive' | 'exited';
  exit_date: string | null;
  exit_reason: string | null;
  date_joined: string;
  created_at: string;
}

export interface BeneficiaryDetail extends Beneficiary {
  paymentHistory: {
    id: string;
    batch_name: string;
    amount: number;
    status: string;
    processed_at: string | null;
  }[];
}

export interface CreateBeneficiaryData {
  fullName: string;
  nationalId: string;
  ecocashNumber: string;
  province: string;
  district: string;
  ward: string;
  village?: string;
  facility?: string;
  dateJoined: string;
}

export interface DuplicateInfo {
  field: string;
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Singleton instance
export const api = new ApiClient();
