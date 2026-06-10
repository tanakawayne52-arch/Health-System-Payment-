import { createPool } from 'mysql2/promise';
import { Kysely, MysqlDialect } from 'kysely';

// MySQL connection pool
const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kudombela_data_trust',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Kysely instance with MySQL dialect
export const db = new Kysely<Database>({
  dialect: new MysqlDialect(pool),
  plugins: []
});

// Database table type definitions
export interface Database {
  provinces: ProvinceTable;
  districts: DistrictTable;
  roles: RoleTable;
  facility_types: FacilityTypeTable;
  physical_facilities: PhysicalFacilityTable;
  users: UserTable;
  station_accounts: StationAccountTable;
  verification: VerificationTable;
  audit_logs: AuditLogTable;
}

// Table type definitions
export interface ProvinceTable {
  id: number;
  province_name: string;
  province_code: string;
  created_at: Date;
}

export interface DistrictTable {
  id: number;
  district_name: string;
  district_code: string;
  province_id: number | null;
  created_at: Date;
}

export interface RoleTable {
  id: number;
  role_name: string;
  role_key: string;
  role_description: string | null;
  rank_level: number;
  permissions: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface FacilityTypeTable {
  id: number;
  name: string;
}

export interface PhysicalFacilityTable {
  id: number;
  facility_name: string;
  facility_code: string;
  facility_type: string;
  province_id: number | null;
  district_id: number | null;
  facility_type_id: number;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface UserTable {
  id: number;
  first_name: string;
  last_name: string;
  ec_number: string | null;
  email: string;
  backup_email: string | null;
  phone_number: string | null;
  password_hash: string;
  plain_password: string | null;
  role_id: number;
  province_id: number | null;
  district_id: number | null;
  station_id: number | null;
  rank_level: number;
  email_verified: boolean;
  backup_email_verified: boolean;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
}

export interface StationAccountTable {
  id: number;
  station_id: number;
  account_name: string | null;
  email: string | null;
  backup_email: string | null;
  password: string | null;
  has_login: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface VerificationTable {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  created_at: Date;
}

export interface AuditLogTable {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action_type: string | null;
  target_table: string | null;
  target_id: string | null;
  details: string | null;
  created_at: Date;
}

// Database connection and query helpers
export const database = {
  // Table accessors
  provinces: db.selectFrom('provinces'),
  districts: db.selectFrom('districts'),
  roles: db.selectFrom('roles'),
  facilityTypes: db.selectFrom('facility_types'),
  physicalFacilities: db.selectFrom('physical_facilities'),
  users: db.selectFrom('users'),
  stationAccounts: db.selectFrom('station_accounts'),
  verification: db.selectFrom('verification'),
  auditLogs: db.selectFrom('audit_logs'),
  
  // CRUD operations
  create: (table: any, data: any) => db.insertInto(table).values(data).execute(),
  findFirst: (table: any, where: any) => db.selectFrom(table).where(where).executeTakeFirst(),
  findMany: (table: any, where: any) => db.selectFrom(table).where(where).execute(),
  update: (table: any, where: any, data: any) => db.updateTable(table).set(data).where(where).execute(),
  delete: (table: any, where: any) => db.deleteFrom(table).where(where).execute(),
  
  // Connection management
  close: async () => {
    await pool.end();
  },
  
  // Health check
  health: async () => {
    try {
      await db.selectFrom('provinces').limit(1).execute();
      return { status: 'healthy', database: process.env.DB_NAME || 'kudombela_data_trust' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        database: process.env.DB_NAME || 'kudombela_data_trust',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default db;
