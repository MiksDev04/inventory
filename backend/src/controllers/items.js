import { query } from '../db.js';

// Helper function to generate notification for stock changes
async function checkAndCreateNotification(itemId) {
  try {
    // Get item details
    const [item] = await query(
      'SELECT id, sku, name, quantity, min_quantity FROM items WHERE id = ?',
      [itemId]
    );
    
    if (!item) return;

    // Check if item needs notification
    const needsNotification = item.quantity === 0 || item.quantity < item.min_quantity;
    
    if (needsNotification) {
      // Check if notification already exists for this item (avoid duplicates)
      const existing = await query(
        `SELECT id FROM notifications 
         WHERE item_id = ? AND is_read = FALSE 
         AND type IN ('low_stock', 'out_of_stock')
         ORDER BY created_at DESC LIMIT 1`,
        [itemId]
      );

      if (existing.length === 0) {
        const type = item.quantity === 0 ? 'out_of_stock' : 'low_stock';
        const title = item.quantity === 0 
          ? `${item.name} is out of stock` 
          : `${item.name} is running low`;
        const message = item.quantity === 0
          ? `Item "${item.name}" (SKU: ${item.sku}) is currently out of stock. Please reorder immediately.`
          : `Item "${item.name}" (SKU: ${item.sku}) has only ${item.quantity} units left (minimum: ${item.min_quantity}). Consider restocking soon.`;

        // Default to user_id = 1 (admin)
        await query(
          `INSERT INTO notifications (user_id, type, title, message, item_id) VALUES (?, ?, ?, ?, ?)`,
          [1, type, title, message, itemId]
        );
      }
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error - notification is not critical to item operation
  }
}

function toUiItem(row) {
  // Ensure numeric types
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    supplier: row.supplier,
    quantity: typeof row.quantity === 'string' ? parseInt(row.quantity, 10) : row.quantity,
    minQuantity: typeof row.minQuantity === 'string' ? parseInt(row.minQuantity, 10) : row.minQuantity,
    price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
    status: row.status,
    lastUpdated: row.lastUpdated,
  };
}

