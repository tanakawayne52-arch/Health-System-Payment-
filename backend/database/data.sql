USE fepms_db;

-- Insert Users
INSERT INTO users (id, email, full_name, role, province, district, is_active, last_login, created_at, password_hash) VALUES
('po_harare', 'harare@mohcc.gov.zw', 'Tendai Moyo', 'provincial_officer', 'HARARE', NULL, TRUE, NOW(), '2026-05-25 08:00:00', 'password123'),
('po_bulawayo', 'bulawayo@mohcc.gov.zw', 'Grace Sibanda', 'provincial_officer', 'BULAWAYO', NULL, TRUE, NOW(), '2026-05-26 08:00:00', 'password123'),
('po_manicaland', 'manicaland@mohcc.gov.zw', 'Joseph Mutema', 'provincial_officer', 'MANICALAND', NULL, TRUE, NOW(), '2026-05-27 08:00:00', 'password123'),
('po_mash_central', 'mashonaland.central@mohcc.gov.zw', 'Blessing Chirume', 'provincial_officer', 'MASHONALAND CENTRAL', NULL, TRUE, NOW(), '2026-05-28 08:00:00', 'password123'),
('po_mash_east', 'mashonaland.east@mohcc.gov.zw', 'Kudzai Mufuka', 'provincial_officer', 'MASHONALAND EAST', NULL, TRUE, NOW(), '2026-05-29 08:00:00', 'password123'),
('po_mash_west', 'mashonaland.west@mohcc.gov.zw', 'Amelia Dube', 'provincial_officer', 'MASHONALAND WEST', NULL, TRUE, NOW(), '2026-05-30 08:00:00', 'password123'),
('po_masvingo', 'masvingo@mohcc.gov.zw', 'Nelson Chuma', 'provincial_officer', 'MASVINGO', NULL, TRUE, NOW(), '2026-05-31 08:00:00', 'password123'),
('po_mat_north', 'matabeleland.north@mohcc.gov.zw', 'Siphiwe Ndaba', 'provincial_officer', 'MATABELELAND NORTH', NULL, TRUE, NOW(), '2026-06-01 08:00:00', 'password123'),
('po_mat_south', 'matabeleland.south@mohcc.gov.zw', 'Mpilo Khumalo', 'provincial_officer', 'MATABELELAND SOUTH', NULL, TRUE, NOW(), '2026-06-02 08:00:00', 'password123'),
('po_midlands', 'midlands@mohcc.gov.zw', 'Charity Mpofu', 'provincial_officer', 'MIDLANDS', NULL, TRUE, NOW(), '2026-06-03 08:00:00', 'password123'),

('hr_harare', 'hr@mohcc.gov.zw', 'Memory Mupote', 'hr_custodian', 'HARARE', NULL, TRUE, NOW(), '2026-05-25 09:00:00', 'hr123'),
('hr_bulawayo', 'hr.bulawayo@mohcc.gov.zw', 'Nomsa Ndlela', 'hr_custodian', 'BULAWAYO', NULL, TRUE, NOW(), '2026-05-26 09:00:00', 'password123'),
('hr_manicaland', 'hr.manicaland@mohcc.gov.zw', 'Edith Mazambani', 'hr_custodian', 'MANICALAND', NULL, TRUE, NOW(), '2026-05-27 09:00:00', 'password123'),
('hr_midlands', 'hr.midlands@mohcc.gov.zw', 'Pamela Muzari', 'hr_custodian', 'MIDLANDS', NULL, TRUE, NOW(), '2026-05-28 09:00:00', 'password123'),

