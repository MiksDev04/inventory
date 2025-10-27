import { query } from '../db.js';
import bcrypt from 'bcryptjs';

// Simple profile endpoints using the user_accounts table.
// For now we default to user id = 1 when user identity is not supplied.

export async function getProfile(req, res) {
  try {
    const userId = req.query.userId || 1;
  // Detect whether the table uses split first_name/last_name or a single full_name column
  const hasFirstName = (await query("SHOW COLUMNS FROM user_accounts LIKE 'first_name'"));
  let rows;
  if (hasFirstName && hasFirstName.length > 0) {
    rows = await query('SELECT id, username, email, first_name AS firstName, last_name AS lastName, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM user_accounts WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const row = rows[0];
    res.json({ id: row.id, username: row.username, email: row.email, firstName: row.firstName || '', lastName: row.lastName || '', role: row.role, isActive: !!row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt });
    return;
  }

  // Fallback to full_name column
  rows = await query('SELECT id, username, email, full_name, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM user_accounts WHERE id = ?', [userId]);
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const row = rows[0];
  // Return full_name directly for schemas that only have that column
  res.json({ id: row.id, username: row.username, email: row.email, full_name: row.full_name || '', role: row.role, isActive: !!row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt });
  } catch (err) {
    console.error('getProfile error', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.query.userId || 1;
  // Accept either split name fields or a full_name depending on schema
  const hasFirstName = (await query("SHOW COLUMNS FROM user_accounts LIKE 'first_name'"));
  if (hasFirstName && hasFirstName.length > 0) {
    const { username, firstName, lastName, email } = req.body;
    if (!username || !firstName || !lastName || !email) return res.status(400).json({ error: 'username, firstName, lastName and email are required' });

    // check username uniqueness
    const existing = await query('SELECT id FROM user_accounts WHERE username = ? AND id <> ?', [username, userId]);
    if (existing && existing.length > 0) return res.status(400).json({ error: 'username_taken' });

    await query('UPDATE user_accounts SET username = ?, first_name = ?, last_name = ?, email = ? WHERE id = ?', [username, firstName, lastName, email, userId]);
    const rows = await query('SELECT id, username, email, first_name AS firstName, last_name AS lastName, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM user_accounts WHERE id = ?', [userId]);
    const row = rows[0];
    return res.json({ id: row.id, username: row.username, email: row.email, firstName: row.firstName || '', lastName: row.lastName || '', role: row.role, isActive: !!row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt });
  }

  // full_name schema
  const { username, full_name, email } = req.body;
  if (!username || !full_name || !email) return res.status(400).json({ error: 'username, full_name and email are required' });

  // check username uniqueness
  const existingFull = await query('SELECT id FROM user_accounts WHERE username = ? AND id <> ?', [username, userId]);
  if (existingFull && existingFull.length > 0) return res.status(400).json({ error: 'username_taken' });

  await query('UPDATE user_accounts SET username = ?, full_name = ?, email = ? WHERE id = ?', [username, full_name, email, userId]);
  const rows = await query('SELECT id, username, email, full_name, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM user_accounts WHERE id = ?', [userId]);
  const row = rows[0];
  return res.json({ id: row.id, username: row.username, email: row.email, full_name: row.full_name || '', role: row.role, isActive: !!row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt });
  } catch (err) {
    console.error('updateProfile error', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.query.userId || 1;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'current and new passwords are required' });
    if (typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({ error: 'new_password_too_short' });

    const rows = await query('SELECT id, password_hash FROM user_accounts WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    const match = await bcrypt.compare(currentPassword, user.password_hash || '');
    if (!match) return res.status(400).json({ error: 'incorrect_current_password' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE user_accounts SET password_hash = ? WHERE id = ?', [newHash, userId]);
    return res.json({ success: true });
  } catch (err) {
    console.error('changePassword error', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
}
