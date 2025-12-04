import * as fb from './firebaseClient.js';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from './cloudinary.js';
import { getImage } from './imageStore.js';

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
  console.log('createProduct called with payload:', payload);
  console.log('payload.images:', payload.images, 'Type:', Array.isArray(payload.images), 'Length:', payload.images?.length);
  
  let imagePaths = [];
  
  // Handle image uploads if present
  if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
    console.log('Uploading images...', payload.images);
    imagePaths = await uploadProductImages(payload.images, payload.sku || `product-${Date.now()}`);
    console.log('Upload complete. Paths:', imagePaths);
  }
  
  // Create product with image paths
  const productData = { 
    ...payload,
    price: Number(payload.price) || 0,
    quantity: Number(payload.quantity) || 0,
    minQuantity: Number(payload.minQuantity || payload.min_quantity) || 0
  };
  delete productData.images; // Remove File objects
  productData.images = imagePaths; // Add paths
  
  console.log('Saving to Firestore:', productData);
  
  const id = await fb.createProduct(productData);
  const created = await fb.getProduct(id);
  // Log transaction for product creation
  try {
    const autoNotes = `${created?.name} was added to inventory with ${created?.quantity} units at ₱${Number(created?.price || 0).toFixed(2)} each`;
    await fb.createTransaction({
      type: 'product_create',
      productId: id,
      itemSku: created?.sku,
      supplier: created?.supplier,
      productName: created?.name,
      category: created?.category,
      quantity: Number(created?.quantity || 0),
      unitPrice: Number(created?.price || 0),
      total: Number(created?.quantity || 0) * Number(created?.price || 0),
      notes: autoNotes
    });
  } catch (e) { console.error('Failed to log product_create transaction', e); }
  return created;
}

// Helper function to upload images to Cloudinary (free tier)
async function uploadProductImages(files) {
  const uploadedUrls = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Upload to Cloudinary
      const downloadURL = await uploadImageToCloudinary(file);
      uploadedUrls.push(downloadURL);
      console.log(`✓ Image uploaded to Cloudinary: ${downloadURL}`);
    } catch (e) {
      console.error(`✗ Failed to upload ${file.name}:`, e);
    }
  }
  
  console.log(`Uploaded ${uploadedUrls.length} images to Cloudinary`);
  return uploadedUrls;
}

// Helper function to get image URL from path
export async function getImageUrl(path) {
  if (!path) return null;
  
  // If it's already a full URL (from Firebase Storage), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Legacy IndexedDB support - try to get from IndexedDB
  const url = await getImage(path);
  if (url) return url;
  
  // Return path as-is
  return path;
}

