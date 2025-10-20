-- Inventory App Database Schema (MySQL 8+)
-- Normalized tables with FKs and useful indexes. Views removed per requirements.

-- Create database and switch to it
CREATE DATABASE IF NOT EXISTS inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE inventory;

-- Drop existing objects if re-running locally (optional; comment out in production)
-- DROP TABLE IF EXISTS items;
-- DROP TABLE IF EXISTS suppliers;
-- DROP TABLE IF EXISTS categories;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255)    NOT NULL,
  description   TEXT            NULL,
  color         VARCHAR(32)     NULL, -- e.g. 'blue', 'purple'
  icon          VARCHAR(16)     NULL, -- e.g. '⚡', '🔧'
  created_date  DATE            NOT NULL DEFAULT (CURRENT_DATE),

  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_categories PRIMARY KEY (id),
  CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255)    NOT NULL,
  email         VARCHAR(320)    NOT NULL,
  phone         VARCHAR(64)     NULL,
  location      VARCHAR(255)    NULL,
  description   TEXT            NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_date  DATE            NOT NULL DEFAULT (CURRENT_DATE),

  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_suppliers PRIMARY KEY (id),
  CONSTRAINT uq_suppliers_name UNIQUE (name),
  CONSTRAINT uq_suppliers_email UNIQUE (email)
) ENGINE=InnoDB;

-- Items
CREATE TABLE IF NOT EXISTS items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku            VARCHAR(255)    NOT NULL,
  name           VARCHAR(255)    NOT NULL,
  category_id    BIGINT UNSIGNED NOT NULL,
  supplier_id    BIGINT UNSIGNED NOT NULL,
  quantity       INT             NOT NULL CHECK (quantity >= 0),
  min_quantity   INT             NOT NULL CHECK (min_quantity >= 0),
  price          DECIMAL(12,2)   NOT NULL CHECK (price >= 0),
  last_updated   DATE            NOT NULL DEFAULT (CURRENT_DATE),

  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_items PRIMARY KEY (id),
  CONSTRAINT uq_items_sku UNIQUE (sku),
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_items_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Indexes to speed up search/join
CREATE INDEX idx_items_name_lower ON items ((LOWER(name)));
CREATE INDEX idx_items_sku_lower ON items ((LOWER(sku)));
CREATE INDEX idx_items_category_id ON items (category_id);
CREATE INDEX idx_items_supplier_id ON items (supplier_id);

-- End of schema
