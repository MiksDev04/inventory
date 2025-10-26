import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import process from 'node:process';

dotenv.config();

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '1234',
    database: process.env.MYSQL_DATABASE || 'inventory',
  });

  const conn = await pool.getConnection();
  try {
    console.log('Deduplicating reports: keeping latest per (period,start_date,end_date)');
    const [res] = await conn.query(`
      DELETE r1 FROM reports r1
      INNER JOIN reports r2
        ON r1.period = r2.period
        AND r1.start_date = r2.start_date
        AND r1.end_date = r2.end_date
        AND r1.id < r2.id
    `);
    console.log('Deleted rows:', res.affectedRows);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('cleanup failed', err);
  process.exit(1);
});
