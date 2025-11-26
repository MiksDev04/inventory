import * as fb from './firebaseClient.js';

export async function getProducts(opts) {
  if (opts && opts.page) {
    const all = await fb.listProducts();
    const p = Math.max(1, parseInt(opts.page, 10) || 1);
    const per = Math.max(1, parseInt(opts.perPage, 10) || 20);
    const offset = (p - 1) * per;
    const data = all.slice(offset, offset + per).map(r => ({
      ...r,
      price: Number(r.price || 0),
      quantity: Number(r.quantity || 0),
      minQuantity: Number(r.min_quantity || r.minQuantity || 0),
      lastUpdated: r.updatedAt ? new Date(r.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));
    return { data, total: all.length, page: p, perPage: per };
  }
  const all = await fb.listProducts();
  return all.map(r => ({
    ...r,
    price: Number(r.price || 0),
    quantity: Number(r.quantity || 0),
    minQuantity: Number(r.min_quantity || r.minQuantity || 0),
    lastUpdated: r.updatedAt ? new Date(r.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  }));
}

export async function createProduct(payload) {
  const id = await fb.createProduct(payload);
  const created = await fb.getProduct(id);
  return created;
}

export async function updateProduct(id, payload) {
  // Remove id from payload to avoid conflicts
  const { id: _, ...updateData } = payload;
  await fb.updateProduct(id, updateData);
  return await fb.getProduct(id);
}

export async function deleteProduct(id) {
  await fb.deleteProduct(id);
  return { ok: true };
}

export async function getCategories() { return fb.listCategories(); }
export async function createCategory(p) { return fb.createCategory(p); }
export async function updateCategory(id, p) { return fb.updateCategory(id, p); }
export async function deleteCategory(id) { return fb.deleteCategory(id); }

export async function getSuppliers() { return fb.listSuppliers(); }
export async function createSupplier(p) { return fb.createSupplier(p); }
export async function updateSupplier(id, p) { return fb.updateSupplier(id, p); }
export async function deleteSupplier(id) { return fb.deleteSupplier(id); }

// Notifications
export async function getNotifications(userId) {
  if (!userId) {
    const users = await fb.listUsers();
    userId = users && users.length > 0 ? users[0].id : '1';
  }
  return fb.listNotificationsForUser(userId);
}

export async function getUnreadCount(userId) {
  if (!userId) {
    const users = await fb.listUsers();
    userId = users && users.length > 0 ? users[0].id : '1';
  }
  const n = await fb.listNotificationsForUser(userId);
  return { count: n.filter(x => !x.is_read).length };
}

export async function markAsRead(id) { 
  return fb.markNotificationRead(id); 
}

export async function markAllAsRead(userId) {
  if (!userId) {
    const users = await fb.listUsers();
    userId = users && users.length > 0 ? users[0].id : '1';
  }
  return fb.markAllNotificationsRead(userId);
}

export async function deleteNotification(id) { 
  return fb.deleteNotification ? fb.deleteNotification(id) : null; 
}

export async function generateStockNotifications(userId) {
  if (!userId) {
    const users = await fb.listUsers();
    userId = users && users.length > 0 ? users[0].id : '1';
  }
  
  // Get existing notifications to avoid duplicates
  const existingNotifications = await fb.listNotificationsForUser(userId);
  const unreadNotifsByProduct = existingNotifications
    .filter(n => !n.is_read && n.product_id)
    .reduce((acc, n) => {
      acc[n.product_id] = n;
      return acc;
    }, {});
  
  const products = await fb.listProducts();
  const created = [];
  for (const p of products) {
    const qty = Number(p.quantity || 0);
    const minQ = Number(p.min_quantity || p.minQuantity || 0);
    
    // Check if product needs a notification
    if (qty === 0 || qty < minQ) {
      const type = qty === 0 ? 'out_of_stock' : 'low_stock';
      const title = qty === 0 ? `${p.name} is out of stock` : `${p.name} is running low`;
      const message = qty === 0
        ? `Product "${p.name}" (SKU: ${p.sku}) is currently out of stock. Please reorder immediately.`
        : `Product "${p.name}" (SKU: ${p.sku}) has only ${qty} units left (minimum: ${minQ}). Consider restocking soon.`;
      
      // Only create notification if no unread notification exists for this product with same type
      const existingNotif = unreadNotifsByProduct[p.id];
      if (!existingNotif || existingNotif.type !== type) {
        const nid = await fb.createNotification({ user_id: userId, type, title, message, product_id: p.id });
        created.push(nid);
      }
    } else {
      // Product is now in good stock - mark any existing low/out of stock notifications as read
      const existingNotif = unreadNotifsByProduct[p.id];
      if (existingNotif && (existingNotif.type === 'low_stock' || existingNotif.type === 'out_of_stock')) {
        await fb.updateNotification(existingNotif.id, { is_read: true });
      }
    }
  }
  return created;
}

// Reports
export async function getReports(opts) {
  if (opts && opts.page) {
    const all = await fb.listReports();
    const p = Math.max(1, parseInt(opts.page, 10) || 1);
    const per = Math.max(1, parseInt(opts.perPage, 10) || 20);
    const offset = (p - 1) * per;
    const data = all.slice(offset, offset + per);
    return { data, total: all.length, page: p, perPage: per };
  }
  return fb.listReports();
}
export async function createReport(reportData) {
  // Get current products to calculate stats
  const products = await fb.listProducts();
  
  const totalProducts = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.price) || 0)), 0);
  const lowStockCount = products.filter(p => {
    const qty = Number(p.quantity) || 0;
    const minQty = Number(p.min_quantity || p.minQuantity) || 0;
    return qty > 0 && qty <= minQty;
  }).length;
  const outOfStockCount = products.filter(p => (Number(p.quantity) || 0) === 0).length;
  
  const reportPayload = {
    ...reportData,
    totalProducts,
    totalValue,
    lowStockCount,
    outOfStockCount
  };
  
  return fb.createReport(reportPayload);
}
export async function deleteReport(id) { return fb.deleteReport(id); }

