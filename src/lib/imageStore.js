// IndexedDB helper for storing product images
const DB_NAME = 'InventoryImages';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let dbPromise = null;

// Initialize IndexedDB
function initDB() {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
  
  return dbPromise;
}

// Save image to IndexedDB
export async function saveImage(path, file) {
  try {
    const db = await initDB();
    
    // Convert File to ArrayBuffer for storage
    const arrayBuffer = await file.arrayBuffer();
    const imageData = {
      buffer: arrayBuffer,
      type: file.type,
      name: file.name,
      size: file.size
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(imageData, path);
      
      request.onsuccess = () => resolve(path);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save image to IndexedDB:', error);
    throw error;
  }
}

// Get image from IndexedDB
export async function getImage(path) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(path);
      
      request.onsuccess = () => {
        const imageData = request.result;
        if (!imageData) {
          resolve(null);
          return;
        }
        
        // Convert ArrayBuffer back to Blob and create URL
        const blob = new Blob([imageData.buffer], { type: imageData.type });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get image from IndexedDB:', error);
    return null;
  }
}

// Delete image from IndexedDB
export async function deleteImage(path) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(path);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete image from IndexedDB:', error);
  }
}

// Delete all images for a product
export async function deleteProductImages(sku) {
  try {
    const db = await initDB();
    const prefix = `/uploads/products/${sku}/`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.key.startsWith(prefix)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete product images from IndexedDB:', error);
  }
}
