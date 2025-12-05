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
  deleteField,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

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
const storage = getStorage(app);

function docData(d) {
  const raw = d.data ? d.data() : d;
  const converted = {};
  for (const [k, v] of Object.entries(raw || {})) {
    // Skip old snake_case timestamp fields only (keep other snake_case for backward compatibility)
    if (k === 'created_at' || k === 'updated_at') continue;
    
    if (v && typeof v.toDate === 'function') converted[k] = v.toDate();
    else converted[k] = v;
  }
  
  return { id: d.id, ...converted };
}

// --- Firebase Storage helpers ---
export async function uploadImageToStorage(file, sku, index) {
  try {
    const fileName = `${sku}-${index}-${Date.now()}`;
    const storageRef = ref(storage, `product-images/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error;
  }
}

export async function deleteImageFromStorage(imageUrl) {
  try {
    // Extract path from URL
    if (imageUrl && imageUrl.includes('firebase')) {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.error('Error deleting image from Firebase Storage:', error);
    // Don't throw - deletion errors shouldn't block product updates
  }
}

// --- Products ---
export async function listProducts({ limit = 1000 } = {}) {
  const q = query(collection(db, 'products'), orderBy('createdAt'));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push(docData(d)));
  if (limit && Number.isFinite(Number(limit))) return arr.slice(0, Number(limit));
  return arr;
}

// Real-time listener for products
export function subscribeToProducts(callback) {
  const q = query(collection(db, 'products'), orderBy('createdAt'));
  return onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach(d => {
      const product = docData(d);
      // Add lastUpdated field transformation
      product.lastUpdated = product.updatedAt 
        ? new Date(product.updatedAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      product.price = Number(product.price || 0);
      product.quantity = Number(product.quantity || 0);
      product.minQuantity = Number(product.min_quantity || product.minQuantity || 0);
      products.push(product);
    });
    callback(products);
  });
}

export async function getProduct(id) {
  const d = await getDoc(doc(db, 'products', String(id)));
  if (!d.exists()) return null;
  const data = docData(d);
  console.log('[Firestore] images field:', data.images, 'Type:', typeof data.images, 'IsArray:', Array.isArray(data.images));
  return data;
}

export async function createProduct(payload) {
  console.log('[Firestore] payload.images:', payload.images, 'Type:', typeof payload.images, 'IsArray:', Array.isArray(payload.images));
  
  const p = { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  
  const ref = await addDoc(collection(db, 'products'), p);
  return ref.id;
}

export async function updateProduct(id, payload) {
  const updatePayload = { 
    ...payload, 
    updatedAt: serverTimestamp(),
    created_at: deleteField(),  // Remove old field
    updated_at: deleteField()   // Remove old field
  };
  
  const ref = doc(db, 'products', String(id));
  await updateDoc(ref, updatePayload);
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', String(id)));
}

// --- Categories ---
export async function listCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('createdAt')));
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res;
}

// Real-time listener for categories
export function subscribeToCategories(callback) {
  const q = query(collection(db, 'categories'), orderBy('createdAt'));
  return onSnapshot(q, (snapshot) => {
    const categories = [];
    snapshot.forEach(d => categories.push(docData(d)));
    callback(categories);
  });
}

export async function findCategoryByName(name) {
  const q = query(collection(db, 'categories'), where('name', '==', name));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? docData(first) : null;
}

export async function createCategory(payload) {
  const p = { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const r = await addDoc(collection(db, 'categories'), p);
  return r.id;
}

export async function updateCategory(id, payload) {
  await updateDoc(doc(db, 'categories', String(id)), { 
    ...payload, 
    updatedAt: serverTimestamp(),
    created_at: deleteField(),  // Remove old field
    updated_at: deleteField()   // Remove old field
  });
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, 'categories', String(id)));
}

// --- Suppliers ---
export async function listSuppliers() {
  const snap = await getDocs(query(collection(db, 'suppliers'), orderBy('createdAt')));
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res;
}

// Real-time listener for suppliers
export function subscribeToSuppliers(callback) {
  const q = query(collection(db, 'suppliers'), orderBy('createdAt'));
  return onSnapshot(q, (snapshot) => {
    const suppliers = [];
    snapshot.forEach(d => suppliers.push(docData(d)));
    callback(suppliers);
  });
}

export async function findSupplierByName(name) {
  const q = query(collection(db, 'suppliers'), where('name', '==', name));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? docData(first) : null;
}

export async function createSupplier(payload) {
  const p = { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const r = await addDoc(collection(db, 'suppliers'), p);
  return r.id;
}

export async function updateSupplier(id, payload) {
  await updateDoc(doc(db, 'suppliers', String(id)), { 
    ...payload, 
    updatedAt: serverTimestamp(),
    created_at: deleteField(),  // Remove old field
    updated_at: deleteField()   // Remove old field
  });
}

export async function deleteSupplier(id) {
  await deleteDoc(doc(db, 'suppliers', String(id)));
}

// --- Users (auth) ---
export async function listUsers() {
  const snap = await getDocs(collection(db, 'inventory_users'));
  const users = [];
  snap.forEach(d => users.push(docData(d)));
  return users;
}

// Real-time listener for users
export function subscribeToUsers(callback) {
  const q = query(collection(db, 'inventory_users'));
  return onSnapshot(q, (snapshot) => {
    const users = [];
    snapshot.forEach(d => {
      users.push(docData(d));
    });
    callback(users);
  });
}

export async function getUserByUsername(username) {
  const q = query(collection(db, 'inventory_users'), where('username', '==', username));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  const data = docData(first);
  // Normalize field names (support both snake_case and camelCase)
  return {
    ...data,
    password_hash: data.passwordHash || data.password_hash,
    full_name: data.fullName || data.full_name,
    is_active: data.isActive || data.is_active,
    created_at: data.createdAt || data.created_at,
    updated_at: data.updatedAt || data.updated_at
  };
}

export async function getUserById(id) {
  const d = await getDoc(doc(db, 'inventory_users', String(id)));
  if (!d.exists()) return null;
  const data = docData(d);
  // Normalize field names (support both snake_case and camelCase)
  return {
    ...data,
    password_hash: data.passwordHash || data.password_hash,
    full_name: data.fullName || data.full_name,
    is_active: data.isActive || data.is_active,
    created_at: data.createdAt || data.created_at,
    updated_at: data.updatedAt || data.updated_at
  };
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
    p.passwordHash = await hashPassword(p.password);
    delete p.password;
  }
  // Normalize to camelCase for consistency with Firebase
  if (p.full_name) {
    p.fullName = p.full_name;
    delete p.full_name;
  }
  if (p.is_active !== undefined) {
    p.isActive = p.is_active;
    delete p.is_active;
  }
  p.createdAt = serverTimestamp();
  p.updatedAt = serverTimestamp();
  const r = await addDoc(collection(db, 'inventory_users'), p);
  return r.id;
}

export async function updateUser(id, payload) {
  const p = { ...payload };
  const docRef = doc(db, 'inventory_users', String(id));
  
  // Handle password hashing
  if (p.password) {
    p.passwordHash = await hashPassword(p.password);
    delete p.password;
  }
  
  // Handle password_hash (already hashed) - convert to camelCase
  if (p.password_hash) {
    p.passwordHash = p.password_hash;
    delete p.password_hash;
  }
  
  // Normalize to camelCase for consistency with Firebase
  if (p.full_name) {
    p.fullName = p.full_name;
    delete p.full_name;
  }
  if (p.is_active !== undefined) {
    p.isActive = p.is_active;
    delete p.is_active;
  }
  
  // Update the document
  await updateDoc(docRef, { ...p, updatedAt: serverTimestamp() });
  
  // Explicitly remove old snake_case password_hash field if passwordHash was set
  if (p.passwordHash) {
    await updateDoc(docRef, { password_hash: deleteField() });
  }
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
  // Try new field first
  let q = query(collection(db, 'notifications'), where('userId', '==', userId));
  let snap = await getDocs(q);
  
  // If no results, try old field for backward compatibility
  if (snap.empty) {
    q = query(collection(db, 'notifications'), where('user_id', '==', userId));
    snap = await getDocs(q);
  }
  
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  
  // Sort by createdAt in memory since we might have mixed field names
  res.sort((a, b) => {
    const aDate = a.createdAt || a.created_at || new Date(0);
    const bDate = b.createdAt || b.created_at || new Date(0);
    return bDate - aDate;
  });
  
  return res.slice(0, limit);
}

export async function createNotification(payload) {
  const p = { 
    userId: payload.user_id || payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    productId: payload.product_id || payload.productId,
    itemSku: payload.item_sku || payload.itemSku,
    createdAt: serverTimestamp(), 
    isRead: !!payload.isRead || !!payload.is_read 
  };
  const r = await addDoc(collection(db, 'notifications'), p);
  return r.id;
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, 'notifications', String(id)), { 
    isRead: true, 
    readAt: serverTimestamp(),
    is_read: deleteField(),  // Remove old field
    read_at: deleteField()   // Remove old field
  });
}

export async function markAllNotificationsRead(userId) {
  // Get all unread notifications for this user (supporting both field names)
  let q = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
  let snap = await getDocs(q);
  
  // Try old field name if no results
  if (snap.empty) {
    q = query(collection(db, 'notifications'), where('user_id', '==', userId), where('is_read', '==', false));
    snap = await getDocs(q);
  }
  
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.forEach(d => batch.update(d.ref, { 
      isRead: true, 
      readAt: serverTimestamp(),
      is_read: deleteField(),  // Remove old field
      read_at: deleteField(),   // Remove old field
      user_id: deleteField(),   // Remove old field
      userId: userId            // Ensure new field is set
    }));
    await batch.commit();
  }
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, 'notifications', String(id)));
}

// --- Reports ---
export async function listReports(includeArchived = false) {
  // Try new field first, fall back to old for compatibility
  let snap;
  try {
    snap = await getDocs(query(collection(db, 'inventory_reports'), orderBy('createdAt', 'desc')));
  } catch {
    // If createdAt index doesn't exist, try created_at
    snap = await getDocs(query(collection(db, 'inventory_reports'), orderBy('created_at', 'desc')));
  }
  const res = [];
  snap.forEach(d => {
    const data = docData(d);
    // Filter archived unless explicitly requested
    if (includeArchived || !data.archived) {
      res.push(data);
    }
  });
  return res;
}

export async function createReport(payload) {
  const p = { ...payload, createdAt: serverTimestamp(), archived: false };
  const r = await addDoc(collection(db, 'inventory_reports'), p);
  return r.id;
}

export async function archiveReport(id) {
  await updateDoc(doc(db, 'inventory_reports', String(id)), { 
    archived: true,
    archivedAt: serverTimestamp()
  });
}

export async function deleteReport(id) {
  await deleteDoc(doc(db, 'inventory_reports', String(id)));
}

// Real-time listener for reports
export function subscribeToReports(callback, includeArchived = false) {
  let q;
  try {
    q = query(collection(db, 'inventory_reports'), orderBy('createdAt', 'desc'));
  } catch {
    q = query(collection(db, 'inventory_reports'), orderBy('created_at', 'desc'));
  }
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const res = [];
    snapshot.forEach(d => {
      const data = docData(d);
      // Filter archived unless explicitly requested
      if (includeArchived || !data.archived) {
        res.push(data);
      }
    });
    callback(res);
  });
  
  return unsubscribe;
}

// Real-time listener for notifications
export function subscribeToNotifications(callback, userId = null) {
  let q;
  if (userId) {
    q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
  }
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const res = [];
    snapshot.forEach(d => res.push(docData(d)));
    callback(res);
  });
  
  return unsubscribe;
}

export default {
  // products
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  subscribeToProducts,
  // storage
  uploadImageToStorage,
  deleteImageFromStorage,
  // categories
  listCategories,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  subscribeToCategories,
  // suppliers
  listSuppliers,
  findSupplierByName,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  subscribeToSuppliers,
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
  subscribeToNotifications,
  // reports
  listReports,
  createReport,
  archiveReport,
  deleteReport,
  subscribeToReports,
  // transactions
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  subscribeToTransactions,
  // auth
  verifyLogin,
  // helper
  hashPassword,
  comparePassword
};

// Export Firestore utilities for direct use
export { db, doc, updateDoc };

// --- Transactions ---
export async function listTransactions() {
  // Try new field first, fall back to old for compatibility
  let snap;
  try {
    snap = await getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')));
  } catch {
    // If createdAt index doesn't exist, try created_at
    snap = await getDocs(query(collection(db, 'transactions'), orderBy('created_at', 'desc')));
  }
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res;
}

// Real-time listener for transactions
export function subscribeToTransactions(callback) {
  let q;
  try {
    q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  } catch {
    q = query(collection(db, 'transactions'), orderBy('created_at', 'desc'));
  }
  return onSnapshot(q, (snapshot) => {
    const transactions = [];
    snapshot.forEach(d => transactions.push(docData(d)));
    callback(transactions);
  });
}

export async function getTransaction(id) {
  const d = await getDoc(doc(db, 'transactions', String(id)));
  return d.exists() ? docData(d) : null;
}

export async function createTransaction(payload) {
  const p = { ...payload, createdAt: serverTimestamp() };
  const r = await addDoc(collection(db, 'transactions'), p);
  return r.id;
}

export async function updateTransaction(id, payload) {
  await updateDoc(doc(db, 'transactions', String(id)), { ...payload });
}

export async function deleteTransaction(id) {
  await deleteDoc(doc(db, 'transactions', String(id)));
}

// Clean up old snake_case timestamp fields
export async function cleanupOldTimestampFields() {
  const collections = ['products', 'categories', 'suppliers', 'notifications', 'inventory_reports', 'transactions'];
  let totalUpdated = 0;
  
  for (const collectionName of collections) {
      const snap = await getDocs(collection(db, collectionName));
    
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const updates = {};
      
      // Remove old snake_case timestamp fields
      if (data.created_at !== undefined) {
        updates.created_at = deleteField();
      }
      if (data.updated_at !== undefined) {
        updates.updated_at = deleteField();
      }
      
      // Remove old notification-specific snake_case fields
      if (collectionName === 'notifications') {
        if (data.user_id !== undefined) {
          updates.user_id = deleteField();
        }
        if (data.is_read !== undefined) {
          updates.is_read = deleteField();
        }
        if (data.read_at !== undefined) {
          updates.read_at = deleteField();
        }
        if (data.product_id !== undefined) {
          updates.product_id = deleteField();
        }
        if (data.item_sku !== undefined) {
          updates.item_sku = deleteField();
        }
      }
      
      // Remove old transaction-specific snake_case fields
      if (collectionName === 'transactions') {
        if (data.product_id !== undefined) {
          updates.product_id = deleteField();
        }
        if (data.item_sku !== undefined) {
          updates.item_sku = deleteField();
        }
        if (data.product_name !== undefined) {
          updates.product_name = deleteField();
        }
        if (data.quantity_diff !== undefined) {
          updates.quantity_diff = deleteField();
        }
        if (data.price_diff !== undefined) {
          updates.price_diff = deleteField();
        }
        if (data.change_fields !== undefined) {
          updates.change_fields = deleteField();
        }
      }
      
      // Only update if there are fields to remove
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, collectionName, docSnap.id), updates);
        totalUpdated++;
            }
    }
  }
  
  return totalUpdated;
}

// --- Settings functions ---
export async function getSettings() {
  const snap = await getDocs(collection(db, 'inventory_settings'));
  if (snap.empty) {
    // Return default settings if none exist
    return {
      notifications: {
        lowStock: true,
        outOfStock: true
      },
      system: {
        lowStockThreshold: 20
      }
    };
  }
  
  // Get the first document (should only be one)
  const doc = snap.docs[0];
  const data = docData(doc);
  
  return {
    id: data.id,
    notifications: data.notifications || { lowStock: true, outOfStock: true },
    system: data.system || { lowStockThreshold: 20 }
  };
}

export async function updateSettings(settings) {
  const snap = await getDocs(collection(db, 'inventory_settings'));
  
  const payload = {
    notifications: settings.notifications,
    system: settings.system,
    updatedAt: serverTimestamp()
  };
  
  if (snap.empty) {
    // Create new settings document
    const docRef = await addDoc(collection(db, 'inventory_settings'), {
      ...payload,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...settings };
  } else {
    // Update existing settings document
    const docId = snap.docs[0].id;
    await updateDoc(doc(db, 'inventory_settings', docId), payload);
    return { id: docId, ...settings };
  }
}

// (removed duplicate default export)
