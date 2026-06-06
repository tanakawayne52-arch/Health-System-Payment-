import { useState, useEffect, useCallback } from 'react';
import { api, Beneficiary } from '@/lib/api';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import type { User, Beneficiary as BeneficiaryType, PaymentCycle, PaymentList, PaymentBatch as PaymentBatchType, AuditLog, ExceptionRequest, VhwRecord } from '@/types';
import * as Seed from '@/data/seed'; // Import seed functions as fallback

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
  const [data, setData] = useState<User[]>(() => Seed.getUsers());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getUsers endpoint to API client when available
      // For now, use seed data
      setData(Seed.getUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useBeneficiaries() {
  const [data, setData] = useState<BeneficiaryType[]>(() => Seed.getBeneficiaries());
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
      if (result.success && result.data) {
        setData(result.data.data.map(mapApiBeneficiary));
      } else {
        setData(Seed.getBeneficiaries());
      }
    } catch (err) {
      setData(Seed.getBeneficiaries());
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
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useCycles() {
  const [data, setData] = useState<PaymentCycle[]>(() => Seed.getCycles());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getCycles endpoint to API client when available
      setData(Seed.getCycles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cycles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function usePaymentLists() {
  const [data, setData] = useState<PaymentList[]>(() => Seed.getPaymentLists());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getPaymentLists endpoint to API client when available
      setData(Seed.getPaymentLists());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment lists');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useListBeneficiaries() {
  const [data, setData] = useState<any[]>(() => Seed.getListBeneficiaries());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getListBeneficiaries endpoint to API client when available
      setData(Seed.getListBeneficiaries());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch list beneficiaries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useBatches() {
  const [data, setData] = useState<PaymentBatchType[]>(() => Seed.getBatches());
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
      if (result.success && result.data) {
        setData(result.data.data.map(mapApiBatch));
      } else {
        setData(Seed.getBatches());
      }
    } catch (err) {
      setData(Seed.getBatches());
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
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useAuditLogs() {
  const [data, setData] = useState<AuditLog[]>(() => Seed.getAuditLogs());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getAuditLogs endpoint to API client when available
      setData(Seed.getAuditLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

export function useExceptions() {
  const [data, setData] = useState<ExceptionRequest[]>(() => Seed.getExceptions());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add getExceptions endpoint to API client when available
      setData(Seed.getExceptions());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exceptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, setData, isLoading, error, fetchData] as const;
}

// VHW Master List with real-time sync
export function useVhwMasterList() {
  const [data, setData] = useState<VhwRecord[]>(() => Seed.getVhwMasterList());
  const [isLoading, _setIsLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // No need to fetch from seed on mount since initial state already has it
    // TODO: When real API is available, add actual fetching logic here
    return;
  }, []);

  return [data, setData, isLoading, error, fetchData] as const;
}

// Re-export save functions and get functions for compatibility
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
