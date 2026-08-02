-- ============================================================
-- MIGRATION: Manage Chain Module Update
-- Adds company_name, gstn_no, is_active, created_at, updated_at
-- to the chains table.
-- ============================================================
-- Run this script ONCE against your existing codeb_ims database.
-- It is safe to run multiple times (uses IF NOT EXISTS checks).
-- ============================================================

USE codeb_ims;

-- Add company_name column (stores the company display name)
ALTER TABLE chains
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) NULL
        COMMENT 'Company display name (e.g. Delta Tech Pvt Ltd)';

-- Add gstn_no column (unique GST number per company)
ALTER TABLE chains
    ADD COLUMN IF NOT EXISTS gstn_no VARCHAR(15) NULL UNIQUE
        COMMENT 'GST Number — must be unique across all chains';

-- Add is_active column (soft-delete flag)
ALTER TABLE chains
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
        COMMENT 'Soft-delete flag: TRUE = active, FALSE = deleted';

-- Add created_at column
ALTER TABLE chains
    ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        COMMENT 'Timestamp when the company was first created';

-- Add updated_at column (auto-updates on row change)
ALTER TABLE chains
    ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        COMMENT 'Timestamp when the company was last updated';

-- Backfill company_name from chain_name for existing records
UPDATE chains
SET company_name = chain_name
WHERE company_name IS NULL;

-- Confirm changes
DESCRIBE chains;
SELECT 'Migration complete: chains table updated successfully.' AS STATUS;
