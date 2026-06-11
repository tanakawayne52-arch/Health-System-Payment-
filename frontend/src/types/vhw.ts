export interface VhwRecord {
  province: string;
  district: string;
  healthCentre: string;
  village: string;
  ward: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  dob: string;
  sex: string;
  phoneNumber: string;
  paymentCategory: string;
  dataQuality: string;
  age: number | null;
  index: string;
  // Optional legacy fields for backward compatibility
  activeQ1?: number | null;
  activeQ2?: number | null;
  activeQ3?: number | null;
  activeQ4?: number | null;
  paymentQ1?: number | null;
  paymentQ2?: number | null;
  paymentQ3?: number | null;
  paymentQ4?: number | null;
  paymentAmtQ1Q2?: number | null;
  paymentDifference?: number;
  duplicateRecords?: number;
  duplicateStatus?: string;
  date4Calc?: string;
  healthCheck?: string | null;
  idCheck?: string | null;
  ageCheck?: string | null;
  sexCheck?: string | null;
  phoneCheck?: string | null;
  villageCheck?: string | null;
  wardCheck?: string | null;
}

export interface NationalLevelData {
  province: string;
  overUnderPayment: number;
  noPayment: number;
  overpayment: number;
  overpaymentInactiveButPaid: number;
  underpayment: number;
  underpaymentOnlyOneQuarter: number;
  underpaymentBothQuarters: number;
  underpaymentSecondQuarter: number;
  grandTotal: number;
}
