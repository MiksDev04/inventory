import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import process from 'node:process';

dotenv.config();

console.log('📊 Initializing MySQL connection...');
console.log('Host:', process.env.MYSQL_HOST || '127.0.0.1');
console.log('Database:', process.env.MYSQL_DATABASE || 'inventory');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '1234',
  database: process.env.MYSQL_DATABASE || 'inventory',
  connectionLimit: 10,
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: true,
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('Please ensure MySQL is running and credentials in .env are correct');
  });

export async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

export default pool;
