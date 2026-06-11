import type { User, Beneficiary, PaymentList, PaymentBatch } from '@/types';
import { canonicalizeProvince } from '@/utils/province';

/**
 * Filter data based on user's role and province/district
 * Provincial Officers see only their province data
 * HR Custodians see only their province data
 * Finance Officers can see all data (both national and province-specific)
 * National Admins see all data
 */

export function filterBeneficiariesByUser(beneficiaries: Beneficiary[], user: User | null): Beneficiary[] {
  if (!user) return [];
  
  if (user.role === 'national_admin' || (user.role === 'finance_officer' && !user.province)) {
    return beneficiaries; // National roles see all
  }
  
  if (user.role === 'provincial_officer' || user.role === 'hr_custodian') {
    return beneficiaries.filter(b => b.province === user.province);
  }
  
  return [];
}

export function filterPaymentListsByUser(lists: PaymentList[], user: User | null): PaymentList[] {
  if (!user) return [];
  
  if (user.role === 'national_admin' || (user.role === 'finance_officer' && !user.province)) {
    return lists; // National roles see all
  }
  
  if (user.role === 'provincial_officer' || user.role === 'hr_custodian') {
    return lists.filter(l => l.province === user.province);
  }
  
  return [];
}

export function filterBatchesByUser(batches: PaymentBatch[], user: User | null): PaymentBatch[] {
  if (!user) return [];
  
  if (user.role === 'national_admin' || (user.role === 'finance_officer' && !user.province)) {
    return batches; // National roles see all
  }
  
  if (user.role === 'provincial_officer' || user.role === 'finance_officer') {
    return batches.filter(b => b.province === user.province);
  }
  
  return [];
}

export function canCreatePaymentList(user: User | null): boolean {
  return user?.role === 'provincial_officer' || user?.role === 'hr_custodian';
}

export function canValidatePaymentList(user: User | null): boolean {
  return user?.role === 'finance_officer' || user?.role === 'national_admin';
}

export function canExecuteBatch(user: User | null): boolean {
  return user?.role === 'finance_officer' || user?.role === 'national_admin';
}

export function canViewAuditLog(user: User | null): boolean {
  return user?.role === 'national_admin' || user?.role === 'finance_officer';
}

export function getUserProvinceLabel(user: User | null): string {
  if (!user) return 'Unknown';
  if (user.role === 'national_admin') return 'National';
  if (user.role === 'finance_officer' && !user.province) return 'National';
  const cp = canonicalizeProvince(user.province);
  return cp || (user.province || 'Unassigned');
}

/**
 * Calculates the payment scenario result based on active quarters and payment amount
 * @param activeQ1 - Whether Q1 is active
 * @param activeQ2 - Whether Q2 is active
 * @param paymentAmount - The payment amount
 * @returns An object with status ('success' | 'warning' | 'error') and text description
 */
export function getPaymentScenarioResult(
  activeQ1: boolean, 
  activeQ2: boolean, 
  paymentAmount: number
): { status: 'success' | 'warning' | 'error'; text: string } {
  const activeCount = (activeQ1 ? 1 : 0) + (activeQ2 ? 1 : 0);
  const payment = paymentAmount;

  if (activeCount === 0) {
    if (payment === 0) return { status: 'success', text: 'Correct: inactive, no payment' };
    else return { status: 'error', text: 'Incorrect: inactive but paid' };
  } else if (activeCount === 1) {
    if (payment === 60) return { status: 'success', text: 'Correct: 1 quarter paid' };
    else if (payment < 60) return { status: 'warning', text: 'Underpaid for 1 quarter' };
    else return { status: 'error', text: 'Overpaid for 1 quarter' };
  } else {
    if (payment === 0) return { status: 'warning', text: 'No payment' };
    else if (payment < 60) return { status: 'warning', text: 'Partial payment for 1 quarter' };
    else if (payment === 60) return { status: 'warning', text: 'Full payment for 1 quarter only' };
    else if (payment < 120) return { status: 'warning', text: 'Underpaid for 2 quarters' };
    else if (payment === 120) return { status: 'success', text: 'Correct: fully paid for 2 quarters' };
    else return { status: 'error', text: 'Overpayment' };
  }
}
