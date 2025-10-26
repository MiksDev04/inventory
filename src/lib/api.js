import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export async function getItems(opts) {
  // opts: { page, perPage }
  if (opts && opts.page) {
    const { data } = await api.get('/items', { params: { page: opts.page, perPage: opts.perPage } });
    // server returns { data, total, page, perPage }
    return {
      ...data,
      data: data.data.map(r => ({
        ...r,
        price: typeof r.price === 'string' ? parseFloat(r.price) : r.price,
        quantity: typeof r.quantity === 'string' ? parseInt(r.quantity, 10) : r.quantity,
        minQuantity: typeof r.minQuantity === 'string' ? parseInt(r.minQuantity, 10) : r.minQuantity,
      })),
    };
  }

  const { data } = await api.get('/items');
  return data.map(r => ({
    ...r,
    price: typeof r.price === 'string' ? parseFloat(r.price) : r.price,
    quantity: typeof r.quantity === 'string' ? parseInt(r.quantity, 10) : r.quantity,
    minQuantity: typeof r.minQuantity === 'string' ? parseInt(r.minQuantity, 10) : r.minQuantity,
  }));
}

export async function createItem(payload) {
  const { data } = await api.post('/items', payload);
  return data;
}

export async function updateItem(id, payload) {
  const { data } = await api.put(`/items/${id}`, payload);
  return data;
}

export async function deleteItem(id) {
  const { data } = await api.delete(`/items/${id}`);
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data;
}

export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload);
  return data;
}

export async function updateCategory(id, payload) {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}

export async function getSuppliers() {
  const { data } = await api.get('/suppliers');
  return data;
}

export async function createSupplier(payload) {
  const { data } = await api.post('/suppliers', payload);
  return data;
}

export async function updateSupplier(id, payload) {
  const { data } = await api.put(`/suppliers/${id}`, payload);
  return data;
}

export async function deleteSupplier(id) {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
}

// Notifications API
export async function getNotifications(userId = 1) {
  const { data } = await api.get('/notifications', { params: { userId } });
  return data;
}

export async function getUnreadCount(userId = 1) {
  const { data } = await api.get('/notifications/unread-count', { params: { userId } });
  return data;
}

export async function markAsRead(id) {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}

export async function markAllAsRead(userId = 1) {
  const { data } = await api.put('/notifications/mark-all-read', null, { params: { userId } });
  return data;
}

export async function deleteNotification(id) {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
}

export async function generateStockNotifications(userId = 1) {
  const { data } = await api.post('/notifications/generate', null, { params: { userId } });
  return data;
}

// Reports API
export async function getReports(opts) {
  // opts: { page, perPage }
  if (opts && opts.page) {
    const { data } = await api.get('/reports', { params: { page: opts.page, perPage: opts.perPage } });
    // server returns { data, total, page, perPage }
    return {
      ...data,
      data: data.data,
    };
  }
  const { data } = await api.get('/reports');
  return data;
}

export async function createReport(payload) {
  const { data } = await api.post('/reports', payload);
  return data;
}

export async function deleteReport(id) {
  const { data } = await api.delete(`/reports/${id}`);
  return data;
}