// Profile - get the first (admin) user from the database
export async function getProfile() {
  const users = await fb.listUsers();
  return users && users.length > 0 ? users[0] : null;
}

export async function updateProfile(payload, userId) {
  if (!userId) {
    // Get the first user's ID
    const users = await fb.listUsers();
    if (users && users.length > 0) {
      userId = users[0].id;
    }
  }
  
  if (!userId) {
    throw new Error('No user found to update');
  }
  
  await fb.updateUser(String(userId), payload);
  return fb.getUserById(String(userId));
}

export async function changePassword(payload, userId) {
  if (!userId) {
    // Get the first user's ID
    const users = await fb.listUsers();
    if (users && users.length > 0) {
      userId = users[0].id;
    }
  }
  
  if (!userId) {
    throw new Error('No user found');
  }
  
  // Get current user to verify password
  const currentUser = await fb.getUserById(String(userId));
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  // Verify current password
  const isHashedMatch = await fb.comparePassword(payload.currentPassword, currentUser.password_hash);
  const isPlainMatch = payload.currentPassword === currentUser.password_hash;
  
  if (!isHashedMatch && !isPlainMatch) {
    // Also check against hardcoded admin password if username is admin
    if (currentUser.username === 'admin' && payload.currentPassword === '12345678') {
      // Allow this for admin
    } else {
      throw new Error('incorrect_current_password');
    }
  }
  
  // Validate new password
  if (!payload.newPassword || payload.newPassword.length < 6) {
    throw new Error('new_password_too_short');
  }
  
  // Hash and update password
  const hashed = await fb.hashPassword(payload.newPassword);
  await fb.updateUser(String(userId), { password_hash: hashed });
  return { success: true };
}

// Auth — verify against Firestore-stored user_accounts (password_hash)
export async function login({ username, password }) {
  const u = await fb.verifyLogin(username, password);
  if (!u) throw new Error('Invalid credentials');
  return { success: true, user: u };
}

export default {
  listProducts: getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories: getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listSuppliers: getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  generateStockNotifications,
  getReports,
  createReport,
  deleteReport,
  getProfile,
  updateProfile,
  changePassword,
  login
};
