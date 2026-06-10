/// <reference types="vite/client" />
import type { VhwRecord } from '@/types';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
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
  private static readonly REQUEST_TIMEOUT_MS = 30000;

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

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ApiClient.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
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
            signal: controller.signal,
          });
          return this.parseResponse(retryResponse);
        }
      }

      return this.parseResponse(response);
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return { success: false, error: 'Request timed out' };
      }
      console.error('[API] Request failed:', error);
      return { success: false, error: 'Network error' };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // 204 No Content has no body by definition
    if (response.status === 204) {
      return { success: true };
    }

    // Read the body directly instead of relying on the Content-Length header.
    // Some servers (e.g. PHP's built-in dev server) omit Content-Length and use
    // chunked transfer encoding, which previously caused valid JSON bodies to be
    // discarded and treated as an empty success response.
    const text = await response.text();
    if (!text) {
      return { success: response.ok };
    }

    try {
      const parsed = JSON.parse(text) as ApiResponse<T> & { pagination?: PaginationMeta };
      if (parsed.pagination) {
        return { ...parsed, pagination: parsed.pagination };
      }
      return parsed;
    } catch (error) {
      const textPreview = text.length > 400 ? `${text.slice(0, 400)}...` : text;
      const message = `Invalid JSON response from API (${response.status} ${response.statusText}): ${textPreview}`;
      console.error('[API] Failed to parse JSON:', error, 'Response preview:', textPreview);
      return {
        success: false,
        error: message,
        message,
      };
    }
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

      // Read the body directly (do not depend on Content-Length, which some
      // servers omit when using chunked transfer encoding).
      const text = await response.text();
      if (!text) {
        this.clearTokens();
        return false;
      }

      const result = JSON.parse(text);

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

  async importBeneficiaries(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    // FormData needs to be sent without Content-Type header for fetch to set boundary
    const response = await fetch(`${API_BASE_URL}/beneficiaries/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });
    
    return this.parseResponse<{ imported: number; updated: number; errors: string[] }>(response);
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
  private async fetchBlob(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ApiClient.REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const parsed = JSON.parse(errorText);
          return Promise.reject(parsed.message || parsed.error || 'Export request failed');
        } catch {
          return Promise.reject(errorText || 'Export request failed');
        }
      }
      return response.blob();
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return Promise.reject('Request timed out');
      }
      return Promise.reject('Network error');
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async exportBatchExcel(id: string) {
    return this.fetchBlob(`${API_BASE_URL}/exports/batch/${id}/excel`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  async exportBatchPdf(id: string) {
    return this.fetchBlob(`${API_BASE_URL}/exports/batch/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  async exportBeneficiariesExcel(province?: string, status?: string) {
    const params = new URLSearchParams();
    if (province) params.set('province', province);
    if (status) params.set('status', status);
    return this.fetchBlob(`${API_BASE_URL}/exports/beneficiaries/excel?${params}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  async exportReconciliationExcel(startDate?: string, endDate?: string, province?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (province) params.set('province', province);
    return this.fetchBlob(`${API_BASE_URL}/exports/reconciliation/excel?${params}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
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

  async getCycles() {
    return this.request<Array<{
      id: string;
      name: string;
      periodStart: string;
      periodEnd: string;
      status: string;
      createdAt: string;
    }>>('/cycles');
  }

  async createCycle(data: { name: string; periodStart: string; periodEnd: string; status?: string }) {
    return this.request<{ id: string }>('/cycles', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCycleStatus(id: string, status: string) {
    return this.request(`/cycles/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  // Payment lists
  async getPaymentLists(params: {
    province?: string;
    district?: string;
    cycleId?: string;
    status?: string;
    search?: string;
    pendingCertification?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.province) queryParams.set('province', params.province);
    if (params.district) queryParams.set('district', params.district);
    if (params.cycleId) queryParams.set('cycleId', params.cycleId);
    if (params.status) queryParams.set('status', params.status);
    if (params.search) queryParams.set('search', params.search);
    if (params.pendingCertification) queryParams.set('pendingCertification', 'true');
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    return this.request<PaymentListRecord[]>(`/payment-lists?${queryParams}`);
  }

  async getPaymentList(id: string) {
    return this.request<PaymentListDetail>(`/payment-lists/${id}`);
  }

  async createPaymentList(data: {
    cycleId: string;
    name: string;
    province: string;
    district?: string;
    beneficiaryIds: string[];
    amount?: number;
    notes?: string;
    evidenceNotes?: string;
  }) {
    return this.request<{ id: string; flagged?: unknown[] }>('/payment-lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentList(id: string, data: { name?: string; beneficiaryIds?: string[]; amount?: number; notes?: string }) {
    return this.request(`/payment-lists/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deletePaymentList(id: string) {
    return this.request(`/payment-lists/${id}`, { method: 'DELETE' });
  }

  async submitPaymentList(id: string, data?: { evidenceNotes?: string; notes?: string; file?: File }) {
    if (data?.file) {
      const formData = new FormData();
      if (data.evidenceNotes) formData.append('evidenceNotes', data.evidenceNotes);
      if (data.notes) formData.append('notes', data.notes);
      formData.append('file', data.file);
      
      const response = await fetch(`${API_BASE_URL}/payment-lists/${id}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: formData,
      });
      return this.handleResponse(response);
    }
    return this.request(`/payment-lists/${id}/submit`, { method: 'POST', body: JSON.stringify(data ?? {}) });
  }

  async reviewPaymentList(id: string, notes?: string) {
    return this.request(`/payment-lists/${id}/review`, { method: 'POST', body: JSON.stringify({ notes }) });
  }

  async certifyPaymentList(id: string, certificationNotes?: string) {
    return this.request(`/payment-lists/${id}/certify`, {
      method: 'POST',
      body: JSON.stringify({ certificationNotes }),
    });
  }

  async rejectPaymentList(id: string, reason: string) {
    return this.request(`/payment-lists/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async requestUnlockPaymentList(id: string, reason: string) {
    return this.request<{ exceptionId: string }>(`/payment-lists/${id}/request-unlock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Audit logs
  async getFinanceStats() {
    return this.request<{
      totalDisbursed: number;
      pendingDisbursement: number;
      totalBatches: number;
      pendingBatches: number;
      activeCycles: number;
      cycleProgress: number;
      vhwPaymentCategoryData: { name: string; value: number; color?: string }[];
      reconciliationData: { province: string; certified: number; paid: number }[];
      recentBatches: any[];
    }>('/dashboard/finance-stats');
  }

  async getReconciliationData(params?: {
    province?: string;
    district?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.province) queryParams.set('province', params.province);
    if (params?.district) queryParams.set('district', params.district);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{
      province?: string;
      district?: string;
      certified: number;
      paid: number;
      variance: number;
    }[]>(`/dashboard/reconciliation${query}`);
  }

  async getBeneficiarySummary() {
    return this.request<{
      paid: number;
      failed: number;
      excluded: number;
    }>('/dashboard/beneficiary-summary');
  }

  async getVhwMasterList(params?: { province?: string; district?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.province) queryParams.set('province', params.province);
    if (params?.district) queryParams.set('district', params.district);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<VhwRecord[]>(`/vhw-master-list${query}`);
  }

  async getAdminStats() {
    return this.request<{
      totalUsers: number;
      activeSessions: number;
      auditEventsToday: number;
      pendingExceptions: number;
      totalVhw: number;
      vhwProvincesCount: number;
      vhwProvinceData: { province: string; count: number }[];
      vhwPaymentCategoryData: { name: string; value: number; color?: string }[];
      systemOverview: { province: string; submitted: number; certified: number }[];
      activeSessionsList: { user: string; role: string; last_activity: string; page: string }[];
    }>('/dashboard/admin-stats');
  }

  async getAuditLogs(params: {
    action?: string;
    entityType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.action) queryParams.set('action', params.action);
    if (params.entityType) queryParams.set('entityType', params.entityType);
    if (params.search) queryParams.set('search', params.search);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    return this.request<AuditLogRecord[]>(`/audit-logs?${queryParams}`);
  }

  // Exceptions
  async getExceptions(params: { province?: string; status?: string; type?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params.province) queryParams.set('province', params.province);
    if (params.status) queryParams.set('status', params.status);
    if (params.type) queryParams.set('type', params.type);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    return this.request<ExceptionRecord[]>(`/exceptions?${queryParams}`);
  }

  async approveException(id: string) {
    return this.request(`/exceptions/${id}/approve`, { method: 'POST' });
  }

  async rejectException(id: string, reason: string) {
    return this.request(`/exceptions/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  // Physical Facilities endpoints
  async getFacilities(params: {
    province_id?: number;
    facility_type_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.province_id) queryParams.set('province_id', String(params.province_id));
    if (params.facility_type_id) queryParams.set('facility_type_id', String(params.facility_type_id));
    if (params.search) queryParams.set('search', params.search);
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    return this.request<{
      results: any[];
      total: number;
      limit: number;
      offset: number;
    }>(`/facilities?${queryParams}`);
  }

  async createFacility(data: any) {
    return this.request('/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
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

export interface PaymentListRecord {
  id: string;
  cycleId: string;
  province: string;
  district: string | null;
  name: string;
  status: string;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  certificationNotes: string | null;
  beneficiaryCount: number;
  totalAmount: number;
  createdAt: string;
  cycleName?: string | null;
}

export interface PaymentListDetail extends PaymentListRecord {
  beneficiaries?: Array<{
    beneficiaryId: string;
    fullName: string;
    nationalId: string;
    ecocashNumber: string;
    district: string;
    amount: number;
    status: string;
  }>;
}

export interface AuditLogRecord {
  id: string;
  userId: string | null;
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

export interface ExceptionRecord {
  id: string;
  type: string;
  province: string;
  requestedBy: string | null;
  requesterName: string;
  reason: string;
  entityType: string | null;
  entityId: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
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
