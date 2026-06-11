import type { User, Beneficiary, BeneficiaryStatus, PaymentCycle, PaymentList, PaymentListStatus, PaymentBatch, BatchStatus, AuditLog, ExceptionRequest } from '@/types';
import type { VhwRecord } from '@/types/vhw';
import { dispatchStorageUpdate } from '@/hooks/useStorage';
import vhwData from './vhw-masterlist.json';

export const STORAGE_KEYS = {
  USERS: 'fepms_users',
  BENEFICIARIES: 'fepms_beneficiaries',
  CYCLES: 'fepms_cycles',
  LISTS: 'fepms_lists',
  LIST_BENEFICIARIES: 'fepms_list_beneficiaries',
  BATCHES: 'fepms_batches',
  TRANSACTIONS: 'fepms_transactions',
  AUDIT_LOGS: 'fepms_audit_logs',
  EXCEPTIONS: 'fepms_exceptions',
  VHW_MASTER_LIST: 'fepms_vhw_master_list',
  SEEDED: 'fepms_seeded',
};

const FIRST_NAMES = [
  'Mary', 'Grace', 'Memory', 'Blessing', 'Patience', 'Loveness', 'Esther', 'Sarah', 'Elizabeth', 'Anna',
  'Joyce', 'Martha', 'Alice', 'Dorcas', 'Josephine', 'Agness', 'Cecilia', 'Florence', 'Linda', 'Judith',
  'Tendai', 'Farai', 'Rudo', 'Nyasha', 'Tatenda', 'Kudakwashe', 'Shamiso', 'Nyarai', 'Rutendo', 'Chido',
  'John', 'Tapiwa', 'Peter', 'Paul', 'Charles', 'George', 'David', 'Michael', 'Thomas', 'James',
  'Innocent', 'Lovemore', 'Simbarashe', 'Tinashe', 'Munashe', 'Takudzwa', 'Tinotenda', 'Kudzai', 'Tawanda', 'Washington',
];

const LAST_NAMES = [
  'Moyo', 'Sibanda', 'Ndlovu', 'Dube', 'Ncube', 'Mhlanga', 'Mudzingwa', 'Chauke', 'Mapfumo', 'Mhondiwa',
  'Makoni', 'Mutasa', 'Gumbo', 'Marufu', 'Shumba', 'Mupfumi', 'Charamba', 'Katsande', 'Machingura', 'Chingoka',
  'Tshuma', 'Bhebhe', 'Nkomo', 'Mlilo', 'Mzembi', 'Zivengwa', 'Musvibe', 'Mangena', 'Dlamini', 'Ngwenya',
  'Chauke', 'Mavhunga', 'Munetsi', 'Mufambisi', 'Gwenzi', 'Mutemeri', 'Kanhukamwe', 'Masango', 'Matombo', 'Mupamba',
];

const VILLAGES = [
  'Mberengwa Village', 'Zaka Center', 'Chivi Growth Point', 'Bikita Clinic Area', 'Gutu Rural',
  'Mwenezi Ward 5', 'Chiredzi West', 'Masvingo East', 'Jerera Township', 'Nemanwa Growth Point',
  'Murambinda', 'Buhera Center', 'Chipinge South', 'Chimanimani West', 'Nyanga North',
  'Mutare Rural', 'Makoni West', 'Mutasa South', 'Rusape East', 'Hauna Growth Point',
];

