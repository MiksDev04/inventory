import dotenv from 'dotenv';
import process from 'node:process';
import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

const schemaPath = path.join(repoRoot, 'db', 'schema.sql');
const seedPath = path.join(repoRoot, 'db', 'seed.sql');

const host = process.env.MYSQL_HOST || '127.0.0.1';
const port = Number(process.env.MYSQL_PORT || 3306);
const user = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || '1234';

async function runSql(sql, conn) {
  // Execute statements individually to tolerate reruns (e.g., duplicate indexes)
  const statements = sql
    .split(/;\s*\n/) // split on semicolon followed by newline
    .map(s => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      // Ignore duplicate index errors on rerun
      if (err?.code === 'ER_DUP_KEYNAME') {
        console.warn('Skipping duplicate index:', err.sqlMessage);
        continue;
      }
      // Ignore when creating DB that already exists or table already exists statements handled by IF NOT EXISTS
      throw err;
    }
  }
}

async function main() {
  console.log('Connecting to MySQL...', { host, port, user });
  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  try {
    console.log('Loading schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await runSql(schema, conn);
    console.log('Schema applied');

    console.log('Loading seed.sql');
    const seed = await fs.readFile(seedPath, 'utf8');
    await runSql(seed, conn);
    console.log('Seed applied');
  } finally {
    await conn.end();
  }
  console.log('Database setup complete');
}

main().catch((err) => {
  console.error('DB setup failed:', err);
  process.exit(1);
});
