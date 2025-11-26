import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function docData(d) {
  const raw = d.data ? d.data() : d;
  const converted = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (v && typeof v.toDate === 'function') converted[k] = v.toDate();
    else converted[k] = v;
  }
  // Normalize fields
  if (converted.created_at && !converted.createdAt) {
    converted.createdAt = converted.created_at;
    converted.createdDate = converted.createdDate || converted.created_at;
  }
  if (converted.updated_at && !converted.updatedAt) converted.updatedAt = converted.updated_at;
  if (converted.full_name && !converted.fullName) converted.fullName = converted.full_name;
  if (converted.is_active !== undefined && converted.isActive === undefined) converted.isActive = converted.is_active;
  return { id: d.id, ...converted };
}

// --- Products ---
export async function listProducts({ limit = 1000 } = {}) {
  const q = query(collection(db, 'products'), orderBy('created_at'));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push(docData(d)));
  if (limit && Number.isFinite(Number(limit))) return arr.slice(0, Number(limit));
  return arr;
}

export async function getProduct(id) {
  const d = await getDoc(doc(db, 'products', String(id)));
  if (!d.exists()) return null;
  return docData(d);
}

export async function createProduct(payload) {
  const p = { ...payload, created_at: serverTimestamp(), updated_at: serverTimestamp() };
  const ref = await addDoc(collection(db, 'products'), p);
  return ref.id;
}

export async function updateProduct(id, payload) {
  const ref = doc(db, 'products', String(id));
  await updateDoc(ref, { ...payload, updated_at: serverTimestamp() });
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', String(id)));
}

// --- Categories ---
export async function listCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('created_at')));
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res;
}

export async function findCategoryByName(name) {
  const q = query(collection(db, 'categories'), where('name', '==', name));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? docData(first) : null;
}

export async function createCategory(payload) {
  const p = { ...payload, created_at: serverTimestamp(), updated_at: serverTimestamp() };
  const r = await addDoc(collection(db, 'categories'), p);
  return r.id;
}

export async function updateCategory(id, payload) {
  await updateDoc(doc(db, 'categories', String(id)), { ...payload, updated_at: serverTimestamp() });
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, 'categories', String(id)));
}

// --- Suppliers ---
export async function listSuppliers() {
  const snap = await getDocs(query(collection(db, 'suppliers'), orderBy('created_at')));
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res;
}

export async function findSupplierByName(name) {
  const q = query(collection(db, 'suppliers'), where('name', '==', name));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? docData(first) : null;
}

export async function createSupplier(payload) {
  const p = { ...payload, created_at: serverTimestamp(), updated_at: serverTimestamp() };
  const r = await addDoc(collection(db, 'suppliers'), p);
  return r.id;
}

export async function updateSupplier(id, payload) {
  await updateDoc(doc(db, 'suppliers', String(id)), { ...payload, updated_at: serverTimestamp() });
}

export async function deleteSupplier(id) {
  await deleteDoc(doc(db, 'suppliers', String(id)));
}

// --- Users (auth) ---
export async function listUsers() {
  const snap = await getDocs(collection(db, 'user_accounts'));
  const users = [];
  snap.forEach(d => users.push(docData(d)));
  return users;
}

export async function getUserByUsername(username) {
  const q = query(collection(db, 'user_accounts'), where('username', '==', username));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? docData(first) : null;
}

export async function getUserById(id) {
  const d = await getDoc(doc(db, 'user_accounts', String(id)));
  return d.exists() ? docData(d) : null;
}

export async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function comparePassword(password, storedHash) {
  if (!storedHash) return false;
  const h = await hashPassword(password);
  return h === storedHash;
}

export async function createUser(payload) {
  const p = { ...payload };
  if (p.password) {
    p.password_hash = await hashPassword(p.password);
    delete p.password;
  }
  p.created_at = serverTimestamp();
  p.updated_at = serverTimestamp();
  const r = await addDoc(collection(db, 'user_accounts'), p);
  return r.id;
}

export async function updateUser(id, payload) {
  const p = { ...payload };
  if (p.password) {
    p.password_hash = await hashPassword(p.password);
    delete p.password;
  }
  await updateDoc(doc(db, 'user_accounts', String(id)), { ...p, updated_at: serverTimestamp() });
}

export async function verifyLogin(username, password) {
  // Get user from database
  const user = await getUserByUsername(username);
  if (!user) return null;

  // Compare password with hashed value in database
  const isHashedMatch = await comparePassword(password, user.password_hash || '');
  if (isHashedMatch) {
    return user;
  }

  return null;
}

// --- Notifications ---
export async function listNotificationsForUser(userId, { limit = 100 } = {}) {
  const q = query(collection(db, 'notifications'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res.slice(0, limit);
}

export async function createNotification(payload) {
  const p = { ...payload, created_at: serverTimestamp(), is_read: !!payload.is_read };
  const r = await addDoc(collection(db, 'notifications'), p);
  return r.id;
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, 'notifications', String(id)), { is_read: true, read_at: serverTimestamp() });
}

export async function markAllNotificationsRead(userId) {
  const q = query(collection(db, 'notifications'), where('user_id', '==', userId), where('is_read', '==', false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.forEach(d => batch.update(d.ref, { is_read: true, read_at: serverTimestamp() }));
  await batch.commit();
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, 'notifications', String(id)));
}

// --- Reports ---
export async function listReports() {
  const snap = await getDocs(query(collection(db, 'reports'), orderBy('created_at', 'desc')));
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res;
}

export async function createReport(payload) {
  const p = { ...payload, created_at: serverTimestamp() };
  const r = await addDoc(collection(db, 'reports'), p);
  return r.id;
}

export async function deleteReport(id) {
  await deleteDoc(doc(db, 'reports', String(id)));
}

export default {
  // products
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // categories
  listCategories,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  // suppliers
  listSuppliers,
  findSupplierByName,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  // users
  listUsers,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  // notifications
  listNotificationsForUser,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  // reports
  listReports,
  createReport,
  deleteReport,
  // auth
  verifyLogin,
  // helper
  hashPassword,
  comparePassword
};
