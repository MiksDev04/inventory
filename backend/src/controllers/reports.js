import { query } from '../db.js';

export async function listReports(req, res) {
  try {
    const { page, perPage } = req.query;

    if (!page) {
      const rows = await query('SELECT id, period, start_date AS startDate, end_date AS endDate, total_items AS totalItems, total_value AS totalValue, low_stock_count AS lowStockCount, out_of_stock_count AS outOfStockCount, notes, created_at AS createdAt FROM reports ORDER BY start_date DESC, id DESC');
      return res.json(rows);
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const per = Math.max(1, parseInt(perPage, 10) || 20);
    const offset = (p - 1) * per;

    const cnt = await query('SELECT COUNT(*) AS cnt FROM reports');
    const total = cnt[0]?.cnt || 0;

    const rows = await query('SELECT id, period, start_date AS startDate, end_date AS endDate, total_items AS totalItems, total_value AS totalValue, low_stock_count AS lowStockCount, out_of_stock_count AS outOfStockCount, notes, created_at AS createdAt FROM reports ORDER BY start_date DESC, id DESC LIMIT ? OFFSET ?', [per, offset]);
    res.json({ data: rows, total, page: p, perPage: per });
  } catch (err) {
    console.error('listReports error', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

export async function getReport(req, res) {
  const { id } = req.params;
  try {
    const rows = await query('SELECT id, period, start_date AS startDate, end_date AS endDate, total_items AS totalItems, total_value AS totalValue, low_stock_count AS lowStockCount, out_of_stock_count AS outOfStockCount, notes, created_at AS createdAt FROM reports WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getReport error', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
}

// Create a report by aggregating the current items table
export async function createReport(req, res) {
  try {
    const { period, startDate, endDate, notes } = req.body;
    if (!period || !startDate || !endDate) return res.status(400).json({ error: 'period, startDate and endDate are required' });

    // Aggregate from items
    const agg = await query(`
      SELECT
        COALESCE(SUM(quantity),0) AS totalItems,
        COALESCE(SUM(quantity * price),0) AS totalValue,
        COALESCE(SUM(CASE WHEN quantity <= min_quantity AND quantity > 0 THEN 1 ELSE 0 END),0) AS lowStockCount,
        COALESCE(SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END),0) AS outOfStockCount
      FROM items
    `);

    const { totalItems, totalValue, lowStockCount, outOfStockCount } = agg[0] || { totalItems: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 };

    const result = await query(
      'INSERT INTO reports (period, start_date, end_date, total_items, total_value, low_stock_count, out_of_stock_count, notes) VALUES (?,?,?,?,?,?,?,?)',
      [period, startDate, endDate, totalItems, totalValue, lowStockCount, outOfStockCount, notes ?? null]
    );

    const insertedId = result.insertId;
    req.params.id = insertedId;
    return getReport(req, res);
  } catch (err) {
    console.error('createReport error', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
}

export async function deleteReport(req, res) {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM reports WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteReport error', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
}
