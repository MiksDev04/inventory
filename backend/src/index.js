import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import process from 'node:process';
import itemsRouter from './routes/items.js';
import categoriesRouter from './routes/categories.js';
import suppliersRouter from './routes/suppliers.js';
import notificationsRouter from './routes/notifications.js';
import reportsRouter from './routes/reports.js';
import profileRouter from './routes/profile.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'inventory-backend' });
});

app.use('/api/items', itemsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/auth', authRouter);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
