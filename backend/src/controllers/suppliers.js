import { query } from '../db.js';
import pool from '../db.js';

export async function listSuppliers(req, res) {
  try {
    const rows = await query('SELECT id, name, email, phone, location, description, status, created_date AS createdDate FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('listSuppliers error', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
}

export async function getSupplier(req, res) {
  const { id } = req.params;
  try {
    const rows = await query('SELECT id, name, email, phone, location, description, status, created_date AS createdDate FROM suppliers WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getSupplier error', err);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
}

export async function createSupplier(req, res) {
  try {
    const { name, email, phone, location, description, status } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    const result = await query(
      'INSERT INTO suppliers (name, email, phone, location, description, status, created_date) VALUES (?,?,?,?,?,?, CURRENT_DATE)',
      [name, email, phone ?? null, location ?? null, description ?? null, status ?? 'active']
    );
    req.params.id = result.insertId;
    return getSupplier(req, res);
  } catch (err) {
    console.error('createSupplier error', err);
    if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Supplier name or email already exists' });
    res.status(500).json({ error: 'Failed to create supplier' });
  }
}

export async function updateSupplier(req, res) {
  const { id } = req.params;
  try {
    const { name, email, phone, location, description, status } = req.body;
    const fields = [];
    const values = [];
    if (name) { fields.push('name = ?'); values.push(name); }
    if (email) { fields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    await query(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
    return getSupplier(req, res);
  } catch (err) {
    console.error('updateSupplier error', err);
    if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Supplier name or email already exists' });
    res.status(500).json({ error: 'Failed to update supplier' });
  }
}

export async function deleteSupplier(req, res) {
  const { id } = req.params;
  try {
    // Use transaction to delete dependent items first to avoid FK constraint errors
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check if supplier exists
      const [supRows] = await conn.query('SELECT id FROM suppliers WHERE id = ?', [id]);
      if (supRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: 'Supplier not found' });
      }

      // Delete items that reference this supplier (notifications referencing items will cascade)
      await conn.query('DELETE FROM items WHERE supplier_id = ?', [id]);

      // Now delete the supplier
      const [result] = await conn.query('DELETE FROM suppliers WHERE id = ?', [id]);

      await conn.commit();
      conn.release();

      if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
      res.json({ ok: true });
    } catch (innerErr) {
      await conn.rollback();
      conn.release();
      console.error('deleteSupplier transaction error', innerErr);
      res.status(500).json({ error: 'Failed to delete supplier' });
    }
  } catch (err) {
    console.error('deleteSupplier error', err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
}
