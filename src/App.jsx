import { useState, useEffect, useCallback } from "react";
import LoginPage from "./components/LoginPage";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProfileProvider } from './context/ProfileContext';
import { Sidebar } from "./components/SIdebar";
import Dashboard from "./components/DashboardView";
import { InventoryDashboard } from "./components/InventoryDashboard";
import { CategoriesView } from "./components/CategoriesView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SuppliersView } from "./components/SuppliersView";
import { SettingsView } from "./components/SettingsView";
import ReportsView from "./components/ReportsView";
import ArchivedReportsView from "./components/ArchivedReportsView";
import { InventoryView } from './components/InventoryView';
import { Toast } from './components/Toast';
import TransactionsView from './components/TransactionsView';
import api from './lib/api';
import * as fb from './lib/firebaseClient';

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(() => window.innerWidth >= 1024 ? 240 : 0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsPagination, setReportsPagination] = useState({ page: 1, perPage: 10, total: 0 });
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [transactions, setTransactions] = useState([]);
  const [transactionsPagination, setTransactionsPagination] = useState({ page: 1, perPage: 20, total: 0 });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Update sidebar width on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarWidth(0);
      } else if (sidebarWidth === 0) {
        setSidebarWidth(240);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  // Fetch initial data on mount for dashboard
  useEffect(() => {
    if (loggedIn) {
      // Track previous product states to detect external changes
      let previousProducts = new Map();
      let productWasRestocked = new Set(); // Track which products were restocked
      let isFirstLoad = true;
      let processingQueue = Promise.resolve(); // Sequential processing queue
      let debounceTimer = null; // Debounce rapid subscription fires
      
      // Set up real-time listeners
      const unsubscribeProducts = fb.subscribeToProducts((products) => {
        // Clear any existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        // Debounce rapid fires - wait 500ms before processing
        debounceTimer = setTimeout(() => {
          // Queue this update to be processed sequentially
          processingQueue = processingQueue.then(async () => {
            setProducts(products);
          
          // On first load (when opening the app), check all products for low/out of stock
          if (isFirstLoad) {
            isFirstLoad = false;
            // Check all products that are currently low or out of stock
            try {
              await api.checkAllProductsForNotifications();
            } catch (e) {
              console.error('Failed to check products on startup', e);
            }
            return;
          }
          
          // Auto-check for low/out of stock when products change (from POS/external systems)
          for (const product of products) {
            const prevProduct = previousProducts.get(product.id);
            
            const currentQty = Number(product.quantity || 0);
            const minQty = Number(product.minQuantity || product.min_quantity || 0);
            
            if (prevProduct) {
              const prevQty = Number(prevProduct.quantity || 0);
              
              // Check if product was restocked (quantity went from low to good)
              const wasLow = prevQty < minQty || prevQty === 0;
              const isGoodNow = currentQty >= minQty && currentQty > 0;
              if (wasLow && isGoodNow) {
                productWasRestocked.add(product.id);
              }
              
              // Check if quantity changed and is now low/out of stock
              const isLowNow = currentQty === 0 || currentQty < minQty;
              const qtyChanged = currentQty !== prevQty;
              
              console.log(`Product: ${product.name}, Qty: ${currentQty}, MinQty: ${minQty}, IsLow: ${isLowNow}, QtyChanged: ${qtyChanged}`);
              
              if (isLowNow && qtyChanged) {
                console.log(`Creating notification for ${product.name}`);
                try {
                  await api.checkProductStockNotification(product.id);
                  console.log(`Notification created for ${product.name}`);
                } catch (e) {
                  console.error('Failed to create stock notification', e);
                }
                // Clear restocked flag after creating notification
                productWasRestocked.delete(product.id);
              }
            }
            
            // Always update tracked state
            previousProducts.set(product.id, { ...product });
          }
        }).catch(err => {
          console.error('Error processing product updates:', err);
        });
        }, 500); // Wait 500ms to batch rapid updates
      });

      const unsubscribeCategories = fb.subscribeToCategories((categories) => {
        setCategories(categories);
      });

      const unsubscribeSuppliers = fb.subscribeToSuppliers((suppliers) => {
        setSuppliers(suppliers);
      });

      const unsubscribeTransactions = fb.subscribeToTransactions((transactions) => {
        setTransactions(transactions);
      });

      const unsubscribeReports = fb.subscribeToReports((reports) => {
        setReports(reports);
        setReportsPagination(prev => ({ ...prev, total: reports.length }));
      });

      // Subscribe to notifications for real-time updates
      const unsubscribeNotifications = fb.subscribeToNotifications((notifications) => {
        // Notifications updated in real-time, sidebar will auto-refresh unread count
      });

      // Cleanup listeners on logout or unmount
      return () => {
        unsubscribeProducts();
        unsubscribeCategories();
        unsubscribeSuppliers();
        unsubscribeTransactions();
        unsubscribeReports();
        unsubscribeNotifications();
      };
    }
  }, [loggedIn]);

  const handleAddProduct = async (productData) => {
    try {
      const newProduct = await api.createProduct(productData);
      showToast('Product added successfully!', 'success');
      
      // Check if the newly added product needs a stock notification
      if (newProduct && newProduct.id) {
        try {
          await api.checkProductStockNotification(newProduct.id);
        } catch (e) {
          console.error('Failed to check stock notification', e);
        }
      }
    } catch (error) {
      console.error("Error adding product:", error);
      showToast('Failed to add product', 'error');
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      await api.updateProduct(productId, productData);
      showToast('Product updated successfully!', 'success');
      // Real-time listener will handle notification creation automatically
    } catch (error) {
      console.error("Error updating product:", error);
      showToast('Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.deleteProduct(productId);
      showToast('Product deleted successfully!', 'success');
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast('Failed to delete product', 'error');
    }
  };

  // --- Categories ---
  const handleAddCategory = async (categoryData) => {
    try {
      await api.createCategory(categoryData);
      showToast('Category added successfully!', 'success');
    } catch (error) {
      console.error("Error adding category:", error);
      showToast('Failed to add category', 'error');
    }
  };

  const handleUpdateCategory = async (categoryId, categoryData, oldName) => {
    try {
      await api.updateCategory(categoryId, categoryData);
      
      // If name changed, update all products with old category name
      if (oldName && categoryData.name && oldName !== categoryData.name) {
        const productsToUpdate = products.filter(p => p.category === oldName);
        for (const product of productsToUpdate) {
          await api.updateProduct(product.id, { ...product, category: categoryData.name });
        }
      }
      
      showToast('Category updated successfully!', 'success');
    } catch (error)
      {
      console.error("Error updating category:", error);
      showToast('Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await api.deleteCategory(categoryId);
      showToast('Category deleted successfully!', 'success');
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast('Failed to delete category', 'error');
    }
  };

    // --- Suppliers ---
  const handleAddSupplier = async (supplierData) => {
    try {
      await api.createSupplier(supplierData);
      showToast('Supplier added successfully!', 'success');
    } catch (error) {
      console.error("Error adding supplier:", error);
      showToast('Failed to add supplier', 'error');
    }
  };

  const handleUpdateSupplier = async (supplierId, supplierData, oldName) => {
    try {
      await api.updateSupplier(supplierId, supplierData);
      
      // If name changed, update all products with old supplier name
      if (oldName && supplierData.name && oldName !== supplierData.name) {
        const productsToUpdate = products.filter(p => p.supplier === oldName);
        for (const product of productsToUpdate) {
          await api.updateProduct(product.id, { ...product, supplier: supplierData.name });
        }
      }
      
      showToast('Supplier updated successfully!', 'success');
    } catch (error) {
      console.error("Error updating supplier:", error);
      showToast('Failed to update supplier', 'error');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      await api.deleteSupplier(supplierId);
      showToast('Supplier deleted successfully!', 'success');
    } catch (error) {
      console.error("Error deleting supplier:", error);
      showToast('Failed to delete supplier', 'error');
    }
  };

  // Transactions are read-only in the UI; add actions disabled

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentView("dashboard");
    // Clear any user data from localStorage if needed
    try { localStorage.removeItem("userToken"); } catch (e) { console.log(e) }
  };

  return (
    <ThemeProvider>
      <ProfileProvider>
        {!loggedIn ? (
          <LoginPage onLogin={(user) => { 
            setLoggedIn(true); 
            setCurrentView('dashboard'); 
            setCurrentUser(user);
          }} />
        ) : (
          <>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
            <div className="flex h-screen bg-gray-50 dark:bg-[#0d1117]">
              <Sidebar
                currentView={currentView}
                onNavigate={setCurrentView}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
                logout={handleLogout}
                currentUser={currentUser}
              />
              <main 
                className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d1117] w-full pt-16 lg:pt-0"
                style={{ 
                  marginLeft: sidebarWidth
                }}
              >
          {currentView === 'dashboard' && <Dashboard products={products} categories={categories} suppliers={suppliers} onNavigate={setCurrentView} />}
          {currentView === 'inventory' && (
            <InventoryView
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              categories={categories}
              suppliers={suppliers}
            />
          )}
          {currentView === 'categories' && (
            <CategoriesView
              products={products}
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
          {currentView === 'suppliers' && (
            <SuppliersView
              products={products}
              suppliers={suppliers}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}
          {currentView === 'analytics' && <AnalyticsView products={products} categories={categories} suppliers={suppliers} />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'reports' && (
            <ReportsView 
              reports={reports}
              pagination={reportsPagination}
              onNavigate={setCurrentView}
              onPaginationChange={setReportsPagination}
            />
          )}
          {currentView === 'transactions' && (
            <TransactionsView
              transactions={transactions}
            />
          )}
          {currentView === 'archived-reports' && <ArchivedReportsView onNavigate={setCurrentView} />}
            </main>
            </div>
          </>
        )}
      </ProfileProvider>
    </ThemeProvider>
  );
}

export default App;