export async function updateProduct(id, payload) {
  console.log('updateProduct called with id:', id, 'payload:', payload);
  
  // Fetch previous product data for comparison and image cleanup
  const previous = await fb.getProduct(id);
  
  // Remove id from payload to avoid conflicts
  const { id: _, existingImages, newImages, ...updateData } = payload;
  
  // Convert numeric fields to numbers
  if (updateData.price !== undefined) updateData.price = Number(updateData.price) || 0;
  if (updateData.quantity !== undefined) updateData.quantity = Number(updateData.quantity) || 0;
  if (updateData.minQuantity !== undefined) updateData.minQuantity = Number(updateData.minQuantity) || 0;
  if (updateData.min_quantity !== undefined) updateData.minQuantity = Number(updateData.min_quantity) || 0;
  
  console.log('existingImages:', existingImages);
  console.log('newImages:', newImages, 'Type:', Array.isArray(newImages), 'Length:', newImages?.length);
  
  // Handle new image uploads
  let additionalImagePaths = [];
  if (newImages && Array.isArray(newImages) && newImages.length > 0) {
    const sku = updateData.sku || `product-${id}`;
    console.log('Uploading new images for SKU:', sku);
    additionalImagePaths = await uploadProductImages(newImages, sku);
    console.log('New image paths:', additionalImagePaths);
  }
  
  // Delete removed images from Firebase Storage
  const previousImages = Array.isArray(previous?.images) ? previous.images : [];
  const keptImages = Array.isArray(existingImages) ? existingImages : [];
  const removedImages = previousImages.filter(img => !keptImages.includes(img));
  
  for (const imageUrl of removedImages) {
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      try {
        await deleteImageFromCloudinary(imageUrl);
        console.log('✓ Image unlinked from product:', imageUrl);
      } catch (e) {
        console.error('Failed to process image removal:', e);
      }
    }
  }
  
  // Combine existing and new image paths - always set images field
  const allImages = [...(existingImages || []), ...additionalImagePaths];
  console.log('All images to save:', allImages);
  // Always update images field, even if empty
  updateData.images = allImages;
  
  console.log('Updating product in Firestore:', updateData);
  
  await fb.updateProduct(id, updateData);
  const updated = await fb.getProduct(id);
  try {
    const prevQty = Number(previous?.quantity || 0);
    const newQty = Number(updated?.quantity || prevQty);
    const qtyDiff = newQty - prevQty;
    const prevPrice = Number(previous?.price || 0);
    const newPrice = Number(updated?.price || prevPrice);
    const priceDiff = newPrice - prevPrice;

    // Build detailed changes map (old -> new) only for fields that actually changed
    const changes = {};
    for (const f of Object.keys(updateData || {})) {
      const fromVal = previous ? previous[f] : undefined;
      const toVal = updated ? updated[f] : undefined;
      
      // Special handling for images field - just count them
      if (f === 'images') {
        const prevImageCount = Array.isArray(fromVal) ? fromVal.length : 0;
        const newImageCount = Array.isArray(toVal) ? toVal.length : 0;
        if (prevImageCount !== newImageCount) {
          changes[f] = { 
            from: `${prevImageCount} image${prevImageCount !== 1 ? 's' : ''}`, 
            to: `${newImageCount} image${newImageCount !== 1 ? 's' : ''}` 
          };
        }
      } else if (fromVal !== toVal) {
        changes[f] = { from: fromVal, to: toVal };
      }
    }
    // Ensure quantity/price captured if changed
    if (prevQty !== newQty) {
      changes.quantity = { from: prevQty, to: newQty };
    }
    if (prevPrice !== newPrice) {
      changes.price = { from: prevPrice, to: newPrice };
    }

    const changedKeys = Object.keys(changes);
    // If nothing actually changed, skip logging a transaction
    if (changedKeys.length === 0) {
      return updated;
    }

    await fb.createTransaction({
      type: 'product_update',
      productId: id,
      itemSku: updated?.sku || previous?.sku,
      supplier: updated?.supplier || previous?.supplier,
      productName: updated?.name || previous?.name,
      category: updated?.category || previous?.category,
      quantity: newQty,
      quantityDiff: qtyDiff,
      unitPrice: newPrice,
      priceDiff: priceDiff,
      total: Number(newQty) * Number(newPrice),
      changeFields: changedKeys,
      changes,
      notes: 'Product updated'
    });
  } catch (e) { console.error('Failed to log product_update transaction', e); }
  return updated;
}

export async function deleteProduct(id) {
  // Fetch product before deletion to log and delete images
  const existing = await fb.getProduct(id);
  
  // Delete images from Cloudinary
  if (existing?.images && Array.isArray(existing.images)) {
    for (const imageUrl of existing.images) {
      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        try {
          await deleteImageFromCloudinary(imageUrl);
          console.log('✓ Image unlinked from product:', imageUrl);
        } catch (e) {
          console.error('Failed to process image removal:', e);
        }
      }
    }
  }
  
  await fb.deleteProduct(id);
  try {
    const autoNotes = `${existing?.name} was removed from inventory (had ${existing?.quantity} units at ₱${Number(existing?.price || 0).toFixed(2)} each)`;
    await fb.createTransaction({
      type: 'product_delete',
      productId: id,
      itemSku: existing?.sku,
      supplier: existing?.supplier,
      productName: existing?.name,
      category: existing?.category,
      quantity: Number(existing?.quantity || 0),
      unitPrice: Number(existing?.price || 0),
      total: Number(existing?.quantity || 0) * Number(existing?.price || 0),
      notes: autoNotes
    });
  } catch (e) { console.error('Failed to log product_delete transaction', e); }
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
  return { count: n.filter(x => !x.isRead).length };
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