const FACILITIES = [
  'Rural Health Centre', 'District Hospital', 'Clinic', 'Community Health Centre',
  'Mission Hospital', 'Council Clinic', 'Mobile Clinic Post', 'Health Post',
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNationalId(): string {
  return `${Math.floor(10 + Math.random() * 80)}-${Math.floor(1000000 + Math.random() * 9000000)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10 + Math.random() * 90)}`;
}

function generateEcoCash(): string {
  return `077${Math.floor(2 + Math.random() * 7)}${Math.floor(100000 + Math.random() * 900000)}`;
}

export function getStorage<T>(key: string): T[] {
  try {
    const ls = localStorage.getItem(key);
    if (ls) return JSON.parse(ls);
    // Fallback to sessionStorage if localStorage does not have the key
    const ss = sessionStorage.getItem(key);
    if (ss) return JSON.parse(ss);
    return [];
  } catch {
    return [];
  }
}

export function setStorage<T>(key: string, data: T[]): void {
  const payload = JSON.stringify(data);
  try {
    localStorage.setItem(key, payload);
    dispatchStorageUpdate(key);
    return;
  } catch (error: any) {
    // Try writing to sessionStorage as a fallback
    try {
      sessionStorage.setItem(key, payload);
      console.warn(`[v0] localStorage write failed for ${key}; saved to sessionStorage instead.`);
      dispatchStorageUpdate(key);
      return;
    } catch (ssError) {
      // If sessionStorage also fails, attempt progressive truncation in localStorage
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error(`[v0] localStorage quota exceeded for key: ${key}. Attempting truncation...`);
        const truncationLevels = [0.5, 0.25, 0.1];
        for (const level of truncationLevels) {
          try {
            const truncated = JSON.stringify(data.slice(0, Math.max(1, Math.floor(data.length * level))));
            localStorage.setItem(key, truncated);
            console.warn(`[v0] Stored truncated data (${Math.floor(level * 100)}%) for key: ${key}`);
            dispatchStorageUpdate(key);
            return;
          } catch (tErr) {
            // continue to next truncation level
          }
        }
        console.error('[v0] Failed to store truncated data in localStorage. Giving up.');
      } else {
        console.error('[v0] Storage error:', error);
      }
    }
  }
}

export function isSeeded(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SEEDED) === 'true' || sessionStorage.getItem(STORAGE_KEYS.SEEDED) === 'true';
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

