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

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(() => window.innerWidth >= 1024 ? 240 : 0);
  const [loggedIn, setLoggedIn] = useState(false);
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
      fetchProducts();
      fetchCategories();
      fetchSuppliers();
    }
  }, [loggedIn]);

  const fetchReports = useCallback(async (page = reportsPagination.page, perPage = reportsPagination.perPage) => {
    try {
      const res = await api.getReports({ page, perPage });
      setReports(res.data || []);
      setReportsPagination({ page, perPage, total: res.total || 0 });
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  }, [reportsPagination.page, reportsPagination.perPage]);

  const fetchTransactions = useCallback(async (page = transactionsPagination.page, perPage = transactionsPagination.perPage) => {
    try {
      const res = await api.listTransactions({ page, perPage });
      if (Array.isArray(res)) {
        setTransactions(res);
        setTransactionsPagination({ page, perPage, total: res.length });
      } else {
        setTransactions(res.data || []);
        setTransactionsPagination({ page: res.page || page, perPage: res.perPage || perPage, total: res.total || 0 });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [transactionsPagination.page, transactionsPagination.perPage]);

  // Fetch data when switching views (only if not already loaded)
  useEffect(() => {
    if (['inventory', 'analytics'].includes(currentView) && products.length === 0) {
      fetchProducts();
    }
    if (['inventory', 'categories', 'products', 'analytics'].includes(currentView) && categories.length === 0) {
      fetchCategories();
    }
    if (['inventory', 'suppliers', 'products', 'analytics'].includes(currentView) && suppliers.length === 0) {
      fetchSuppliers();
    }
    if (currentView === 'reports' && reports.length === 0) {
      fetchReports();
    }
    if (currentView === 'transactions' && transactions.length === 0) {
      fetchTransactions();
    }
  }, [currentView, products.length, categories.length, suppliers.length, reports.length, transactions.length, fetchReports, fetchTransactions]);

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await api.listProducts();
      setProducts(fetchedProducts);
      
      // Check for products with low/out of stock and create notifications if needed
      if (fetchedProducts && fetchedProducts.length > 0) {
        try {
          await api.checkAllProductsForNotifications();
        } catch (e) {
          console.error('Failed to check products for notifications', e);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const newProduct = await api.createProduct(productData);
      fetchProducts(); // Refetch products after adding
      fetchTransactions(); // Refresh transaction log
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
      fetchProducts(); // Refetch products after updating
      fetchTransactions(); // Refresh transaction log
      showToast('Product updated successfully!', 'success');
      
      // Check only this specific product for stock notification
      try {
        await api.checkProductStockNotification(productId);
      } catch (e) {
        console.error('Failed to check stock notification', e);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      showToast('Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.deleteProduct(productId);
      fetchProducts(); // Refetch products after deleting
      fetchTransactions(); // Refresh transaction log
      showToast('Product deleted successfully!', 'success');
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast('Failed to delete product', 'error');
    }
  };

  // --- Categories ---
  const fetchCategories = async () => {
    try {
      const fetchedCategories = await api.listCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddCategory = async (categoryData) => {
    try {
      await api.createCategory(categoryData);
      fetchCategories();
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
        fetchProducts();
      }
      
      fetchCategories();
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
      fetchCategories();
      showToast('Category deleted successfully!', 'success');
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast('Failed to delete category', 'error');
    }
  };

    // --- Suppliers ---
  const fetchSuppliers = async () => {
    try {
      const fetchedSuppliers = await api.listSuppliers();
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleAddSupplier = async (supplierData) => {
    try {
      await api.createSupplier(supplierData);
      fetchSuppliers();
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
        fetchProducts();
      }
      
      fetchSuppliers();
      showToast('Supplier updated successfully!', 'success');
    } catch (error) {
      console.error("Error updating supplier:", error);
      showToast('Failed to update supplier', 'error');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      await api.deleteSupplier(supplierId);
      fetchSuppliers();
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
          <LoginPage onLogin={(user) => { setLoggedIn(true); setCurrentView('dashboard'); try { localStorage.setItem('user', JSON.stringify(user || {})); } catch(e){ console.log(e) } }} />
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
              />
              <main 
                className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d1117] w-full pt-16 lg:pt-0"
                style={{ 
                  marginLeft: sidebarWidth
                }}
              >
          {currentView === 'dashboard' && <Dashboard products={products} categories={categories} suppliers={suppliers} />}
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
              onFetchReports={fetchReports}
              onNavigate={setCurrentView}
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
