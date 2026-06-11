CREATE DATABASE IF NOT EXISTS fepms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fepms_db;

-- Table 1: Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin') NOT NULL,
    province VARCHAR(100),
    district VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME NOT NULL,
    password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- Table 2: Beneficiaries
CREATE TABLE IF NOT EXISTS beneficiaries (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50) NOT NULL UNIQUE,
    ecocash_number VARCHAR(20) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(50) NOT NULL,
    village VARCHAR(255) NOT NULL,
    facility VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive', 'exited') NOT NULL,
    exit_date DATE,
    exit_reason VARCHAR(255),
    date_joined DATE NOT NULL,
    created_by VARCHAR(50),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 3: Payment Cycles
CREATE TABLE IF NOT EXISTS payment_cycles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status ENUM('open', 'locked', 'closed') NOT NULL,
    created_by VARCHAR(50),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 4: Payment Lists
CREATE TABLE IF NOT EXISTS payment_lists (
    id VARCHAR(50) PRIMARY KEY,
    cycle_id VARCHAR(50) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    status ENUM('draft', 'submitted', 'under_review', 'certified', 'rejected') NOT NULL,
    submitted_by VARCHAR(50),
    submitted_at DATETIME,
    reviewed_by VARCHAR(50),
    reviewed_at DATETIME,
    certification_notes TEXT,
    beneficiary_count INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (cycle_id) REFERENCES payment_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 5: Payment List Beneficiaries
CREATE TABLE IF NOT EXISTS payment_list_beneficiaries (
    id VARCHAR(50) PRIMARY KEY,
    list_id VARCHAR(50) NOT NULL,
    beneficiary_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('included', 'excluded', 'duplicate_flagged') NOT NULL,
    exclusion_reason TEXT,
    FOREIGN KEY (list_id) REFERENCES payment_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE CASCADE,
    UNIQUE KEY list_beneficiary (list_id, beneficiary_id)
) ENGINE=InnoDB;

-- Table 6: Payment Batches
CREATE TABLE IF NOT EXISTS payment_batches (
    id VARCHAR(50) PRIMARY KEY,
    cycle_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    status ENUM('pending', 'validated', 'processing', 'completed', 'failed') NOT NULL,
    total_beneficiaries INT NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    validated_by VARCHAR(50),
    validated_at DATETIME,
    executed_by VARCHAR(50),
    executed_at DATETIME,
    failure_reason TEXT,
    created_by VARCHAR(50),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (cycle_id) REFERENCES payment_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 7: Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(50) PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    beneficiary_id VARCHAR(50) NOT NULL,
    ecocash_number VARCHAR(20) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('pending', 'success', 'failed') NOT NULL,
    reference_code VARCHAR(255),
    failure_reason TEXT,
    processed_at DATETIME,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES payment_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 8: Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    old_values JSON,
    new_values JSON,
    reason TEXT,
    ip_address VARCHAR(45),
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 9: Exception Requests
CREATE TABLE IF NOT EXISTS exception_requests (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('unlock_certified', 'override_duplicate', 'emergency_batch') NOT NULL,
    province VARCHAR(100) NOT NULL,
    requested_by VARCHAR(50),
    requester_name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(50),
    reviewed_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 10: Ecopay Transactions
CREATE TABLE IF NOT EXISTS ecopay_transactions (
    id VARCHAR(50) PRIMARY KEY,
    transfer_id VARCHAR(100) NOT NULL UNIQUE,
    transfer_on DATETIME NOT NULL,
    service_name VARCHAR(100),
    transaction_type VARCHAR(100),
    cr_dr ENUM('CR', 'DR') NOT NULL,
    mobile_number VARCHAR(50),
    transaction_value DECIMAL(15,2) NOT NULL,
    post_balance DECIMAL(15,2),
    transfer_status VARCHAR(50),
    transactor VARCHAR(100),
    currency VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT NOW()
) ENGINE=InnoDB;

-- Table 11: Beneficiary Payment Status
CREATE TABLE IF NOT EXISTS beneficiary_payment_status (
    id VARCHAR(50) PRIMARY KEY,
    beneficiary_id VARCHAR(50) NOT NULL,
    cycle_id VARCHAR(50) NOT NULL,
    q1_active BOOLEAN NOT NULL DEFAULT FALSE,
    q2_active BOOLEAN NOT NULL DEFAULT FALSE,
    payment_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(100),
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE CASCADE,
    FOREIGN KEY (cycle_id) REFERENCES payment_cycles(id) ON DELETE CASCADE,
    UNIQUE KEY beneficiary_cycle (beneficiary_id, cycle_id)
) ENGINE=InnoDB;

-- Table 12: VHW Master List
CREATE TABLE IF NOT EXISTS vhw_master_list (
    id VARCHAR(50) PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    health_centre VARCHAR(255),
    village VARCHAR(255),
    ward VARCHAR(50),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    id_number VARCHAR(100),
    dob_reformat VARCHAR(50),
    sex VARCHAR(10),
    phone_number VARCHAR(50),
    active_q1 TINYINT(1),
    active_q2 TINYINT(1),
    active_q3 TINYINT(1),
    active_q4 TINYINT(1),
    payment_q1 TINYINT(1),
    payment_q2 TINYINT(1),
    payment_q3 TINYINT(1),
    payment_q4 TINYINT(1),
    payment_amt_q1_q2 DECIMAL(15,2),
    payment_category VARCHAR(255),
    payment_difference DECIMAL(15,2),
    duplicate_records INT,
    duplicate_status VARCHAR(50),
    date4_calc VARCHAR(50),
    age INT,
    health_check VARCHAR(255),
    id_check VARCHAR(255),
    age_check VARCHAR(255),
    sex_check VARCHAR(255),
    phone_check VARCHAR(255),
    village_check VARCHAR(255),
    ward_check VARCHAR(255),
    data_quality VARCHAR(255),
    index_column VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW()
) ENGINE=InnoDB;

-- Table 13: Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id VARCHAR(50) PRIMARY KEY,
    role ENUM('provincial_officer', 'hr_custodian', 'finance_officer', 'national_admin') NOT NULL,
    entity VARCHAR(50) NOT NULL,
    create_permission BOOLEAN NOT NULL DEFAULT FALSE,
    read_permission BOOLEAN NOT NULL DEFAULT TRUE,
    update_permission BOOLEAN NOT NULL DEFAULT FALSE,
    delete_permission BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT NOW()
) ENGINE=InnoDB;