('fin_harare', 'finance.harare@mohcc.gov.zw', 'Peter Ndlovu', 'finance_officer', 'HARARE', NULL, TRUE, NOW(), '2026-05-25 10:00:00', 'password123'),
('fin_bulawayo', 'finance.bulawayo@mohcc.gov.zw', 'Tawanda Chirume', 'finance_officer', 'BULAWAYO', NULL, TRUE, NOW(), '2026-05-26 10:00:00', 'password123'),
('fin_manicaland', 'finance.manicaland@mohcc.gov.zw', 'Rudo Mhondiwa', 'finance_officer', 'MANICALAND', NULL, TRUE, NOW(), '2026-05-27 10:00:00', 'password123'),
('fin_mash_central', 'finance.mashonaland.central@mohcc.gov.zw', 'Tinashe Chingoka', 'finance_officer', 'MASHONALAND CENTRAL', NULL, TRUE, NOW(), '2026-05-28 10:00:00', 'password123'),
('fin_mash_east', 'finance.mashonaland.east@mohcc.gov.zw', 'Shamiso Mavhunga', 'finance_officer', 'MASHONALAND EAST', NULL, TRUE, NOW(), '2026-05-29 10:00:00', 'password123'),
('fin_mash_west', 'finance.mashonaland.west@mohcc.gov.zw', 'Washington Munetsi', 'finance_officer', 'MASHONALAND WEST', NULL, TRUE, NOW(), '2026-05-30 10:00:00', 'password123'),
('fin_masvingo', 'finance.masvingo@mohcc.gov.zw', 'Patience Gwenzi', 'finance_officer', 'MASVINGO', NULL, TRUE, NOW(), '2026-05-31 10:00:00', 'password123'),
('fin_mat_north', 'finance.matabeleland.north@mohcc.gov.zw', 'Loveness Mutemeri', 'finance_officer', 'MATABELELAND NORTH', NULL, TRUE, NOW(), '2026-06-01 10:00:00', 'password123'),
('fin_mat_south', 'finance.matabeleland.south@mohcc.gov.zw', 'Tinotenda Kanhukamwe', 'finance_officer', 'MATABELELAND SOUTH', NULL, TRUE, NOW(), '2026-06-02 10:00:00', 'password123'),
('fin_midlands', 'finance.midlands@mohcc.gov.zw', 'Esther Masango', 'finance_officer', 'MIDLANDS', NULL, TRUE, NOW(), '2026-06-03 10:00:00', 'password123'),
('fin_national', 'finance.national@mohcc.gov.zw', 'Dr. David Mwale', 'finance_officer', NULL, NULL, TRUE, NOW(), '2026-05-25 11:00:00', 'password123'),

('admin_national', 'admin@mohcc.gov.zw', 'Sarah Ncube', 'national_admin', NULL, NULL, TRUE, NOW(), '2026-05-20 08:00:00', 'admin123');

-- Insert Payment Cycles
INSERT INTO payment_cycles (id, name, period_start, period_end, status, created_by, created_at) VALUES
('c1', 'Q1 2025', '2025-01-01', '2025-03-31', 'closed', 'admin_national', '2025-01-05 08:00:00'),
('c2', 'Q2 2025', '2025-04-01', '2025-06-30', 'closed', 'admin_national', '2025-04-05 08:00:00'),
('c3', 'Q3 2025', '2025-07-01', '2025-09-30', 'closed', 'admin_national', '2025-07-05 08:00:00'),
('c4', 'Q4 2025', '2025-10-01', '2025-12-31', 'closed', 'admin_national', '2025-10-05 08:00:00'),
('c5', 'Q1 2026', '2026-01-01', '2026-03-31', 'closed', 'admin_national', '2026-01-05 08:00:00'),
('c6', 'Q2 2026', '2026-04-01', '2026-06-30', 'open', 'admin_national', '2026-04-05 08:00:00');

-- Insert Audit Logs
INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, old_values, new_values, reason, ip_address, timestamp) VALUES
('a1', 'hr_bulawayo', 'Grace Sibanda', 'hr_custodian', 'ADD', 'Beneficiary', 'b1', NULL, '{"full_name": "Mary Moyo"}', NULL, '192.168.1.10', '2026-05-28 09:15:00'),
('a2', 'hr_bulawayo', 'Grace Sibanda', 'hr_custodian', 'EDIT', 'Beneficiary', 'b2', '{"status": "active"}', '{"status": "exited", "exit_reason": "Deceased"}', NULL, '192.168.1.10', '2026-05-28 10:30:00'),
('a3', 'po_harare', 'Tendai Moyo', 'provincial_officer', 'SUBMIT', 'PaymentList', 'l1', '{"status": "draft"}', '{"status": "submitted"}', NULL, '192.168.1.20', '2026-05-29 08:00:00'),
('a4', 'admin_national', 'Sarah Ncube', 'national_admin', 'CERTIFY', 'PaymentList', 'l1', '{"status": "submitted"}', '{"status": "certified"}', NULL, '192.168.1.40', '2026-05-29 14:00:00'),
('a5', 'fin_harare', 'Peter Ndlovu', 'finance_officer', 'CREATE', 'PaymentBatch', 'batch1', NULL, '{"name": "BULAWAYO - Q1 2026"}', NULL, '192.168.1.30', '2026-05-30 09:00:00'),
('a6', 'fin_harare', 'Peter Ndlovu', 'finance_officer', 'VALIDATE', 'PaymentBatch', 'batch1', '{"status": "pending"}', '{"status": "validated"}', NULL, '192.168.1.30', '2026-05-30 10:00:00'),
('a7', 'fin_harare', 'Peter Ndlovu', 'finance_officer', 'EXECUTE', 'PaymentBatch', 'batch1', '{"status": "validated"}', '{"status": "completed"}', NULL, '192.168.1.30', '2026-05-30 11:00:00'),
('a8', 'admin_national', 'Sarah Ncube', 'national_admin', 'OVERRIDE', 'PaymentList', 'l2', '{"status": "certified"}', '{"status": "draft"}', 'Emergency correction requested by provincial officer', '192.168.1.40', '2026-06-01 08:30:00'),
('a9', 'hr_bulawayo', 'Grace Sibanda', 'hr_custodian', 'ADD', 'Beneficiary', 'b100', NULL, '{"full_name": "Blessing Dube"}', NULL, '192.168.1.10', '2026-06-01 09:00:00'),
('a10', 'po_harare', 'Tendai Moyo', 'provincial_officer', 'VIEW', 'Beneficiary', 'b50', NULL, NULL, NULL, '192.168.1.20', '2026-06-01 10:00:00');

