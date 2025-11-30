# Inventory Management System

Frontend-first inventory app built with React + Vite using Firestore (Firebase) as the primary datastore.

Collections used in Firestore:
- `categories` — { name, description, color, icon, created_date, createdAt, updatedAt }
- `suppliers` — { name, email, phone, location, description, status, created_date, createdAt, updatedAt }
- `products` — (renamed from `items`) { sku, name, brand, description, category: {id,name}, supplier: {id,name}, quantity, min_quantity, price, last_updated, createdAt, updatedAt }
- `inventory_users` — { username, password_hash, email, full_name, role, is_active, created_at, updated_at }
- `notifications` — { userId, type, title, message, productId, itemSku, isRead, createdAt, readAt }
- `inventory_reports` — { period, startDate, endDate, totalProducts, totalValue, lowStockCount, outOfStockCount, notes, createdAt }

## Project Structure

```
inventory/
├── src/                        # React frontend (now contains Firestore client adapters)
│   ├── components/             # UI components (Products, Categories, Suppliers)
│   ├── lib/firebaseClient.js   # Firestore helper functions
│   ├── lib/api.js              # App API wrapper (calls firebaseClient)
│   └── App.jsx
└── README.md
```

## Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled. The repo uses an in-repo Firebase config in `src/lib/firebaseClient.js` — replace with your own config for production.

## Run locally

Install dependencies and start the dev server:

```powershell
npm install
npm run dev
```

Open http://localhost:5173

## Notes

- The backend Express server and MySQL artifacts were removed: all data access now uses Firestore via `src/lib/firebaseClient.js`.
- Authentication in this app uses a simple Firestore `inventory_users` collection and bcryptjs password hash verification in the frontend adapter (for demo only). For production, use Firebase Authentication or a secure server-side auth flow.
- Products collection is the replacement for the old `items` table and stores category/supplier id+name to reduce reads.
- If you want the old MySQL artifacts, check any archived copies in the repo history or backups.

