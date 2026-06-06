import type { User, UserRole } from '@/types';

/**
 * User Database Schema
 * Structure: id | email | password_hash | role | province | district | access_level | is_active | last_login | created_at
 */

export const USERS_DATABASE: User[] = [
  // Provincial Officers - One per Province
  {
    id: 'po_harare',
    email: 'harare@mohcc.gov.zw',
    fullName: 'Tendai Moyo',
    role: 'provincial_officer',
    province: 'HARARE',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-25T08:00:00Z',
  },
  {
    id: 'po_bulawayo',
    email: 'bulawayo@mohcc.gov.zw',
    fullName: 'Grace Sibanda',
    role: 'provincial_officer',
    province: 'BULAWAYO',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-26T08:00:00Z',
  },
  {
    id: 'po_manicaland',
    email: 'manicaland@mohcc.gov.zw',
    fullName: 'Joseph Mutema',
    role: 'provincial_officer',
    province: 'MANICALAND',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-27T08:00:00Z',
  },
  {
    id: 'po_mash_central',
    email: 'mashonaland.central@mohcc.gov.zw',
    fullName: 'Blessing Chirume',
    role: 'provincial_officer',
    province: 'MASHONALAND CENTRAL',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-28T08:00:00Z',
  },
  {
    id: 'po_mash_east',
    email: 'mashonaland.east@mohcc.gov.zw',
    fullName: 'Kudzai Mufuka',
    role: 'provincial_officer',
    province: 'MASHONALAND EAST',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-29T08:00:00Z',
  },
  {
    id: 'po_mash_west',
    email: 'mashonaland.west@mohcc.gov.zw',
    fullName: 'Amelia Dube',
    role: 'provincial_officer',
    province: 'MASHONALAND WEST',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-30T08:00:00Z',
  },
  {
    id: 'po_masvingo',
    email: 'masvingo@mohcc.gov.zw',
    fullName: 'Nelson Chuma',
    role: 'provincial_officer',
    province: 'MASVINGO',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-31T08:00:00Z',
  },
  {
    id: 'po_mat_north',
    email: 'matabeleland.north@mohcc.gov.zw',
    fullName: 'Siphiwe Ndaba',
    role: 'provincial_officer',
    province: 'MATABELELAND NORTH',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'po_mat_south',
    email: 'matabeleland.south@mohcc.gov.zw',
    fullName: 'Mpilo Khumalo',
    role: 'provincial_officer',
    province: 'MATABELELAND SOUTH',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-06-02T08:00:00Z',
  },
  {
    id: 'po_midlands',
    email: 'midlands@mohcc.gov.zw',
    fullName: 'Charity Mpofu',
    role: 'provincial_officer',
    province: 'MIDLANDS',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-06-03T08:00:00Z',
  },

  // HR Custodians - By Province
  {
    id: 'hr_harare',
    email: 'hr.harare@mohcc.gov.zw',
    fullName: 'Memory Mupote',
    role: 'hr_custodian',
    province: 'HARARE',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-25T09:00:00Z',
  },
  {
    id: 'hr_bulawayo',
    email: 'hr.bulawayo@mohcc.gov.zw',
    fullName: 'Nomsa Ndlela',
    role: 'hr_custodian',
    province: 'BULAWAYO',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-26T09:00:00Z',
  },
  {
    id: 'hr_manicaland',
    email: 'hr.manicaland@mohcc.gov.zw',
    fullName: 'Edith Mazambani',
    role: 'hr_custodian',
    province: 'MANICALAND',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-27T09:00:00Z',
  },
  {
    id: 'hr_midlands',
    email: 'hr.midlands@mohcc.gov.zw',
    fullName: 'Pamela Muzari',
    role: 'hr_custodian',
    province: 'MIDLANDS',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-28T09:00:00Z',
  },

  // Finance Officers - National & Province-Specific
  {
    id: 'fin_harare',
    email: 'finance.harare@mohcc.gov.zw',
    fullName: 'Peter Ndlovu',
    role: 'finance_officer',
    province: 'HARARE',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-25T10:00:00Z',
  },
  {
    id: 'fin_bulawayo',
    email: 'finance.bulawayo@mohcc.gov.zw',
    fullName: 'Tawanda Chirume',
    role: 'finance_officer',
    province: 'BULAWAYO',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-26T10:00:00Z',
  },
  {
    id: 'fin_manicaland',
    email: 'finance.manicaland@mohcc.gov.zw',
    fullName: 'Rudo Mhondiwa',
    role: 'finance_officer',
    province: 'MANICALAND',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-27T10:00:00Z',
  },
  {
    id: 'fin_mash_central',
    email: 'finance.mashonaland.central@mohcc.gov.zw',
    fullName: 'Tinashe Chingoka',
    role: 'finance_officer',
    province: 'MASHONALAND CENTRAL',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-28T10:00:00Z',
  },
  {
    id: 'fin_mash_east',
    email: 'finance.mashonaland.east@mohcc.gov.zw',
    fullName: 'Shamiso Mavhunga',
    role: 'finance_officer',
    province: 'MASHONALAND EAST',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-29T10:00:00Z',
  },
  {
    id: 'fin_mash_west',
    email: 'finance.mashonaland.west@mohcc.gov.zw',
    fullName: 'Washington Munetsi',
    role: 'finance_officer',
    province: 'MASHONALAND WEST',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-30T10:00:00Z',
  },
  {
    id: 'fin_masvingo',
    email: 'finance.masvingo@mohcc.gov.zw',
    fullName: 'Patience Gwenzi',
    role: 'finance_officer',
    province: 'MASVINGO',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-31T10:00:00Z',
  },
  {
    id: 'fin_mat_north',
    email: 'finance.matabeleland.north@mohcc.gov.zw',
    fullName: 'Loveness Mutemeri',
    role: 'finance_officer',
    province: 'MATABELELAND NORTH',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'fin_mat_south',
    email: 'finance.matabeleland.south@mohcc.gov.zw',
    fullName: 'Tinotenda Kanhukamwe',
    role: 'finance_officer',
    province: 'MATABELELAND SOUTH',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-06-02T10:00:00Z',
  },
  {
    id: 'fin_midlands',
    email: 'finance.midlands@mohcc.gov.zw',
    fullName: 'Esther Masango',
    role: 'finance_officer',
    province: 'MIDLANDS',
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-06-03T10:00:00Z',
  },
  {
    id: 'fin_national',
    email: 'finance.national@mohcc.gov.zw',
    fullName: 'Dr. David Mwale',
    role: 'finance_officer',
    province: null, // National access - no province restriction
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-25T11:00:00Z',
  },

  // National Admin - Full Access
  {
    id: 'admin_national',
    email: 'admin@mohcc.gov.zw',
    fullName: 'Sarah Ncube',
    role: 'national_admin',
    province: null,
    district: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-05-20T08:00:00Z',
  },
];