// Check and create notification for a specific product
export async function checkProductStockNotification(productId, userId) {
  try {
    if (!userId) {
      const users = await fb.listUsers();
      userId = users && users.length > 0 ? users[0].id : '1';
    }
    
    // Get settings to check if notifications are enabled
    const settings = await fb.getSettings();
    const notifSettings = settings.notifications || { lowStock: true, outOfStock: true };
    
    // Get the specific product
    const product = await fb.getProduct(productId);
    if (!product) return null;
    
    const qty = Number(product.quantity || 0);
    // Use product's minQuantity, or fall back to system setting
    const minQ = Number(product.min_quantity || product.minQuantity || settings.system?.lowStockThreshold || 20);
    
    // Check if product is low/out of stock and create notification
    if (qty === 0 || qty < minQ) {
      const type = qty === 0 ? 'out_of_stock' : 'low_stock';
      
      // Only create notification if that type is enabled in settings
      if ((type === 'out_of_stock' && !notifSettings.outOfStock) || 
          (type === 'low_stock' && !notifSettings.lowStock)) {
        return null; // Notification disabled for this type
      }
      
      const title = qty === 0 ? `${product.name} is out of stock` : `${product.name} is running low`;
      const message = qty === 0
        ? `Product "${product.name}" (SKU: ${product.sku}) is currently out of stock. Please reorder immediately.`
        : `Product "${product.name}" (SKU: ${product.sku}) has only ${qty} units left (minimum: ${minQ}). Consider restocking soon.`;
      
      // Create notification immediately
      return await fb.createNotification({ 
        userId, 
        type, 
        title, 
        message, 
        productId,
        itemSku: product.sku 
      });
    }
    
    return null;
  } catch (error) {
    console.error('Failed to check product stock notification:', error);
    return null;
  }
}

// Check all products and create notifications for those with low/out of stock that don't have notifications yet
export async function checkAllProductsForNotifications(userId) {
  try {
    if (!userId) {
      const users = await fb.listUsers();
      userId = users && users.length > 0 ? users[0].id : '1';
    }
    
    // Get settings to check if notifications are enabled
    const settings = await fb.getSettings();
    const notifSettings = settings.notifications || { lowStock: true, outOfStock: true };
    const systemThreshold = settings.system?.lowStockThreshold || 20;
    
    // Get all products and existing notifications
    const products = await fb.listProducts();
    const existingNotifications = await fb.listNotificationsForUser(userId);
    
    // Group notifications by productId and type
    const notificationMap = {};
    existingNotifications.forEach(n => {
      const key = `${n.productId}_${n.type}`;
      if (!notificationMap[key]) {
        notificationMap[key] = [];
      }
      notificationMap[key].push(n);
    });
    
    const created = [];
    
    for (const product of products) {
      const qty = Number(product.quantity || 0);
      // Use product's minQuantity, or fall back to system setting
      const minQ = Number(product.min_quantity || product.minQuantity || systemThreshold);
      
      // Only create notification if product is low/out of stock
      if (qty === 0 || qty < minQ) {
        const type = qty === 0 ? 'out_of_stock' : 'low_stock';
        
        // Only create notification if that type is enabled in settings
        if ((type === 'out_of_stock' && !notifSettings.outOfStock) || 
            (type === 'low_stock' && !notifSettings.lowStock)) {
          continue; // Skip this notification
        }
        
        const key = `${product.id}_${type}`;
        
        // Check if there's already a notification for this product with this type
        const hasExistingNotif = notificationMap[key] && notificationMap[key].length > 0;
        
        // Only create if no notification exists yet for this product+type combination
        if (!hasExistingNotif) {
          const title = qty === 0 
            ? `${product.name} is out of stock` 
            : `${product.name} is running low`;
          const message = qty === 0
            ? `Product "${product.name}" (SKU: ${product.sku}) is currently out of stock. Please reorder immediately.`
            : `Product "${product.name}" (SKU: ${product.sku}) has only ${qty} units left (minimum: ${minQ}). Consider restocking soon.`;
          
          const newNotif = await fb.createNotification({
            userId,
            type,
            title,
            message,
            productId: product.id,
            itemSku: product.sku
          });
          
          if (newNotif) {
            created.push(newNotif);
          }
        }
      }
    }
    
    return created;
  } catch (error) {
    console.error('Failed to check all products for notifications:', error);
    return [];
  }
}

// Global flag to prevent concurrent notification generation
let isGeneratingNotifications = false;
let lastNotificationCheck = null;
const NOTIFICATION_COOLDOWN = 60000; // 1 minute cooldown between checks

