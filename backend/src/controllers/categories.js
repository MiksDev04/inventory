import { query } from '../db.js';

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
    const result = await query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteCategory error', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}