/**
 * Password Database
 * In production, use bcrypt or Argon2 for password hashing
 * For demo: password123
 */
export const PASSWORD_HASHES: Record<string, string> = {
  'harare@mohcc.gov.zw': 'password123',
  'bulawayo@mohcc.gov.zw': 'password123',
  'manicaland@mohcc.gov.zw': 'password123',
  'mashonaland.central@mohcc.gov.zw': 'password123',
  'mashonaland.east@mohcc.gov.zw': 'password123',
  'mashonaland.west@mohcc.gov.zw': 'password123',
  'masvingo@mohcc.gov.zw': 'password123',
  'matabeleland.north@mohcc.gov.zw': 'password123',
  'matabeleland.south@mohcc.gov.zw': 'password123',
  'midlands@mohcc.gov.zw': 'password123',
  'hr.harare@mohcc.gov.zw': 'password123',
  'hr.bulawayo@mohcc.gov.zw': 'password123',
  'hr.manicaland@mohcc.gov.zw': 'password123',
  'hr.midlands@mohcc.gov.zw': 'password123',
  'finance.harare@mohcc.gov.zw': 'password123',
  'finance.bulawayo@mohcc.gov.zw': 'password123',
  'finance.manicaland@mohcc.gov.zw': 'password123',
  'finance.mashonaland.central@mohcc.gov.zw': 'password123',
  'finance.mashonaland.east@mohcc.gov.zw': 'password123',
  'finance.mashonaland.west@mohcc.gov.zw': 'password123',
  'finance.masvingo@mohcc.gov.zw': 'password123',
  'finance.matabeleland.north@mohcc.gov.zw': 'password123',
  'finance.matabeleland.south@mohcc.gov.zw': 'password123',
  'finance.midlands@mohcc.gov.zw': 'password123',
  'finance.national@mohcc.gov.zw': 'password123',
  'admin@mohcc.gov.zw': 'password123',
};

/**
 * User Authentication & Authorization Functions
 */

/**
 * Authenticate user by email and password
 * Returns User object if valid, null otherwise
 */
export function authenticateUser(email: string, password: string): User | null {
  console.log('authenticateUser called with:', { email, password });
  console.log('PASSWORD_HASHES has email?', !!PASSWORD_HASHES[email]);
  console.log('PASSWORD_HASHES[email]:', PASSWORD_HASHES[email]);
  console.log('Password matches?', PASSWORD_HASHES[email] === password);
  
  // Check if user exists and password matches
  if (PASSWORD_HASHES[email] && PASSWORD_HASHES[email] === password) {
    const user = USERS_DATABASE.find(u => u.email === email);
    console.log('Found user in USERS_DATABASE:', user);
    if (user && user.isActive) {
      return { ...user, lastLogin: new Date().toISOString() };
    }
  }
  return null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  return USERS_DATABASE.find(u => u.email === email) || null;
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  return USERS_DATABASE.find(u => u.id === id) || null;
}

/**
 * Get all users with a specific role
 */
export function getUsersByRole(role: UserRole): User[] {
  return USERS_DATABASE.filter(u => u.role === role);
}

/**
 * Get all users in a specific province
 */
export function getUsersByProvince(province: string): User[] {
  return USERS_DATABASE.filter(u => u.province === province);
}

/**
 * Check if user has access to a specific province
 */
export function canAccessProvince(user: User, province: string): boolean {
  // National admin and national-level finance officers can access all provinces
  if (user.role === 'national_admin') return true;
  if (user.role === 'finance_officer' && !user.province) return true;
  
  // Provincial users can only access their own province
  return user.province === province;
}

/**
 * Get access scope for a user
 */
export function getUserAccessScope(user: User): {
  scope: 'national' | 'provincial' | 'district';
  provinces: string[] | null;
  districts: string[] | null;
} {
  if (!user.province) {
    return { scope: 'national', provinces: null, districts: null };
  }
  if (user.district) {
    return { scope: 'district', provinces: [user.province], districts: [user.district] };
  }
  return { scope: 'provincial', provinces: [user.province], districts: null };
}
