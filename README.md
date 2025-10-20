# Inventory Management System

Full-stack inventory app with React + Vite frontend and Express + MySQL backend.

This project uses ONLY 3 tables (no SQL views):
- categories(id, name, description, color, icon, created_date, created_at, updated_at)
- suppliers(id, name, email, phone, location, description, status, created_date, created_at, updated_at)
- items(id, sku, name, category_id, supplier_id, quantity, min_quantity, price, last_updated, created_at, updated_at)

## Project Structure

```
inventory/
├── backend/                    # Express API server (MySQL)
│   ├── src/
│   │   ├── index.js            # Server entry, routes
│   │   ├── db.js               # MySQL connection pool
│   │   ├── routes/             # Items, categories, suppliers
│   │   └── controllers/        # CRUD controllers (no views, items use joins)
│   ├── package.json
│   └── src/scripts/dbSetup.js  # Node script: applies schema + seed
├── db/                         # MySQL schema & seed
│   ├── schema.sql              # DDL (tables + indexes only)
│   └── seed.sql                # Sample data (idempotent)
├── src/                        # React frontend
│   ├── components/             # UI components (Items, Categories, Suppliers)
│   ├── lib/api.js              # Axios API helpers (CRUD)
│   └── App.jsx
└── README.md                   # This file
```

## Prerequisites

- Node.js 18+
- MySQL Server 8+ (running locally)

Default DB credentials used by backend (can be overridden via `.env`):
- host: 127.0.0.1
- port: 3306
- user: root
- password: 1234
- database: inventory

## 1) Configure backend environment (optional)

Create `backend/.env` if your MySQL differs:
```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=1234
MYSQL_DATABASE=inventory

PORT=3001
```

## 2) Initialize the database (schema + seed)

Run the Node setup script (no mysql CLI needed):

```powershell
cd backend
npm install
npm run db:setup
```

This applies `db/schema.sql` and `db/seed.sql` (safe to re-run).

## 3) Start the backend

```powershell
cd backend
npm start
```

Backend runs at: http://localhost:3001

Quick checks (optional):
```powershell
powershell -Command "(Invoke-RestMethod http://localhost:3001/api/health | ConvertTo-Json)"
powershell -Command "(Invoke-RestMethod http://localhost:3001/api/items | ConvertTo-Json)"
```

## 4) Start the frontend

```powershell
cd ..
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

Vite proxy forwards `/api/*` to `http://localhost:3001`.

## API (CRUD)

Categories
- GET /api/categories
- POST /api/categories
- PUT /api/categories/:id
- DELETE /api/categories/:id

Suppliers
- GET /api/suppliers
- POST /api/suppliers
- PUT /api/suppliers/:id
- DELETE /api/suppliers/:id

Items (uses joins — no views)
- GET /api/items → [{ id, sku, name, category, supplier, quantity, minQuantity, price, status, lastUpdated }]
- GET /api/items/:id
- POST /api/items → accepts ids or names (category_id/supplier_id or category/supplier)
- PUT /api/items/:id
- DELETE /api/items/:id

## Troubleshooting

- If ports are in use:
	```powershell
	taskkill /F /IM node.exe
	```
	Then start backend again.

- If `/api/items` fails via PowerShell, try:
	```powershell
	powershell -Command "(Invoke-RestMethod http://localhost:3001/api/items | ConvertTo-Json)"
	```
	Or open http://localhost:5173 and use the UI.

## Notes

- No SQL views are used anywhere.
- Items “status” is computed in the backend query (CASE) at request time.
- Frontend uses Axios and coerces numeric fields to avoid UI type errors.

