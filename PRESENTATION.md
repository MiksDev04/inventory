# InventoryPro — 3-Minute Demo Script

Estimated duration: ~3 minutes

---

## Opening (20–30s)
Hi, I'm [Your Name]. Today I'll walk you through InventoryPro — a simple, secure inventory management system built with a modern JavaScript stack. In the next three minutes I'll cover what the system does, show the key flows you'll demo, and summarize the architecture and technologies behind it.

---

## What the system does (30–40s)
InventoryPro tracks products, categories, and suppliers and provides tools for everyday inventory operations:
- Maintain an items catalog with SKU, stock levels, and pricing.
- Organize items into categories and manage suppliers.
- Receive real-time notifications for low or out-of-stock items.
- Manage user profile and change passwords securely.
- Generate reports and navigate an admin dashboard for analytics.

This is designed for small-to-medium retail or warehouse setups that need a lightweight, dependable UI and a stable MySQL-backed server.

---

## Quick demo flow (60–75s)
1. Login: show the login page and note that credentials are validated against the MySQL database.
2. Dashboard: open the dashboard to show the current metrics and quick links to Inventory, Categories, and Suppliers (D pa na ki click).
3. Inventory: open the Inventory view, demonstrate searching/pagination and editing an item (quantity update). Explain that changes persist immediately to the database.
4. Notifications: click the bell to open Notifications — note that the modal overlays the entire UI and shows low-stock alerts.
5. Profile & Settings: open Settings, update profile fields and change the password. For password changes, highlight the confirmation modal and describe secure password handling:
   - Current password verification
   - New password hashing with bcrypt on the server
6. Logout: click logout and show the confirmation modal, emphasizing that the modal always appears above all elements.

While you demo, point out network calls in devtools to show the backend endpoints (`/api/auth/login`, `/api/profile`, `/api/profile/password`, `/api/items`, etc.).

---

## Architecture & Tech Stack (35–45s)
- Frontend: React + Vite, Tailwind CSS for styling, modular UI primitives for dialogs, inputs and tables.
- Backend: Node.js + Express (ESM), MySQL accessed via `mysql2` promise API.
- Security: bcrypt for password hashing; server-side credential verification; parameterized SQL queries to prevent injection.
- Patterns: Small REST API surface (`/api/auth`, `/api/profile`, `/api/items`, `/api/notifications`, ...). Dialogs and large overlays use React portals to ensure they sit above any stacking context.
- Dev tooling: Vite for fast dev reload, simple node scripts for DB seeding and maintenance.

## Install commands

Run these commands from PowerShell in the project root to install all project packages:

```powershell
# Install frontend dependencies (project root)
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

That's it — the above commands install all packages declared in `package.json` (root) and `backend/package.json`.

---

## Closing (10–15s)
That’s InventoryPro — a compact, practical system for managing inventory with a real MySQL backend, secure password handling, and a focused UI. 

Thank you.