-- Insert Exception Requests
INSERT INTO exception_requests (id, type, province, requested_by, requester_name, reason, status, reviewed_by, reviewed_at, rejection_reason, created_at) VALUES
('e1', 'unlock_certified', 'HARARE', 'po_harare', 'Tendai Moyo', 'Need to correct beneficiary amount error discovered after certification', 'pending', NULL, NULL, NULL, '2026-06-01 08:00:00'),
('e2', 'override_duplicate', 'MANICALAND', 'hr_bulawayo', 'Grace Sibanda', 'Confirmed same person transferred from another district, not a real duplicate', 'pending', NULL, NULL, NULL, '2026-06-01 09:30:00'),
('e3', 'emergency_batch', 'BULAWAYO', 'fin_harare', 'Peter Ndlovu', 'Urgent payment needed for VHWs who missed last cycle due to system error', 'pending', NULL, NULL, NULL, '2026-06-01 11:00:00');

-- Helper function to convert Excel serial date to MySQL DATETIME
-- Note: Excel epoch starts at 1900-01-01, MySQL uses '1970-01-01'
-- Insert Ecopay Transactions
INSERT INTO ecopay_transactions (id, transfer_id, transfer_on, service_name, transaction_type, cr_dr, mobile_number, transaction_value, post_balance, transfer_status, transactor, currency, created_at) VALUES
('et1', 'OC250829.1417.K94121', '2025-08-29 14:23:45', 'O2C Transfer', 'MR', 'CR', '103IND01', 147101.5, 148375.5, 'TS', '783761273', 'USD', NOW()),
('et2', 'SY250904.1200.K97411', '2025-09-04 12:00:48', 'Salary Payment', 'Transaction Charge', 'DR', 'IND03', 0.5, 148193.5, 'TS', '783761273', 'USD', NOW()),
('et3', 'SY250904.1200.K97411', '2025-09-04 12:00:48', 'Salary Payment', 'MP', 'DR', '774357625', 45, 148193.5, 'TS', '783761273', 'USD', NOW()),
('et4', 'SY250904.1200.K97413', '2025-09-04 12:01:12', 'Salary Payment', 'Transaction Charge', 'DR', 'IND03', 0.5, 148284.5, 'TS', '783761273', 'USD', NOW()),
('et5', 'SY250904.1200.K97413', '2025-09-04 12:01:12', 'Salary Payment', 'MP', 'DR', '783272080', 45, 148284.5, 'TS', '783761273', 'USD', NOW()),
('et6', 'SY250904.1200.K97421', '2025-09-04 12:02:34', 'Salary Payment', 'MP', 'DR', '779809755', 45, 148057, 'TS', '783761273', 'USD', NOW()),
('et7', 'SY250904.1200.K97421', '2025-09-04 12:02:34', 'Salary Payment', 'Transaction Charge', 'DR', 'IND03', 0.5, 148057, 'TS', '783761273', 'USD', NOW());

-- Insert Role Permissions
INSERT INTO role_permissions (id, role, entity, create_permission, read_permission, update_permission, delete_permission, created_at) VALUES
-- Provincial Officer Permissions
('rp_po_1', 'provincial_officer', 'beneficiaries', TRUE, TRUE, TRUE, FALSE, NOW()),
('rp_po_2', 'provincial_officer', 'payment_lists', TRUE, TRUE, TRUE, FALSE, NOW()),
('rp_po_3', 'provincial_officer', 'payment_batches', FALSE, TRUE, FALSE, FALSE, NOW()),
('rp_po_4', 'provincial_officer', 'audit_logs', FALSE, TRUE, FALSE, FALSE, NOW()),
('rp_po_5', 'provincial_officer', 'vhw_master_list', FALSE, TRUE, FALSE, FALSE, NOW()),
('rp_po_6', 'provincial_officer', 'reports', FALSE, TRUE, FALSE, FALSE, NOW()),

