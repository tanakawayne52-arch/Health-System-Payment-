-- Run against existing fepms_db to apply schema gaps from requirements closure sprint
USE fepms_db;

ALTER TABLE payment_lists
  ADD COLUMN IF NOT EXISTS evidence_notes TEXT NULL AFTER certification_notes;

ALTER TABLE exception_requests
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) NULL AFTER reason,
  ADD COLUMN IF NOT EXISTS entity_id VARCHAR(50) NULL AFTER entity_type;
