-- Seed data for Inventory (no views required)
USE inventory;

-- Categories
INSERT INTO categories (name, description, color, icon)
VALUES
  ('Electronics', 'Electronic devices and accessories', 'blue', '⚡'),
  ('Accessories', 'Cables and small add-ons', 'purple', '🧰'),
  ('Furniture', 'Office and home furniture', 'green', '🪑'),
  ('Stationery', 'Office stationery supplies', 'orange', '📝')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Suppliers
INSERT INTO suppliers (name, email, phone, location, description, status)
VALUES
  ('TechSupply Co.', 'contact@techsupply.co', '+63 900 000 0001', 'Manila, PH', 'Electronics distributor', 'active'),
  ('Cable World', 'hello@cableworld.com', '+63 900 000 0002', 'Quezon City, PH', 'Cables and adapters', 'active'),
  ('Office Plus', 'sales@officeplus.ph', '+63 900 000 0003', 'Makati, PH', 'Office supplies and furniture', 'active'),
  ('Display Masters', 'team@displaymasters.com', '+63 900 000 0004', 'Pasig, PH', 'Monitors and displays', 'active'),
  ('Light & Home', 'support@lightandhome.com', '+63 900 000 0005', 'Taguig, PH', 'Lamps and lighting', 'active'),
  ('Paper Co.', 'info@paperco.ph', '+63 900 000 0006', 'Pasay, PH', 'Paper and notebooks', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email);

-- Items (resolve category_id/supplier_id via name lookups)
INSERT INTO items (sku, name, category_id, supplier_id, quantity, min_quantity, price, last_updated)
VALUES
  ('WM-001','Wireless Mouse', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM suppliers WHERE name='TechSupply Co.'), 145, 20, 29.99, '2025-10-14'),
  ('UC-002','USB-C Cable', (SELECT id FROM categories WHERE name='Accessories'), (SELECT id FROM suppliers WHERE name='Cable World'), 15, 50, 12.99, '2025-10-13'),
  ('LS-003','Laptop Stand', (SELECT id FROM categories WHERE name='Accessories'), (SELECT id FROM suppliers WHERE name='Office Plus'), 0, 10, 49.99, '2025-10-12'),
  ('MK-004','Mechanical Keyboard', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM suppliers WHERE name='TechSupply Co.'), 78, 15, 89.99, '2025-10-14'),
  ('MON-005','Monitor 27 inch', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM suppliers WHERE name='Display Masters'), 32, 10, 299.99, '2025-10-13'),
  ('DL-006','Desk Lamp', (SELECT id FROM categories WHERE name='Furniture'), (SELECT id FROM suppliers WHERE name='Light & Home'), 8, 20, 34.99, '2025-10-11'),
  ('OC-007','Office Chair', (SELECT id FROM categories WHERE name='Furniture'), (SELECT id FROM suppliers WHERE name='Office Plus'), 25, 5, 199.99, '2025-10-14'),
  ('NB-008','Notebook Set', (SELECT id FROM categories WHERE name='Stationery'), (SELECT id FROM suppliers WHERE name='Paper Co.'), 200, 50, 9.99, '2025-10-12')
ON DUPLICATE KEY UPDATE sku = VALUES(sku), name = VALUES(name);
-- Seed data for Inventory App (MySQL 8+)
USE inventory;

-- Categories
INSERT IGNORE INTO categories (name, description, color, icon, created_date)
VALUES
  ('Electronics', 'Electronic devices, components, and accessories', 'blue', '⚡', '2025-01-15'),
  ('Accessories', 'Cables, adapters, and peripheral accessories', 'purple', '🔧', '2025-01-16'),
  ('Furniture', 'Office and home furniture items', 'orange', '🪑', '2025-01-17'),
  ('Stationery', 'Office supplies and stationery items', 'green', '📝', '2025-01-18')
;

