-- ========================================================
-- CodeB Internal Management System (IMS) - Database Setup
-- ========================================================
-- Run this script in MySQL to create the full database.
-- Username: root | Password: root | Port: 3306
-- ========================================================

-- Step 1: Create the database (if not already present)
CREATE DATABASE IF NOT EXISTS codeb_ims
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE codeb_ims;

-- ========================================================
-- TABLE 1: users
-- Stores all user accounts with roles and verification
-- ========================================================
CREATE TABLE IF NOT EXISTS users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    full_name      VARCHAR(100)  NOT NULL,
    email          VARCHAR(100)  UNIQUE NOT NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    role           VARCHAR(50)   NOT NULL DEFAULT 'SALES_PERSON',
                                           -- Possible values: 'ADMIN', 'SALES_PERSON'
    status         ENUM('active', 'inactive') DEFAULT 'active',
    verification_token VARCHAR(255) NULL,
    is_verified    BOOLEAN       DEFAULT FALSE,
    reset_token    VARCHAR(255)  NULL,
    reset_token_expiry TIMESTAMP NULL,
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 2: groups_table
-- Tracks client parent groups (top-level hierarchy)
-- ========================================================
CREATE TABLE IF NOT EXISTS groups_table (
    group_id     INT AUTO_INCREMENT PRIMARY KEY,
    group_name   VARCHAR(100)  NOT NULL UNIQUE,
    description  TEXT          NULL
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 3: subzones
-- Tracks geographical subzones linked to clients
-- ========================================================
CREATE TABLE IF NOT EXISTS subzones (
    subzone_id    INT AUTO_INCREMENT PRIMARY KEY,
    subzone_name  VARCHAR(100)  NOT NULL UNIQUE,
    region        VARCHAR(100)  NULL
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 4: chains
-- Represents chains (linked to parent groups)
-- ========================================================
CREATE TABLE IF NOT EXISTS chains (
    chain_id    INT AUTO_INCREMENT PRIMARY KEY,
    chain_name  VARCHAR(100)  NOT NULL,
    group_id    INT           NULL,
    CONSTRAINT fk_chains_group
        FOREIGN KEY (group_id) REFERENCES groups_table(group_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 5: brands
-- Tracks brands (linked to parent chains)
-- ========================================================
CREATE TABLE IF NOT EXISTS brands (
    brand_id    INT AUTO_INCREMENT PRIMARY KEY,
    brand_name  VARCHAR(100)  NOT NULL,
    chain_id    INT           NULL,
    CONSTRAINT fk_brands_chain
        FOREIGN KEY (chain_id) REFERENCES chains(chain_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 6: clients
-- Stores all client profiles with hierarchy + GSTIN
-- ========================================================
CREATE TABLE IF NOT EXISTS clients (
    client_id             INT AUTO_INCREMENT PRIMARY KEY,
    name                  VARCHAR(100)  NOT NULL,
    organization_details  VARCHAR(255)  NULL,
    email                 VARCHAR(100)  NOT NULL,
    phone                 VARCHAR(20)   NULL,
    gst_number            VARCHAR(15)   NULL,
    address               TEXT          NULL,
    group_id              INT           NULL,
    chain_id              INT           NULL,
    brand_id              INT           NULL,
    subzone_id            INT           NULL,
    CONSTRAINT fk_clients_group
        FOREIGN KEY (group_id)    REFERENCES groups_table(group_id)  ON DELETE SET NULL,
    CONSTRAINT fk_clients_chain
        FOREIGN KEY (chain_id)    REFERENCES chains(chain_id)        ON DELETE SET NULL,
    CONSTRAINT fk_clients_brand
        FOREIGN KEY (brand_id)    REFERENCES brands(brand_id)        ON DELETE SET NULL,
    CONSTRAINT fk_clients_subzone
        FOREIGN KEY (subzone_id)  REFERENCES subzones(subzone_id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 7: estimates
-- Sales estimates created by the team, with GST totals
-- ========================================================
CREATE TABLE IF NOT EXISTS estimates (
    estimate_id      INT AUTO_INCREMENT PRIMARY KEY,
    estimate_number  VARCHAR(50)     NOT NULL UNIQUE,
    client_id        INT             NOT NULL,
    chain_id         INT             NULL,
    estimate_date    DATE            NOT NULL,
    validity_date    DATE            NULL,
    sub_total        DECIMAL(12, 2)  NOT NULL,
    gst_amount       DECIMAL(12, 2)  NOT NULL,
    total_amount     DECIMAL(12, 2)  NOT NULL,
    status           VARCHAR(50)     NOT NULL DEFAULT 'DRAFT',
                                              -- Values: 'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'INVOICED'
    items_json       TEXT            NOT NULL, -- JSON array of line items
    created_by       INT             NULL,
    CONSTRAINT fk_estimates_client
        FOREIGN KEY (client_id)   REFERENCES clients(client_id)    ON DELETE CASCADE,
    CONSTRAINT fk_estimates_chain
        FOREIGN KEY (chain_id)    REFERENCES chains(chain_id)      ON DELETE SET NULL,
    CONSTRAINT fk_estimates_user
        FOREIGN KEY (created_by)  REFERENCES users(user_id)        ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 8: invoices
-- Tax invoices (GST compliant) generated for clients
-- ========================================================
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id      INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number  VARCHAR(50)     NOT NULL UNIQUE,
    estimate_id     INT             NULL,       -- optional: from an estimate
    client_id       INT             NOT NULL,
    chain_id        INT             NULL,
    invoice_date    DATE            NOT NULL,
    due_date        DATE            NOT NULL,
    sub_total       DECIMAL(12, 2)  NOT NULL,
    gst_rate        DECIMAL(5, 2)   NOT NULL DEFAULT 18.00,
    gst_amount      DECIMAL(12, 2)  NOT NULL,
    total_amount    DECIMAL(12, 2)  NOT NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'UNPAID',
                                              -- Values: 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'
    created_by      INT             NULL,
    CONSTRAINT fk_invoices_estimate
        FOREIGN KEY (estimate_id) REFERENCES estimates(estimate_id)  ON DELETE SET NULL,
    CONSTRAINT fk_invoices_client
        FOREIGN KEY (client_id)   REFERENCES clients(client_id)      ON DELETE CASCADE,
    CONSTRAINT fk_invoices_chain
        FOREIGN KEY (chain_id)    REFERENCES chains(chain_id)        ON DELETE SET NULL,
    CONSTRAINT fk_invoices_user
        FOREIGN KEY (created_by)  REFERENCES users(user_id)          ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================================================
-- TABLE 9: payments
-- Tracks all payments received against invoices.
-- Auto-marks invoice as PAID when total payments >= invoice total.
-- ========================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id             INT AUTO_INCREMENT PRIMARY KEY,
    payment_number         VARCHAR(50)     NOT NULL UNIQUE,
    invoice_id             INT             NOT NULL,
    payment_date           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount                 DECIMAL(12, 2)  NOT NULL,
    payment_mode           VARCHAR(50)     NOT NULL,
                                           -- Values: 'CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE'
    transaction_reference  VARCHAR(100)    NULL,
    status                 VARCHAR(50)     NOT NULL DEFAULT 'COMPLETED',
                                           -- Values: 'PENDING', 'COMPLETED', 'FAILED'
    CONSTRAINT fk_payments_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- SEED DATA: Default Admin User
-- Email: admin@codeb.com | Password: admin123
-- (BCrypt hash of "admin123")
-- ========================================================
INSERT IGNORE INTO users (full_name, email, password_hash, role, status, is_verified)
VALUES (
    'System Administrator',
    'admin@codeb.com',
    '$2a$10$slRDMHrCQZjPzUcq0lT2TOZMJqKE5P.c/Lz.SKVXrZHmV4jLHH4lW',
    'ADMIN',
    'active',
    TRUE
);

-- ========================================================
-- VERIFY: Show all created tables
-- ========================================================
SHOW TABLES;
SELECT 'Database setup complete! All 9 tables created.' AS STATUS;
