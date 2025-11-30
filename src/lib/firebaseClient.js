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
  writeBatch
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

export async function getProduct(id) {
  const d = await getDoc(doc(db, 'products', String(id)));
  if (!d.exists()) return null;
  const data = docData(d);
  console.log('[Firestore] getProduct:', id, 'Data:', data);
  console.log('[Firestore] images field:', data.images, 'Type:', typeof data.images, 'IsArray:', Array.isArray(data.images));
  return data;
}

export async function createProduct(payload) {
  console.log('[Firestore] createProduct payload:', payload);
  console.log('[Firestore] payload.images:', payload.images, 'Type:', typeof payload.images, 'IsArray:', Array.isArray(payload.images));
  
  const p = { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  console.log('[Firestore] Saving to Firestore:', p);
  
  const ref = await addDoc(collection(db, 'products'), p);
  console.log('[Firestore] Product created with ID:', ref.id);
  return ref.id;
}

export async function updateProduct(id, payload) {
  console.log('[Firestore] updateProduct id:', id, 'payload:', payload);
  console.log('[Firestore] payload.images:', payload.images, 'Type:', typeof payload.images, 'IsArray:', Array.isArray(payload.images));
  
  const updatePayload = { 
    ...payload, 
    updatedAt: serverTimestamp(),
    created_at: deleteField(),  // Remove old field
    updated_at: deleteField()   // Remove old field
  };
  console.log('[Firestore] Full update payload:', updatePayload);
  console.log('[Firestore] Update payload images field:', updatePayload.images);
  
  const ref = doc(db, 'products', String(id));
  await updateDoc(ref, updatePayload);
  console.log('[Firestore] Product updated successfully');
  
  // Verify what was saved
  const verifyDoc = await getDoc(ref);
  const savedData = verifyDoc.data();
  console.log('[Firestore] Verification - saved images:', savedData.images);
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

export async function getUserByUsername(username) {
  const q = query(collection(db, 'inventory_users'), where('username', '==', username));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? docData(first) : null;
}

export async function getUserById(id) {
  const d = await getDoc(doc(db, 'inventory_users', String(id)));
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
  const r = await addDoc(collection(db, 'inventory_users'), p);
  return r.id;
}

export async function updateUser(id, payload) {
  const p = { ...payload };
  if (p.password) {
    p.password_hash = await hashPassword(p.password);
    delete p.password;
  }
  await updateDoc(doc(db, 'inventory_users', String(id)), { ...p, updated_at: serverTimestamp() });
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
  } catch (_e) {
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

export default {
  // products
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // storage
  uploadImageToStorage,
  deleteImageFromStorage,
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
  archiveReport,
  deleteReport,
  // transactions
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
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
  } catch (_e) {
    // If createdAt index doesn't exist, try created_at
    snap = await getDocs(query(collection(db, 'transactions'), orderBy('created_at', 'desc')));
  }
  const res = [];
  snap.forEach(d => res.push(docData(d)));
  return res;
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
  console.log('Starting cleanup of old timestamp fields...');
  const collections = ['products', 'categories', 'suppliers', 'notifications', 'inventory_reports', 'transactions'];
  let totalUpdated = 0;
  
  for (const collectionName of collections) {
    console.log(`Processing ${collectionName}...`);
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
        console.log(`  Cleaned ${docSnap.id}`);
      }
    }
  }
  
  console.log(`Cleanup complete! Updated ${totalUpdated} documents.`);
  return totalUpdated;
}

// (removed duplicate default export)
