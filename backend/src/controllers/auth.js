import { query } from '../db.js';
import bcrypt from 'bcryptjs';

// Simple auth for local development: validate username/password against user_accounts
export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const rows = await query('SELECT id, username, password_hash, role, is_active AS isActive FROM user_accounts WHERE username = ?', [username]);
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    // return basic user info (do not return password hash)
    return res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, isActive: !!user.isActive } });
  } catch (err) {
    console.error('auth.login error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}