export async function listItems(req, res) {
  try {
    const { page, perPage } = req.query;

    // If pagination params are not provided, return full list for backwards compatibility
    if (!page) {
      const rows = await query(`
        SELECT i.id, i.sku, i.name,
               c.name AS category,
               s.name AS supplier,
               i.quantity,
               i.min_quantity AS minQuantity,
               i.price,
               CASE
                 WHEN i.quantity <= 0 THEN 'out-of-stock'
                 WHEN i.quantity <= i.min_quantity THEN 'low-stock'
                 ELSE 'in-stock'
               END AS status,
               i.last_updated AS lastUpdated
        FROM items i
        JOIN categories c ON c.id = i.category_id
        JOIN suppliers s  ON s.id = i.supplier_id
        ORDER BY i.id
      `);
      return res.json(rows.map(toUiItem));
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const per = Math.max(1, parseInt(perPage, 10) || 20);
    const offset = (p - 1) * per;

    // total count
    const cnt = await query('SELECT COUNT(*) AS cnt FROM items');
    const total = cnt[0]?.cnt || 0;

    const rows = await query(`
      SELECT i.id, i.sku, i.name,
             c.name AS category,
             s.name AS supplier,
             i.quantity,
             i.min_quantity AS minQuantity,
             i.price,
             CASE
               WHEN i.quantity <= 0 THEN 'out-of-stock'
               WHEN i.quantity <= i.min_quantity THEN 'low-stock'
               ELSE 'in-stock'
             END AS status,
             i.last_updated AS lastUpdated
      FROM items i
      JOIN categories c ON c.id = i.category_id
      JOIN suppliers s  ON s.id = i.supplier_id
      ORDER BY i.id
      LIMIT ? OFFSET ?
    `, [per, offset]);

    res.json({ data: rows.map(toUiItem), total, page: p, perPage: per });
  } catch (err) {
    console.error('listItems error', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

export async function getItem(req, res) {
  const { id } = req.params;
  try {
    const rows = await query(`
      SELECT i.id, i.sku, i.name,
             c.name AS category,
             s.name AS supplier,
             i.quantity,
             i.min_quantity AS minQuantity,
             i.price,
             CASE
               WHEN i.quantity <= 0 THEN 'out-of-stock'
               WHEN i.quantity <= i.min_quantity THEN 'low-stock'
               ELSE 'in-stock'
             END AS status,
             i.last_updated AS lastUpdated
      FROM items i
      JOIN categories c ON c.id = i.category_id
      JOIN suppliers s  ON s.id = i.supplier_id
      WHERE i.id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(toUiItem(rows[0]));
  } catch (err) {
    console.error('getItem error', err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
}

async function resolveCategoryId(category_id, category) {
  if (category_id) return category_id;
  if (!category) return null;
  const rows = await query('SELECT id FROM categories WHERE name = ?', [category]);
  return rows[0]?.id || null;
}

async function resolveSupplierId(supplier_id, supplier) {
  if (supplier_id) return supplier_id;
  if (!supplier) return null;
  const rows = await query('SELECT id FROM suppliers WHERE name = ?', [supplier]);
  return rows[0]?.id || null;
}

export async function createItem(req, res) {
  try {
    const { sku, name, category_id, category, supplier_id, supplier, quantity, minQuantity, price, lastUpdated } = req.body;
    if (!sku || !name) return res.status(400).json({ error: 'sku and name are required' });
    const catId = await resolveCategoryId(category_id, category);
    const supId = await resolveSupplierId(supplier_id, supplier);
    if (!catId) return res.status(400).json({ error: 'Valid category_id or category name is required' });
    if (!supId) return res.status(400).json({ error: 'Valid supplier_id or supplier name is required' });

    const qty = Number.isFinite(quantity) ? quantity : parseInt(quantity ?? 0, 10);
    const minQ = Number.isFinite(minQuantity) ? minQuantity : parseInt(minQuantity ?? 0, 10);
    const prc = Number.isFinite(price) ? price : parseFloat(price ?? 0);

    const result = await query(
      `INSERT INTO items (sku, name, category_id, supplier_id, quantity, min_quantity, price, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_DATE))`,
      [sku, name, catId, supId, qty, minQ, prc, lastUpdated]
    );
    req.params.id = result.insertId; // reuse getItem
    
    // Check if notification needs to be created
    await checkAndCreateNotification(result.insertId);
    
    return getItem(req, res);
  } catch (err) {
    console.error('createItem error', err);
    if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: 'Failed to create item' });
  }
}

export async function updateItem(req, res) {
  const { id } = req.params;
  try {
    const { name, sku, category_id, category, supplier_id, supplier, quantity, minQuantity, price, lastUpdated } = req.body;

    const catId = await resolveCategoryId(category_id, category);
    const supId = await resolveSupplierId(supplier_id, supplier);

    const fields = [];
    const values = [];
    if (sku) { fields.push('sku = ?'); values.push(sku); }
    if (name) { fields.push('name = ?'); values.push(name); }
    if (catId) { fields.push('category_id = ?'); values.push(catId); }
    if (supId) { fields.push('supplier_id = ?'); values.push(supId); }
    if (quantity !== undefined) { fields.push('quantity = ?'); values.push(Number(quantity)); }
    if (minQuantity !== undefined) { fields.push('min_quantity = ?'); values.push(Number(minQuantity)); }
    if (price !== undefined) { fields.push('price = ?'); values.push(Number(price)); }
    if (lastUpdated) { fields.push('last_updated = ?'); values.push(lastUpdated); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    await query(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values);
    
    // Check if notification needs to be created after update
    await checkAndCreateNotification(id);
    
    return getItem(req, res);
  } catch (err) {
    console.error('updateItem error', err);
    if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: 'Failed to update item' });
  }
}

export async function deleteItem(req, res) {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM items WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteItem error', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}