export async function generateStockNotifications(userId) {
  // Prevent concurrent execution
  if (isGeneratingNotifications) {
    console.log('Notification generation already in progress, skipping...');
    return [];
  }
  
  // Prevent too frequent checks (cooldown period)
  const now = Date.now();
  if (lastNotificationCheck && (now - lastNotificationCheck) < NOTIFICATION_COOLDOWN) {
    console.log('Notification check on cooldown, skipping...');
    return [];
  }
  
  isGeneratingNotifications = true;
  lastNotificationCheck = now;
  
  try {
    if (!userId) {
      const users = await fb.listUsers();
      userId = users && users.length > 0 ? users[0].id : '1';
    }
    
    // Get settings for threshold and notification preferences
    const settings = await fb.getSettings();
    const notifSettings = settings.notifications || { lowStock: true, outOfStock: true };
    const systemThreshold = settings.system?.lowStockThreshold || 20;
    
    // Get existing notifications to avoid duplicates
    const existingNotifications = await fb.listNotificationsForUser(userId);
    const notifsByProduct = existingNotifications
      .filter(n => n.productId)
      .reduce((acc, n) => {
        if (!acc[n.productId]) {
          acc[n.productId] = [];
        }
        acc[n.productId].push(n);
        return acc;
      }, {});
    
    const products = await fb.listProducts();
    const created = [];
    for (const p of products) {
      const qty = Number(p.quantity || 0);
      // Use product's minQuantity, or fall back to system setting
      const minQ = Number(p.min_quantity || p.minQuantity || systemThreshold);
      
      // Check if product needs a notification
      if (qty === 0 || qty < minQ) {
        const type = qty === 0 ? 'out_of_stock' : 'low_stock';
        
        // Only create notification if that type is enabled in settings
        if ((type === 'out_of_stock' && !notifSettings.outOfStock) || 
            (type === 'low_stock' && !notifSettings.lowStock)) {
          continue; // Skip this notification
        }
        
        const title = qty === 0 ? `${p.name} is out of stock` : `${p.name} is running low`;
        const message = qty === 0
          ? `Product "${p.name}" (SKU: ${p.sku}) is currently out of stock. Please reorder immediately.`
          : `Product "${p.name}" (SKU: ${p.sku}) has only ${qty} units left (minimum: ${minQ}). Consider restocking soon.`;
        
        // Check if any unread notification already exists for this product with this type
        const productNotifs = notifsByProduct[p.id] || [];
        const hasUnreadNotif = productNotifs.some(n => !n.isRead && n.type === type);
        
        // Only create notification if no unread notification exists for this product with same type
        if (!hasUnreadNotif) {
          const nid = await fb.createNotification({ userId, type, title, message, productId: p.id });
          created.push(nid);
        }
      }
    }
    return created;
  } finally {
    isGeneratingNotifications = false;
  }
}

// Reports
export async function getReports(opts) {
  const includeArchived = opts?.includeArchived || false;
  if (opts && opts.page) {
    const all = await fb.listReports(includeArchived);
    const p = Math.max(1, parseInt(opts.page, 10) || 1);
    const per = Math.max(1, parseInt(opts.perPage, 10) || 20);
    const offset = (p - 1) * per;
    const data = all.slice(offset, offset + per);
    return { data, total: all.length, page: p, perPage: per };
  }
  return fb.listReports(includeArchived);
}
export async function createReport(reportData) {
  // Get current products to calculate stats
  const products = await fb.listProducts();
  
  // Get system settings for threshold
  const settings = await fb.getSettings();
  const systemThreshold = settings.system?.lowStockThreshold || 20;
  
  const totalProducts = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.price) || 0)), 0);
  const lowStockCount = products.filter(p => {
    const qty = Number(p.quantity) || 0;
    // Use product's minQuantity, or fall back to system setting
    const minQty = Number(p.min_quantity || p.minQuantity || systemThreshold);
    return qty > 0 && qty <= minQty;
  }).length;
  const outOfStockCount = products.filter(p => (Number(p.quantity) || 0) === 0).length;
  
  // Get transactions within the period
  const transactions = await (fb.listTransactions ? fb.listTransactions() : []);
  const startDate = new Date(reportData.startDate);
  startDate.setHours(0, 0, 0, 0); // Start of day
  const endDate = new Date(reportData.endDate);
  endDate.setHours(23, 59, 59, 999); // End of day
  
  const periodTransactions = transactions.filter(t => {
    const tDate = new Date(t.createdAt || t.date || 0);
    return tDate >= startDate && tDate <= endDate;
  });
  
  // Calculate period-specific metrics
  const totalTransactions = periodTransactions.length;
  
  // Count number of products created/deleted (not quantity)
  const productsAdded = periodTransactions
    .filter(t => t.type === 'product_create')
    .length;
  const productsRemoved = periodTransactions
    .filter(t => t.type === 'product_delete')
    .length;
  const productsUpdated = periodTransactions
    .filter(t => t.type === 'product_update')
    .length;
  
  // Get previous period reports for comparison
  const allReports = await fb.listReports();
  const previousReports = allReports
    .filter(r => r.period === reportData.period)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  let valueChange = 0;
  let valueChangePercent = 0;
  let stockChange = 0;
  if (previousReports.length > 0) {
    const prevValue = Number(previousReports[0].totalValue) || 0;
    const prevStock = Number(previousReports[0].totalProducts) || 0;
    valueChange = totalValue - prevValue;
    stockChange = totalProducts - prevStock;
    valueChangePercent = prevValue > 0 ? ((valueChange / prevValue) * 100) : 0;
  }
  
  // Calculate days in period for daily averages
  const daysInPeriod = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  const avgDailyTransactions = totalTransactions / daysInPeriod;
  
  const reportPayload = {
    ...reportData,
    totalProducts,
    totalValue,
    lowStockCount,
    outOfStockCount,
    totalTransactions,
    productsAdded,
    productsRemoved,
    productsUpdated,
    valueChange,
    valueChangePercent: parseFloat(valueChangePercent.toFixed(2)),
    stockChange,
    avgDailyTransactions: parseFloat(avgDailyTransactions.toFixed(2)),
    daysInPeriod
  };
  
  return fb.createReport(reportPayload);
}
export async function archiveReport(id) { return fb.archiveReport(id); }
export async function deleteReport(id) { return fb.deleteReport(id); }

