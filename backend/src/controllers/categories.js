import { query } from '../db.js';
import pool from '../db.js';

export async function listCategories(req, res) {
  try {
    const rows = await query('SELECT id, name, description, color, icon, created_date AS createdDate FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('listCategories error', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function getCategory(req, res) {
  const { id } = req.params;
  try {
    const rows = await query('SELECT id, name, description, color, icon, created_date AS createdDate FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getCategory error', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, description, color, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'INSERT INTO categories (name, description, color, icon, created_date) VALUES (?,?,?,?, CURRENT_DATE)',
      [name, description ?? null, color ?? null, icon ?? null]
    );
    req.params.id = result.insertId;
    return getCategory(req, res);
  } catch (err) {
    console.error('createCategory error', err);
    if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Category name already exists' });
    res.status(500).json({ error: 'Failed to create category' });
  }
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  try {
    const { name, description, color, icon } = req.body;
    const fields = [];
    const values = [];
    if (name) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (color !== undefined) { fields.push('color = ?'); values.push(color); }
    if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return getCategory(req, res);
  } catch (err) {
    console.error('updateCategory error', err);
    if (err?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Category name already exists' });
    res.status(500).json({ error: 'Failed to update category' });
  }
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  try {
    // Use transaction to delete dependent items first to avoid FK constraint errors
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check if category exists
      const [catRows] = await conn.query('SELECT id FROM categories WHERE id = ?', [id]);
      if (catRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: 'Category not found' });
      }

      // Delete items that reference this category (notifications referencing items will cascade)
      await conn.query('DELETE FROM items WHERE category_id = ?', [id]);

      // Now delete the category
      const [result] = await conn.query('DELETE FROM categories WHERE id = ?', [id]);

      await conn.commit();
      conn.release();

      if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
      res.json({ ok: true });
    } catch (innerErr) {
      await conn.rollback();
      conn.release();
      console.error('deleteCategory transaction error', innerErr);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  } catch (err) {
    console.error('deleteCategory error', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}