-- Suppliers
INSERT IGNORE INTO suppliers (name, email, phone, location, description, status, created_date)
VALUES
  ('TechSupply Co.', 'contact@techsupply.com', '+1 (555) 123-4567', 'New York, NY', 'Leading supplier of electronic components and devices', 'active', '2025-01-10'),
  ('Cable World', 'sales@cableworld.com', '+1 (555) 234-5678', 'San Francisco, CA', 'Specialized in cables and connectivity solutions', 'active', '2025-01-12'),
  ('Office Plus', 'info@officeplus.com', '+1 (555) 345-6789', 'Chicago, IL', 'Complete office furniture and equipment provider', 'active', '2025-01-14'),
  ('Display Masters', 'orders@displaymasters.com', '+1 (555) 456-7890', 'Austin, TX', 'Premium display and monitor solutions', 'active', '2025-01-15'),
  ('Light & Home', 'hello@lighthome.com', '+1 (555) 567-8901', 'Seattle, WA', 'Lighting and home office accessories', 'active', '2025-01-16'),
  ('Paper Co.', 'contact@paperco.com', '+1 (555) 678-9012', 'Boston, MA', 'Stationery and office supply specialist', 'active', '2025-01-18')
;

-- Helper: get IDs
INSERT IGNORE INTO items (sku, name, category_id, supplier_id, quantity, min_quantity, price, last_updated)
VALUES
  ('WM-001', 'Wireless Mouse', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM suppliers WHERE name='TechSupply Co.'), 145, 20, 29.99, '2025-10-14'),
  ('UC-002', 'USB-C Cable', (SELECT id FROM categories WHERE name='Accessories'), (SELECT id FROM suppliers WHERE name='Cable World'), 15, 50, 12.99, '2025-10-13'),
  ('LS-003', 'Laptop Stand', (SELECT id FROM categories WHERE name='Accessories'), (SELECT id FROM suppliers WHERE name='Office Plus'), 0, 10, 49.99, '2025-10-12'),
  ('MK-004', 'Mechanical Keyboard', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM suppliers WHERE name='TechSupply Co.'), 78, 15, 89.99, '2025-10-14'),
  ('MON-005', 'Monitor 27 inch', (SELECT id FROM categories WHERE name='Electronics'), (SELECT id FROM suppliers WHERE name='Display Masters'), 32, 10, 299.99, '2025-10-13'),
  ('DL-006', 'Desk Lamp', (SELECT id FROM categories WHERE name='Furniture'), (SELECT id FROM suppliers WHERE name='Light & Home'), 8, 20, 34.99, '2025-10-11'),
  ('OC-007', 'Office Chair', (SELECT id FROM categories WHERE name='Furniture'), (SELECT id FROM suppliers WHERE name='Office Plus'), 25, 5, 199.99, '2025-10-14'),
  ('NB-008', 'Notebook Set', (SELECT id FROM categories WHERE name='Stationery'), (SELECT id FROM suppliers WHERE name='Paper Co.'), 200, 50, 9.99, '2025-10-12');

-- User Accounts (admin account with plain password for demo - in production, use bcrypt)
-- Password: inventory123
INSERT INTO user_accounts (username, password_hash, email, first_name, last_name, phone, role, is_active)
VALUES
  ('admin', '$2b$10$rKZYQZ0cZ0cZ0cZ0cZ0cZ0eZ0cZ0cZ0cZ0cZ0cZ0cZ0cZ0cZ0cZ0c', 'admin@inventory.com', 'Justin', 'Bautista', '+1 (555) 123-4567', 'admin', TRUE)
ON DUPLICATE KEY UPDATE username = VALUES(username), email = VALUES(email), first_name = VALUES(first_name), last_name = VALUES(last_name), phone = VALUES(phone);

-- Sample Notifications (auto-generated for low stock and out of stock items)
-- Get the admin user_id
SET @admin_id = (SELECT id FROM user_accounts WHERE username = 'admin');

-- Create notifications for items based on stock levels
INSERT INTO notifications (user_id, type, title, message, item_id, is_read)
SELECT 
  @admin_id,
  CASE 
    WHEN quantity = 0 THEN 'out_of_stock'
    WHEN quantity < min_quantity THEN 'low_stock'
  END as type,
  CASE 
    WHEN quantity = 0 THEN CONCAT(name, ' is out of stock')
    WHEN quantity < min_quantity THEN CONCAT(name, ' is running low')
  END as title,
  CASE 
    WHEN quantity = 0 THEN CONCAT('Item "', name, '" (SKU: ', sku, ') is currently out of stock. Please reorder immediately.')
    WHEN quantity < min_quantity THEN CONCAT('Item "', name, '" (SKU: ', sku, ') has only ', quantity, ' units left (minimum: ', min_quantity, '). Consider restocking soon.')
  END as message,
  id as item_id,
  FALSE
FROM items
WHERE quantity = 0 OR quantity < min_quantity;

-- End seed