// --- Transactions ---
export async function listTransactions(opts) {
  try {
    // If firebase client implements pagination, mirror products approach
    const all = await (fb.listTransactions ? fb.listTransactions() : []);
    if (opts && opts.page) {
      const p = Math.max(1, parseInt(opts.page, 10) || 1);
      const per = Math.max(1, parseInt(opts.perPage, 10) || 20);
      const offset = (p - 1) * per;
      const data = all.slice(offset, offset + per);
      return { data, total: all.length, page: p, perPage: per };
    }
    return all;
  } catch (e) {
    console.error('listTransactions failed', e);
    return [];
  }
}

export async function createTransaction(payload) {
  try {
    if (!fb.createTransaction) throw new Error('createTransaction not implemented');
    const id = await fb.createTransaction(payload);
    if (fb.getTransaction) {
      return await fb.getTransaction(id);
    }
    return { id, ...payload };
  } catch (e) {
    console.error('createTransaction failed', e);
    throw e;
  }
}

export async function updateTransaction(id, payload) {
  try {
    if (!fb.updateTransaction) throw new Error('updateTransaction not implemented');
    await fb.updateTransaction(id, payload);
    if (fb.getTransaction) {
      return await fb.getTransaction(id);
    }
    return { id, ...payload };
  } catch (e) {
    console.error('updateTransaction failed', e);
    throw e;
  }
}

export async function deleteTransaction(id) {
  try {
    if (!fb.deleteTransaction) throw new Error('deleteTransaction not implemented');
    await fb.deleteTransaction(id);
    return { ok: true };
  } catch (e) {
    console.error('deleteTransaction failed', e);
    throw e;
  }
}

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
  console.log('changePassword called with userId:', userId);
  
  if (!userId) {
    // Get the first user's ID
    const users = await fb.listUsers();
    console.log('Fetched users for password change:', users);
    if (users && users.length > 0) {
      userId = users[0].id;
    }
  }
  
  if (!userId) {
    throw new Error('No user found');
  }
  
  console.log('Getting user by ID:', userId);
  // Get current user to verify password
  const currentUser = await fb.getUserById(String(userId));
  console.log('Current user from DB:', currentUser);
  
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  // Verify current password against hashed value
  console.log('Verifying current password...');
  const isValid = await fb.comparePassword(payload.currentPassword, currentUser.password_hash);
  console.log('Password verification result:', isValid);
  
  if (!isValid) {
    throw new Error('incorrect_current_password');
  }
  
  // Validate new password
  if (!payload.newPassword || payload.newPassword.length < 6) {
    throw new Error('new_password_too_short');
  }
  
  // Hash and update password
  console.log('Hashing new password and updating user...');
  const hashed = await fb.hashPassword(payload.newPassword);
  await fb.updateUser(String(userId), { password_hash: hashed });
  console.log('Password updated successfully');
  return { success: true };
}

// Auth — verify against Firestore-stored inventory_users (password_hash)
export async function login({ username, password }) {
  const u = await fb.verifyLogin(username, password);
  if (!u) throw new Error('Invalid credentials');
  return { success: true, user: u };
}

// Cleanup utility
export async function cleanupOldFields() {
  return fb.cleanupOldTimestampFields();
}

// Settings
export async function getSettings() {
  return fb.getSettings();
}

export async function updateSettings(settings) {
  return fb.updateSettings(settings);
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
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkProductStockNotification,
  checkAllProductsForNotifications,
  generateStockNotifications,
  getReports,
  createReport,
  archiveReport,
  deleteReport,
  getProfile,
  updateProfile,
  changePassword,
  login
};