-- HR Custodian Permissions
('rp_hr_1', 'hr_custodian', 'beneficiaries', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_hr_2', 'hr_custodian', 'payment_cycles', TRUE, TRUE, TRUE, FALSE, NOW()),
('rp_hr_3', 'hr_custodian', 'audit_logs', FALSE, TRUE, FALSE, FALSE, NOW()),
('rp_hr_4', 'hr_custodian', 'vhw_master_list', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_hr_5', 'hr_custodian', 'reports', FALSE, TRUE, FALSE, FALSE, NOW()),

-- Finance Officer Permissions
('rp_fin_1', 'finance_officer', 'payment_lists', FALSE, TRUE, TRUE, FALSE, NOW()),
('rp_fin_2', 'finance_officer', 'payment_batches', TRUE, TRUE, TRUE, FALSE, NOW()),
('rp_fin_3', 'finance_officer', 'payment_transactions', TRUE, TRUE, TRUE, FALSE, NOW()),
('rp_fin_4', 'finance_officer', 'reconciliation', FALSE, TRUE, FALSE, FALSE, NOW()),
('rp_fin_5', 'finance_officer', 'audit_logs', FALSE, TRUE, FALSE, FALSE, NOW()),
('rp_fin_6', 'finance_officer', 'ecopay_transactions', FALSE, TRUE, FALSE, FALSE, NOW()),
('rp_fin_7', 'finance_officer', 'reports', FALSE, TRUE, FALSE, FALSE, NOW()),

-- National Admin Permissions
('rp_admin_1', 'national_admin', 'users', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_2', 'national_admin', 'beneficiaries', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_3', 'national_admin', 'payment_cycles', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_4', 'national_admin', 'payment_lists', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_5', 'national_admin', 'payment_batches', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_6', 'national_admin', 'payment_transactions', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_7', 'national_admin', 'exception_requests', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_8', 'national_admin', 'audit_logs', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_9', 'national_admin', 'vhw_master_list', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_10', 'national_admin', 'ecopay_transactions', TRUE, TRUE, TRUE, TRUE, NOW()),
('rp_admin_11', 'national_admin', 'reports', TRUE, TRUE, TRUE, TRUE, NOW());

-- Insert Sample VHW Master List Entries
INSERT INTO vhw_master_list (id, province, district, health_centre, village, ward, first_name, last_name, id_number, dob_reformat, sex, phone_number, active_q1, active_q2, active_q3, active_q4, payment_q1, payment_q2, payment_q3, payment_q4, payment_amt_q1_q2, payment_category, payment_difference, duplicate_records, duplicate_status, date4_calc, age, health_check, id_check, age_check, sex_check, phone_check, village_check, ward_check, data_quality, index_column, created_at, updated_at) VALUES
('v1', 'BULAWAYO', 'EMAKHANDENI', 'MAGWEGWE', '29', '', 'ESNATH', 'MLAUZI', '08-307760Y73', '07/07/1947', 'F', '734326147', 1, 1, NULL, NULL, 0, 0, NULL, NULL, 0, 'No payment', -120, 1, 'Original', '7/7/1947', 78, NULL, NULL, NULL, NULL, NULL, NULL, 'Check Ward', 'Check Ward', '1', NOW(), NOW()),
('v2', 'BULAWAYO', 'EMAKHANDENI', 'EMAKHANDENI', '11', '', 'PATIENCE', 'MOYO', '73-121614P29', '01/03/1991', 'F', '771048629', 1, 1, NULL, NULL, 1, 1, NULL, NULL, 120, 'Correct', 0, 1, 'Original', '3/1/1991', 34, NULL, NULL, NULL, NULL, NULL, NULL, 'Check Ward', 'Check Ward', '1', NOW(), NOW()),
('v3', 'BULAWAYO', 'EMAKHANDENI', 'COWDRAY PARK', '28', '', 'JOYBAIRN', 'MOYO', '84-053745Q84', '24/03/1994', 'F', '771071577', 1, 1, NULL, NULL, 1, 1, NULL, NULL, 120, 'Correct', 0, 1, 'Original', '3/24/1994', 31, NULL, NULL, NULL, NULL, NULL, NULL, 'Check Ward', 'Check Ward', '1', NOW(), NOW());
