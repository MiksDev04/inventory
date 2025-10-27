/* eslint-env node */
/* global process */
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const password = process.env.MYSQL_PASSWORD || '1234';
const user = process.env.MYSQL_USER || 'root';
const host = process.env.MYSQL_HOST || '127.0.0.1';
const database = process.env.MYSQL_DATABASE || 'inventory';
const port = Number(process.env.MYSQL_PORT || 3306);

async function run() {
  const newPassword = process.argv[2] || 'inventory123';
  const conn = await mysql.createConnection({ host, port, user, password, database });
  const hash = await bcrypt.hash(newPassword, 10);
  console.log('Setting admin password to:', newPassword);
  await conn.execute('UPDATE user_accounts SET password_hash = ? WHERE id = 1', [hash]);
  console.log('Done.');
  await conn.end();
}

run().catch(err => { console.error(err); process.exit(1); });
