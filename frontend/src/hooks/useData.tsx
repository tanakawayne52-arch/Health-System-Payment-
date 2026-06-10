import { useState, useEffect, useCallback } from 'react';
import { api, Beneficiary } from '@/lib/api';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import type { User, Beneficiary as BeneficiaryType, PaymentCycle, PaymentList, PaymentBatch as PaymentBatchType, AuditLog, ExceptionRequest, VhwRecord } from '@/types';

// Helper to map API types to app types
function mapApiBeneficiary(beneficiary: Beneficiary): BeneficiaryType {
  return {
    id: beneficiary.id,
    fullName: beneficiary.full_name,
    nationalId: beneficiary.national_id,
    ecocashNumber: beneficiary.ecocash_number,
    province: beneficiary.province,
    district: beneficiary.district,
    ward: beneficiary.ward,
    village: beneficiary.village || '',
    facility: beneficiary.facility || '',
    status: beneficiary.status,
    exitDate: beneficiary.exit_date,
    exitReason: beneficiary.exit_reason,
    dateJoined: beneficiary.date_joined,
    createdBy: '', // TODO: Add created_by to API type if needed
    createdAt: beneficiary.created_at,
    updatedAt: beneficiary.created_at, // TODO: Add updated_at to API type if needed
  };
}

function mapApiBatch(batch: any): PaymentBatchType {
  return {
    id: batch.id,
    cycleId: batch.cycle_id,
    name: batch.name,
    province: batch.province,
    district: batch.district,
    status: batch.status,
    totalBeneficiaries: batch.total_beneficiaries,
    totalAmount: batch.total_amount,
    validatedBy: null,
    validatedAt: null,
    executedBy: null,
    executedAt: batch.executed_at,
    failureReason: null,
    createdBy: '',
    createdAt: batch.created_at,
  };
}

// Real-time hooks for each data type with backward compatibility
export function useUsers() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getUsers endpoint to API client when available
      setData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useBeneficiaries() {
  const [data, setData] = useState<BeneficiaryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getBeneficiaries({
        province: user?.province || undefined,
        limit: 1000,
      });
      if (result.success && Array.isArray(result.data)) {
        setData(result.data.map(mapApiBeneficiary));
      } else {
        setData([]);
        setError(result.message || 'Failed to fetch beneficiaries');
      }
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch beneficiaries');
    } finally {
      setIsLoading(false);
    }
  }, [user?.province]);

  // Subscribe to real-time updates
  const { subscribe } = useWebSocket(user?.id);
  useEffect(() => {
    const unsubscribe = subscribe('beneficiary:update', () => {
      fetchData();
    });
    return unsubscribe;
  }, [subscribe, fetchData]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

function mapApiCycle(c: { id: string; name: string; periodStart: string; periodEnd: string; status: string; createdAt: string }): PaymentCycle {
  return {
    id: c.id,
    name: c.name,
    periodStart: c.periodStart,
    periodEnd: c.periodEnd,
    status: c.status as PaymentCycle['status'],
    createdBy: '',
    createdAt: c.createdAt,
  };
}

export function useCycles() {
  const [data, setData] = useState<PaymentCycle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getCycles();
      if (result.success && Array.isArray(result.data)) {
        setData(result.data.map(mapApiCycle));
      } else {
        setData([]);
        setError(result.message || 'Failed to fetch cycles');
      }
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch cycles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

function mapApiPaymentList(row: import('@/lib/api').PaymentListRecord): PaymentList {
  return {
    id: row.id,
    cycleId: row.cycleId,
    province: row.province,
    district: row.district,
    name: row.name,
    status: row.status as PaymentList['status'],
    submittedBy: row.submittedBy ?? '',
    submittedAt: row.submittedAt,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    certificationNotes: row.certificationNotes,
    beneficiaryCount: row.beneficiaryCount,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt,
  };
}

export function usePaymentLists() {
  const [data, setData] = useState<PaymentList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getPaymentLists({
        province: user?.province || undefined,
        limit: 100,
      });
      if (result.success && Array.isArray(result.data)) {
        setData(result.data.map(mapApiPaymentList));
      } else {
        setData([]);
        setError(result.message || 'Failed to fetch payment lists');
      }
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment lists');
    } finally {
      setIsLoading(false);
    }
  }, [user?.province]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useListBeneficiaries() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getListBeneficiaries endpoint to API client when available
      setData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch list beneficiaries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useBatches() {
  const [data, setData] = useState<PaymentBatchType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getBatches({
        province: user?.province || undefined,
        limit: 100,
      });
      if (result.success && Array.isArray(result.data)) {
        setData(result.data.map(mapApiBatch));
      } else {
        setData([]);
        setError(result.message || 'Failed to fetch batches');
      }
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch batches');
    } finally {
      setIsLoading(false);
    }
  }, [user?.province]);

  // Subscribe to real-time updates
  const { subscribe } = useWebSocket(user?.id);
  useEffect(() => {
    const unsubscribeProgress = subscribe('batch:progress', () => fetchData());
    const unsubscribeStatus = subscribe('batch:status', () => fetchData());
    const unsubscribeCompleted = subscribe('batch:completed', () => fetchData());
    return () => {
      unsubscribeProgress();
      unsubscribeStatus();
      unsubscribeCompleted();
    };
  }, [subscribe, fetchData]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useAuditLogs() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getAuditLogs({ limit: 100 });
      if (result.success && Array.isArray(result.data)) {
        setData(result.data.map(log => ({
          id: log.id,
          userId: log.userId ?? '',
          userName: log.userName,
          userRole: log.userRole,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          oldValues: log.oldValues,
          newValues: log.newValues,
          reason: log.reason,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp,
        })));
      } else {
        setData([]);
        setError(result.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useExceptions() {
  const [data, setData] = useState<ExceptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getExceptions({ limit: 50 });
      if (result.success && Array.isArray(result.data)) {
        setData(result.data.map(e => ({
          id: e.id,
          type: e.type as ExceptionRequest['type'],
          province: e.province,
          requestedBy: e.requestedBy ?? '',
          requesterName: e.requesterName,
          reason: e.reason,
          status: e.status as ExceptionRequest['status'],
          reviewedBy: e.reviewedBy,
          reviewedAt: e.reviewedAt,
          rejectionReason: e.rejectionReason,
          createdAt: e.createdAt,
        })));
      } else {
        setData([]);
        setError(result.message || 'Failed to fetch exceptions');
      }
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch exceptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

// VHW Master List with real-time sync
export function useVhwMasterList() {
  const [data, setData] = useState<VhwRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getVhwMasterList();
      if (result.success && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setError('Failed to load VHW master list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch VHW master list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => { void fetchData(); });
    return () => cancelAnimationFrame(raf);
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

// Re-export seed functions for backward compatibility (for local/test data if needed)
export {
  getUsers,
  getBeneficiaries,
  getCycles,
  getPaymentLists,
  getListBeneficiaries,
  getBatches,
  getAuditLogs,
  getExceptions,
  getVhwMasterList,
  saveBeneficiaries,
  savePaymentLists,
  saveListBeneficiaries,
  saveBatches,
  saveAuditLogs,
  saveExceptions,
  saveUsers,
  saveVhwMasterList
} from '@/data/seed';