export function seedAllData(): void {
  // Clear seed data to ensure we're using the latest data from the master CSV
  localStorage.removeItem(STORAGE_KEYS.SEEDED);
  localStorage.removeItem(STORAGE_KEYS.VHW_MASTER_LIST);
  if (isSeeded()) return;

  const vhwMasterList = vhwData as VhwRecord[];

  // Province-specific and role-specific users
  const users: User[] = [
    // Provincial Officers (one per province)
    { id: 'po1', email: 'harare@mohcc.gov.zw', fullName: 'Tendai Moyo', role: 'provincial_officer', province: 'HARARE', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-25T08:00:00Z' },
    { id: 'po2', email: 'bulawayo@mohcc.gov.zw', fullName: 'Grace Sibanda', role: 'provincial_officer', province: 'BULAWAYO', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-26T08:00:00Z' },
    { id: 'po3', email: 'manicaland@mohcc.gov.zw', fullName: 'Joseph Mutema', role: 'provincial_officer', province: 'MANICALAND', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-27T08:00:00Z' },
    { id: 'po4', email: 'mashonaland.central@mohcc.gov.zw', fullName: 'Blessing Chirume', role: 'provincial_officer', province: 'MASHONALAND CENTRAL', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-28T08:00:00Z' },
    { id: 'po5', email: 'mashonaland.east@mohcc.gov.zw', fullName: 'Kudzai Mufuka', role: 'provincial_officer', province: 'MASHONALAND EAST', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-29T08:00:00Z' },
    { id: 'po6', email: 'mashonaland.west@mohcc.gov.zw', fullName: 'Amelia Dube', role: 'provincial_officer', province: 'MASHONALAND WEST', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-30T08:00:00Z' },
    { id: 'po7', email: 'masvingo@mohcc.gov.zw', fullName: 'Nelson Chuma', role: 'provincial_officer', province: 'MASVINGO', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-31T08:00:00Z' },
    { id: 'po8', email: 'matabeleland.north@mohcc.gov.zw', fullName: 'Siphiwe Ndaba', role: 'provincial_officer', province: 'MATABELELAND NORTH', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-01T08:00:00Z' },
    { id: 'po9', email: 'matabeleland.south@mohcc.gov.zw', fullName: 'Mpilo Khumalo', role: 'provincial_officer', province: 'MATABELELAND SOUTH', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-02T08:00:00Z' },
    { id: 'po10', email: 'midlands@mohcc.gov.zw', fullName: 'Charity Mpofu', role: 'provincial_officer', province: 'MIDLANDS', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-03T08:00:00Z' },

    // HR Custodians (one per province)
    { id: 'hr1', email: 'hr.harare@mohcc.gov.zw', fullName: 'Memory Mupote', role: 'hr_custodian', province: 'HARARE', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-25T09:00:00Z' },
    { id: 'hr2', email: 'hr.bulawayo@mohcc.gov.zw', fullName: 'Nomsa Ndlela', role: 'hr_custodian', province: 'BULAWAYO', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-26T09:00:00Z' },
    { id: 'hr3', email: 'hr.manicaland@mohcc.gov.zw', fullName: 'Edith Mazambani', role: 'hr_custodian', province: 'MANICALAND', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-27T09:00:00Z' },
    { id: 'hr4', email: 'hr.mashonaland.central@mohcc.gov.zw', fullName: 'Rutendo Mhaka', role: 'hr_custodian', province: 'MASHONALAND CENTRAL', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-28T09:00:00Z' },
    { id: 'hr5', email: 'hr.mashonaland.east@mohcc.gov.zw', fullName: 'Takudzwa Chikwanda', role: 'hr_custodian', province: 'MASHONALAND EAST', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-29T09:00:00Z' },
    { id: 'hr6', email: 'hr.mashonaland.west@mohcc.gov.zw', fullName: 'Munashe Govere', role: 'hr_custodian', province: 'MASHONALAND WEST', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-30T09:00:00Z' },
    { id: 'hr7', email: 'hr.masvingo@mohcc.gov.zw', fullName: 'Sharon Zhou', role: 'hr_custodian', province: 'MASVINGO', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-31T09:00:00Z' },
    { id: 'hr8', email: 'hr.matabeleland.north@mohcc.gov.zw', fullName: 'Zibusiso Nkomo', role: 'hr_custodian', province: 'MATABELELAND NORTH', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-01T09:00:00Z' },
    { id: 'hr9', email: 'hr.matabeleland.south@mohcc.gov.zw', fullName: 'Bheki Sibanda', role: 'hr_custodian', province: 'MATABELELAND SOUTH', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-02T09:00:00Z' },
    { id: 'hr10', email: 'hr.midlands@mohcc.gov.zw', fullName: 'Pamela Muzari', role: 'hr_custodian', province: 'MIDLANDS', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-03T09:00:00Z' },

    // Finance Officers (one per province plus national)
    { id: 'fin1', email: 'finance.harare@mohcc.gov.zw', fullName: 'Peter Ndlovu', role: 'finance_officer', province: 'HARARE', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-25T10:00:00Z' },
    { id: 'fin2', email: 'finance.bulawayo@mohcc.gov.zw', fullName: 'Tawanda Chirume', role: 'finance_officer', province: 'BULAWAYO', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-26T10:00:00Z' },
    { id: 'fin3', email: 'finance.manicaland@mohcc.gov.zw', fullName: 'Anna Marima', role: 'finance_officer', province: 'MANICALAND', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-27T10:00:00Z' },
    { id: 'fin4', email: 'finance.mashonaland.central@mohcc.gov.zw', fullName: 'Farai Chipika', role: 'finance_officer', province: 'MASHONALAND CENTRAL', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-28T10:00:00Z' },
    { id: 'fin5', email: 'finance.mashonaland.east@mohcc.gov.zw', fullName: 'Linda Nyamayaro', role: 'finance_officer', province: 'MASHONALAND EAST', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-29T10:00:00Z' },
    { id: 'fin6', email: 'finance.mashonaland.west@mohcc.gov.zw', fullName: 'Ronald Dongo', role: 'finance_officer', province: 'MASHONALAND WEST', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-30T10:00:00Z' },
    { id: 'fin7', email: 'finance.masvingo@mohcc.gov.zw', fullName: 'Joyce Mlambo', role: 'finance_officer', province: 'MASVINGO', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-31T10:00:00Z' },
    { id: 'fin8', email: 'finance.matabeleland.north@mohcc.gov.zw', fullName: 'Thabo Moyo', role: 'finance_officer', province: 'MATABELELAND NORTH', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-01T10:00:00Z' },
    { id: 'fin9', email: 'finance.matabeleland.south@mohcc.gov.zw', fullName: 'Sibongile Ncube', role: 'finance_officer', province: 'MATABELELAND SOUTH', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-02T10:00:00Z' },
    { id: 'fin10', email: 'finance.midlands@mohcc.gov.zw', fullName: 'Michael Zhou', role: 'finance_officer', province: 'MIDLANDS', district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-06-03T10:00:00Z' },
    { id: 'fin11', email: 'finance.national@mohcc.gov.zw', fullName: 'Dr. David Mwale', role: 'finance_officer', province: null, district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-25T11:00:00Z' },

    // National Admin
    { id: 'admin', email: 'admin@mohcc.gov.zw', fullName: 'Sarah Ncube', role: 'national_admin', province: null, district: null, isActive: true, lastLogin: new Date().toISOString(), createdAt: '2026-05-20T08:00:00Z' },
  ];

  const provinces = ['BULAWAYO', 'HARARE', 'MANICALAND', 'MASHONALAND CENTRAL', 'MASHONALAND EAST', 'MASHONALAND WEST', 'MASVINGO', 'MATABELELAND NORTH', 'MATABELELAND SOUTH', 'MIDLANDS'];
  const districts: Record<string, string[]> = {
    'BULAWAYO': ['Bulawayo Central', 'Bulawayo West', 'Bulawayo Suburban', 'Nkulumane'],
    'HARARE': ['Harare Central', 'Harare East', 'Harare West', 'Harare South', 'Chitungwiza', 'Epworth'],
    'MANICALAND': ['Mutare', 'Mutasa', 'Nyanga', 'Makoni', 'Chipinge', 'Buhera', 'Chimanimani'],
    'MASHONALAND CENTRAL': ['Bindura', 'Mazowe', 'Guruve', 'Mbire', 'Mount Darwin', 'Rushinga', 'Shamva', 'Muzarabani'],
    'MASHONALAND EAST': ['Marondera', 'Murewa', 'Mutoko', 'Mudzi', 'Goromonzi', 'Hwedza', 'Chikomba', 'Seke'],
    'MASHONALAND WEST': ['Chinhoyi', 'Kadoma', 'Chegutu', 'Hurungwe', 'Kariba', 'Makonde', 'Zvimba', 'Sanyati'],
    'MASVINGO': ['Masvingo', 'Bikita', 'Chivi', 'Gutu', 'Mwenezi', 'Zaka', 'Chiredzi'],
    'MATABELELAND NORTH': ['Lupane', 'Hwange', 'Victoria Falls', 'Binga', 'Nkayi', 'Tsholotsho', 'Umguza'],
    'MATABELELAND SOUTH': ['Gwanda', 'Beitbridge', 'Bulilima', 'Insiza', 'Mangwe', 'Matobo', 'Umzingwane'],
    'MIDLANDS': ['Gweru', 'Kwekwe', 'Shurugwi', 'Chirumanzu', 'Gokwe North', 'Gokwe South', 'Mberengwa', 'Zvishavane'],
  };

  const beneficiaries: Beneficiary[] = [];
  // Reduced from 22,800 to 2,800 beneficiaries to fit localStorage quota (~5MB limit)
  const provinceDistribution = [220, 380, 210, 180, 190, 240, 230, 140, 130, 280];

  let benId = 1;
  for (let p = 0; p < provinces.length; p++) {
    const province = provinces[p];
    const count = provinceDistribution[p];
    const provDistricts = districts[province];

    for (let i = 0; i < count; i++) {
      const firstName = randomPick(FIRST_NAMES);
      const lastName = randomPick(LAST_NAMES);
      const statusRoll = Math.random();
      let status: BeneficiaryStatus = 'active';
      if (statusRoll > 0.92) status = 'exited';
      else if (statusRoll > 0.82) status = 'inactive';

      beneficiaries.push({
        id: `b${benId}`,
        fullName: `${firstName} ${lastName}`,
        nationalId: generateNationalId(),
        ecocashNumber: generateEcoCash(),
        province,
        district: randomPick(provDistricts),
        ward: `Ward ${Math.floor(1 + Math.random() * 30)}`,
        village: randomPick(VILLAGES),
        facility: randomPick(FACILITIES),
        status,
        exitDate: status === 'exited' ? `202${Math.floor(3 + Math.random() * 3)}-${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}-15` : null,
        exitReason: status === 'exited' ? randomPick(['Resigned', 'Deceased', 'Transferred', 'Retired', 'Dismissed']) : null,
        dateJoined: `202${Math.floor(0 + Math.random() * 4)}-${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}-${String(Math.floor(1 + Math.random() * 28)).padStart(2, '0')}`,
        createdBy: 'u2',
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      benId++;
    }
  }

  const cycles: PaymentCycle[] = [
    { id: 'c1', name: 'Q1 2025', periodStart: '2025-01-01', periodEnd: '2025-03-31', status: 'closed', createdBy: 'u4', createdAt: '2025-01-05T08:00:00Z' },
    { id: 'c2', name: 'Q2 2025', periodStart: '2025-04-01', periodEnd: '2025-06-30', status: 'closed', createdBy: 'u4', createdAt: '2025-04-05T08:00:00Z' },
    { id: 'c3', name: 'Q3 2025', periodStart: '2025-07-01', periodEnd: '2025-09-30', status: 'closed', createdBy: 'u4', createdAt: '2025-07-05T08:00:00Z' },
    { id: 'c4', name: 'Q4 2025', periodStart: '2025-10-01', periodEnd: '2025-12-31', status: 'closed', createdBy: 'u4', createdAt: '2025-10-05T08:00:00Z' },
    { id: 'c5', name: 'Q1 2026', periodStart: '2026-01-01', periodEnd: '2026-03-31', status: 'closed', createdBy: 'u4', createdAt: '2026-01-05T08:00:00Z' },
    { id: 'c6', name: 'Q2 2026', periodStart: '2026-04-01', periodEnd: '2026-06-30', status: 'open', createdBy: 'u4', createdAt: '2026-04-05T08:00:00Z' },
  ];

  const paymentLists: PaymentList[] = [];
  const listBeneficiaries: { id: string; listId: string; beneficiaryId: string; amount: number; status: string; exclusionReason: string | null }[] = [];

  let listId = 1;
  let lbId = 1;

  for (const cycle of cycles) {
    if (cycle.status === 'open') {
      for (const prov of provinces.slice(0, 5)) {
        const count = Math.floor(50 + Math.random() * 150);
        const provBens = beneficiaries.filter(b => b.province === prov && b.status === 'active');
        if (provBens.length === 0) continue;
        const selected = provBens.slice(0, Math.min(count, provBens.length));

        paymentLists.push({
          id: `l${listId}`,
          cycleId: cycle.id,
          province: prov,
          district: null,
          name: `${prov} - ${cycle.name}`,
          status: Math.random() > 0.5 ? 'draft' : 'submitted',
          submittedBy: 'u1',
          submittedAt: Math.random() > 0.5 ? new Date().toISOString() : null,
          reviewedBy: null,
          reviewedAt: null,
          certificationNotes: null,
          beneficiaryCount: selected.length,
          totalAmount: selected.length * 100,
          createdAt: new Date().toISOString(),
        });

        for (const ben of selected) {
          listBeneficiaries.push({
            id: `lb${lbId}`,
            listId: `l${listId}`,
            beneficiaryId: ben.id,
            amount: 100,
            status: 'included',
            exclusionReason: null,
          });
          lbId++;
        }
        listId++;
      }
    } else {
      for (const prov of provinces) {
        const count = Math.floor(100 + Math.random() * 200);
        const provBens = beneficiaries.filter(b => b.province === prov && b.status === 'active');
        if (provBens.length === 0) continue;
        const selected = provBens.slice(0, Math.min(count, provBens.length));

        const statuses: PaymentListStatus[] = ['certified', 'certified', 'certified', 'certified', 'rejected'];
        const listStatus = randomPick(statuses);

        paymentLists.push({
          id: `l${listId}`,
          cycleId: cycle.id,
          province: prov,
          district: null,
          name: `${prov} - ${cycle.name}`,
          status: listStatus,
          submittedBy: 'u1',
          submittedAt: new Date(Date.parse(cycle.periodEnd) - 7 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedBy: listStatus === 'certified' ? 'u4' : null,
          reviewedAt: listStatus === 'certified' ? new Date(Date.parse(cycle.periodEnd) - 3 * 24 * 60 * 60 * 1000).toISOString() : null,
          certificationNotes: listStatus === 'certified' ? 'Approved for payment' : null,
          beneficiaryCount: selected.length,
          totalAmount: selected.length * 100,
          createdAt: new Date(Date.parse(cycle.periodStart) + 5 * 24 * 60 * 60 * 1000).toISOString(),
        });

        for (const ben of selected) {
          listBeneficiaries.push({
            id: `lb${lbId}`,
            listId: `l${listId}`,
            beneficiaryId: ben.id,
            amount: 100,
            status: 'included',
            exclusionReason: null,
          });
          lbId++;
        }
        listId++;
      }
    }
  }

  const batches: PaymentBatch[] = [];
  for (const cycle of cycles.filter(c => c.status === 'closed')) {
    for (const prov of provinces.slice(0, 6)) {
      const certLists = paymentLists.filter(l => l.cycleId === cycle.id && l.province === prov && l.status === 'certified');
      if (certLists.length === 0) continue;
      const totalBens = certLists.reduce((sum, l) => sum + l.beneficiaryCount, 0);

      const statuses: BatchStatus[] = ['completed', 'completed', 'completed', 'failed'];
      const batchStatus = randomPick(statuses);

      batches.push({
        id: `batch${batches.length + 1}`,
        cycleId: cycle.id,
        name: `${prov} - ${cycle.name}`,
        province: prov,
        district: null,
        status: batchStatus,
        totalBeneficiaries: totalBens,
        totalAmount: totalBens * 100,
        validatedBy: 'u3',
        validatedAt: new Date().toISOString(),
        executedBy: batchStatus !== 'pending' ? 'u3' : null,
        executedAt: batchStatus !== 'pending' ? new Date().toISOString() : null,
        failureReason: batchStatus === 'failed' ? 'EcoCash API timeout' : null,
        createdBy: 'u3',
        createdAt: new Date().toISOString(),
      });
    }
  }

  const auditLogs: AuditLog[] = [
    // Empty initially - will be populated by actual system actions
  ];

  const exceptions: ExceptionRequest[] = [
    { id: 'e1', type: 'unlock_certified', province: 'HARARE', requestedBy: 'u1', requesterName: 'Tendai Moyo', reason: 'Need to correct beneficiary amount error discovered after certification', status: 'pending', reviewedBy: null, reviewedAt: null, rejectionReason: null, createdAt: '2026-06-01T08:00:00Z' },
    { id: 'e2', type: 'override_duplicate', province: 'MANICALAND', requestedBy: 'u2', requesterName: 'Grace Sibanda', reason: 'Confirmed same person transferred from another district, not a real duplicate', status: 'pending', reviewedBy: null, reviewedAt: null, rejectionReason: null, createdAt: '2026-06-01T09:30:00Z' },
    { id: 'e3', type: 'emergency_batch', province: 'BULAWAYO', requestedBy: 'u3', requesterName: 'Peter Ndlovu', reason: 'Urgent payment needed for VHWs who missed last cycle due to system error', status: 'pending', reviewedBy: null, reviewedAt: null, rejectionReason: null, createdAt: '2026-06-01T11:00:00Z' },
  ];



  setStorage(STORAGE_KEYS.USERS, users);
  setStorage(STORAGE_KEYS.BENEFICIARIES, beneficiaries);
  setStorage(STORAGE_KEYS.CYCLES, cycles);
  setStorage(STORAGE_KEYS.LISTS, paymentLists);
  setStorage(STORAGE_KEYS.LIST_BENEFICIARIES, listBeneficiaries);
  setStorage(STORAGE_KEYS.BATCHES, batches);
  setStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  setStorage(STORAGE_KEYS.EXCEPTIONS, exceptions);
  // Avoid storing the full VHW master list in localStorage (can exceed quota).
  // The app will fallback to the bundled JSON via `getVhwMasterList()` when storage is empty.
  localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
}

export function getVhwMasterList(): VhwRecord[] {
  const data = getStorage<VhwRecord>(STORAGE_KEYS.VHW_MASTER_LIST);
  if (data.length === 0) {
    // Fallback to JSON if storage is empty
    return vhwData as VhwRecord[];
  }
  return data;
}

export function saveVhwMasterList(data: VhwRecord[]): void {
  setStorage(STORAGE_KEYS.VHW_MASTER_LIST, data);
}

export function getUsers(): User[] { return getStorage<User>(STORAGE_KEYS.USERS); }
export function getBeneficiaries(): Beneficiary[] { return getStorage<Beneficiary>(STORAGE_KEYS.BENEFICIARIES); }
export function getCycles(): PaymentCycle[] { return getStorage<PaymentCycle>(STORAGE_KEYS.CYCLES); }
export function getPaymentLists(): PaymentList[] { return getStorage<PaymentList>(STORAGE_KEYS.LISTS); }
export function getListBeneficiaries(): { id: string; listId: string; beneficiaryId: string; amount: number; status: string; exclusionReason: string | null }[] {
  return getStorage(STORAGE_KEYS.LIST_BENEFICIARIES);
}
export function getBatches(): PaymentBatch[] { return getStorage<PaymentBatch>(STORAGE_KEYS.BATCHES); }
export function getAuditLogs(): AuditLog[] { return getStorage<AuditLog>(STORAGE_KEYS.AUDIT_LOGS); }
export function getExceptions(): ExceptionRequest[] { return getStorage<ExceptionRequest>(STORAGE_KEYS.EXCEPTIONS); }

export function saveBeneficiaries(data: Beneficiary[]): void { setStorage(STORAGE_KEYS.BENEFICIARIES, data); }
export function savePaymentLists(data: PaymentList[]): void { setStorage(STORAGE_KEYS.LISTS, data); }
export function saveListBeneficiaries(data: { id: string; listId: string; beneficiaryId: string; amount: number; status: string; exclusionReason: string | null }[]): void {
  setStorage(STORAGE_KEYS.LIST_BENEFICIARIES, data);
}
export function saveBatches(data: PaymentBatch[]): void { setStorage(STORAGE_KEYS.BATCHES, data); }
export function saveAuditLogs(data: AuditLog[]): void { setStorage(STORAGE_KEYS.AUDIT_LOGS, data); }
export function saveExceptions(data: ExceptionRequest[]): void { setStorage(STORAGE_KEYS.EXCEPTIONS, data); }
export function saveUsers(data: User[]): void { setStorage(STORAGE_KEYS.USERS, data); }
