/// <reference types="vite/client" />
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on init
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle token refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          return this.parseResponse(retryResponse);
        }
      }

      return this.parseResponse(response);
    } catch (error) {
      console.error('[API] Request failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Check if response has content
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    // If no content or content-length is 0, return success without data
    if (response.status === 204 || !contentLength || parseInt(contentLength) === 0) {
      return { success: true };
    }

    // Check if content is JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.error('[API] Failed to parse JSON:', error);
        return { success: false, error: 'Invalid response format' };
      }
    }

    // For non-JSON responses, return success
    return { success: true };
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      // Check if response is OK before parsing
      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      // Parse response only if there's content
      const contentLength = response.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) === 0) {
        this.clearTokens();
        return false;
      }

      const result = await response.json();

      if (result.success && result.data) {
        this.setTokens(result.data.accessToken, result.data.refreshToken);
        return true;
      }

      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const result = await this.request<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data) {
      this.setTokens(result.data.accessToken, result.data.refreshToken);
    }

    return result;
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.clearTokens();
    return result;
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Dashboard endpoints
  async getDashboardStats(province?: string) {
    const params = province ? `?province=${encodeURIComponent(province)}` : '';
    return this.request<DashboardStats>(`/dashboard/overview${params}`);
  }

  async getBatchProgress() {
    return this.request<BatchProgress[]>('/dashboard/batch-progress');
  }

  async getTransactionAnalytics(params: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    province?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.groupBy) queryParams.set('groupBy', params.groupBy);
    if (params.province) queryParams.set('province', params.province);
    return this.request<TransactionAnalytics[]>(`/dashboard/analytics/transactions?${queryParams}`);
  }

  async getFailureAnalytics(province?: string) {
    const params = province ? `?province=${encodeURIComponent(province)}` : '';
    return this.request<FailureAnalytics>(`/dashboard/analytics/failures${params}`);
  }

  async getProvinceAnalytics() {
    return this.request<ProvinceAnalytics[]>('/dashboard/analytics/provinces');
  }

  // Batches endpoints
  async getBatches(params: {
    province?: string;
    status?: string;
    cycleId?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.province) queryParams.set('province', params.province);
    if (params.status) queryParams.set('status', params.status);
    if (params.cycleId) queryParams.set('cycleId', params.cycleId);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    return this.request<PaginatedResponse<PaymentBatch>>(`/batches?${queryParams}`);
  }

  async getBatch(id: string) {
    return this.request<PaymentBatchDetail>(`/batches/${id}`);
  }

  async createBatch(data: {
    cycleId: string;
    name: string;
    province: string;
    district?: string;
    listIds: string[];
  }) {
    return this.request<PaymentBatch>('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateBatch(id: string) {
    return this.request<BatchValidationResult>(`/batches/${id}/validate`, {
      method: 'POST',
    });
  }

  async executeBatch(id: string) {
    return this.request<BatchExecutionResult>(`/batches/${id}/execute`, {
      method: 'POST',
    });
  }

  async getBatchStatus(id: string) {
    return this.request<EcoCashBatchStatus>(`/batches/${id}/status`);
  }

  async retryBatch(id: string) {
    return this.request<BatchRetryResult>(`/batches/${id}/retry`, {
      method: 'POST',
    });
  }

  async getBatchTransactions(id: string, params: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set('status', params.status);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    return this.request<PaginatedResponse<PaymentTransaction>>(`/batches/${id}/transactions?${queryParams}`);
  }

  // Beneficiaries endpoints
  async getBeneficiaries(params: {
    province?: string;
    district?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.province) queryParams.set('province', params.province);
    if (params.district) queryParams.set('district', params.district);
    if (params.status) queryParams.set('status', params.status);
    if (params.search) queryParams.set('search', params.search);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    return this.request<PaginatedResponse<Beneficiary>>(`/beneficiaries?${queryParams}`);
  }

  async getBeneficiary(id: string) {
    return this.request<BeneficiaryDetail>(`/beneficiaries/${id}`);
  }

  async createBeneficiary(data: CreateBeneficiaryData) {
    return this.request<Beneficiary>('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBeneficiary(id: string, data: Partial<CreateBeneficiaryData>) {
    return this.request<Beneficiary>(`/beneficiaries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async exitBeneficiary(id: string, exitDate: string, exitReason: string) {
    return this.request(`/beneficiaries/${id}/exit`, {
      method: 'POST',
      body: JSON.stringify({ exitDate, exitReason }),
    });
  }

  async checkDuplicateBeneficiary(nationalId?: string, ecocashNumber?: string, excludeId?: string) {
    return this.request<{ hasDuplicates: boolean; duplicates: DuplicateInfo[] }>('/beneficiaries/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ nationalId, ecocashNumber, excludeId }),
    });
  }

  // Notifications endpoints
  async getNotifications(params?: { unreadOnly?: boolean; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.unreadOnly) queryParams.set('unreadOnly', 'true');
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));
    return this.request<{ notifications: Notification[]; unreadCount: number }>(`/notifications?${queryParams}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  // Export endpoints
  async exportBatchExcel(id: string) {
    const response = await fetch(`${API_BASE_URL}/exports/batch/${id}/excel`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.blob();
  }

  async exportBatchPdf(id: string) {
    const response = await fetch(`${API_BASE_URL}/exports/batch/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.blob();
  }

  async exportBeneficiariesExcel(province?: string, status?: string) {
    const params = new URLSearchParams();
    if (province) params.set('province', province);
    if (status) params.set('status', status);
    const response = await fetch(`${API_BASE_URL}/exports/beneficiaries/excel?${params}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.blob();
  }

  async exportReconciliationExcel(startDate?: string, endDate?: string, province?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (province) params.set('province', province);
    const response = await fetch(`${API_BASE_URL}/exports/reconciliation/excel?${params}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.blob();
  }

  async getAnalytics(_params: { start_date?: string; end_date?: string; province?: string }) {
    return this.request<{
      dailyTransactions: Array<{
        date: string;
        successful: number;
        failed: number;
        total_amount: number;
      }>;
      paymentMethods: Array<{
        method: string;
        count: number;
        amount: number;
      }>;
      successRate: number;
      avgProcessingTime: number;
      monthlyGrowth: number;
      topProvinces: Array<{
        province: string;
        count: number;
        amount: number;
      }>;
    }>('/dashboard/analytics', {
      method: 'GET',
    });
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
