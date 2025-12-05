import { useEffect, useState } from "react";
import { Package, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, Clock, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { PesoIcon } from "./icons/PesoIcon";
import { getProducts, getCategories, getSuppliers } from "../lib/api";

export default function Dashboard({ products: initialProducts, categories: initialCategories, suppliers: initialSuppliers, onNavigate }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [categoriesList, setCategoriesList] = useState(initialCategories || []);
  const [suppliersList, setSuppliersList] = useState(initialSuppliers || []);
  const [loading, setLoading] = useState(!initialProducts || !initialCategories || !initialSuppliers);
  const [error, setError] = useState("");

  useEffect(() => {
    // Update state when props change
    if (initialProducts) setProducts(initialProducts);
    if (initialCategories) setCategoriesList(initialCategories);
    if (initialSuppliers) setSuppliersList(initialSuppliers);
    
    // If we have initial data, we're not loading
    if (initialProducts && initialCategories && initialSuppliers) {
      setLoading(false);
    }
  }, [initialProducts, initialCategories, initialSuppliers]);

  useEffect(() => {
    // Only fetch if no initial data was provided
    if (!initialProducts || !initialCategories || !initialSuppliers) {
      let mounted = true;
      (async () => {
        try {
          const [data, cats, sups] = await Promise.all([getProducts(), getCategories(), getSuppliers()]);
          if (mounted) {
            setProducts(data);
            setCategoriesList(Array.isArray(cats) ? cats : []);
            setSuppliersList(Array.isArray(sups) ? sups : []);
          }
        } catch (e) {
          if (mounted) setError("Failed to load dashboard data");
          console.error(e);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false };
    }
  }, [initialProducts, initialCategories, initialSuppliers]);

  const totalProducts = (products || []).reduce((sum, product) => sum + (Number(product.quantity) || 0), 0);
  const totalCategories = categoriesList.length;
  const totalSuppliers = suppliersList.length;
  const totalValue = (products || []).reduce((sum, product) => {
    const qty = Number(product.quantity) || 0;
    const price = Number(product.price) || 0;
    return sum + (qty * price);
  }, 0);
  
  const categoryBreakdown = (products || []).reduce((acc, product) => {
    const qty = Number(product.quantity) || 0;
    acc[product.category] = (acc[product.category] || 0) + qty;
    return acc;
  }, {});

  const recentlyUpdated = (products || []).slice().sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0,5);

  const topValueProducts = (products || []).slice().sort((a, b) => {
    const aValue = (Number(a.quantity) || 0) * (Number(a.price) || 0);
    const bValue = (Number(b.quantity) || 0) * (Number(b.price) || 0);
    return bValue - aValue;
  }).slice(0,5);

  const handleExport = () => {
    // Summary Stats
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = [
      ['Total Products', totalProducts],
      ['Total Categories', totalCategories],
      ['Total Suppliers', totalSuppliers],
      ['Total Inventory Value', `₱${totalValue.toLocaleString()}`]
    ];

    // Category Breakdown
    const categoryHeaders = ['Category', 'Product Count'];
    const categoryRows = Object.entries(categoryBreakdown).map(([cat, qty]) => [cat, qty]);

    // Top Value Products
    const topProductHeaders = ['Product Name', 'SKU', 'Quantity', 'Unit Price', 'Total Value'];
    const topProductRows = topValueProducts.map(p => [
      p.name || '',
      p.sku || '',
      p.quantity || 0,
      `₱${(p.price || 0).toLocaleString()}`,
      `₱${((p.quantity || 0) * (p.price || 0)).toLocaleString()}`
    ]);

    // Recently Updated Products
    const recentHeaders = ['Product Name', 'SKU', 'Quantity', 'Last Updated'];
    const recentRows = recentlyUpdated.map(p => [
      p.name || '',
      p.sku || '',
      p.quantity || 0,
      p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : 'N/A'
    ]);

    // Combine all sections
    const csvContent = [
      '=== DASHBOARD SUMMARY ===',
      summaryHeaders.join(','),
      ...summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== INVENTORY BY CATEGORY ===',
      categoryHeaders.join(','),
      ...categoryRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== TOP VALUE PRODUCTS ===',
      topProductHeaders.join(','),
      ...topProductRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== RECENTLY UPDATED PRODUCTS ===',
      recentHeaders.join(','),
      ...recentRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-[#0d1117]">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your inventory.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => handleExport()}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="mb-6"><CardContent className="pt-6">Loading...</CardContent></Card>
        ) : error ? (
          <Card className="mb-6"><CardContent className="pt-6 text-red-600">{error}</CardContent></Card>
        ) : (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div 
            className="cursor-pointer transition-transform"
            onClick={() => onNavigate('inventory')}
          >
            <Card className="h-full hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Products</CardTitle>
                <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts.toLocaleString()}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Across {products.length} products • Click to view
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="h-full hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Value</CardTitle>
              <PesoIcon className="w-4 h-4 text-green-600 dark:text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">₱{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Total inventory value
              </p>
            </CardContent>
          </Card>

          <div 
            className="cursor-pointer  transition-transform"
            onClick={() => onNavigate('categories')}
          >
            <Card className="h-full hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Categories</CardTitle>
                <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCategories}</div>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                  Distinct categories • Click to view
                </p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="cursor-pointer transition-transform"
            onClick={() => onNavigate('suppliers')}
          >
            <Card className="h-full hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Suppliers</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSuppliers}</div>
                <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                  Registered suppliers • Click to view
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryBreakdown).map(([category, count]) => {
                  const percentage = (count / totalProducts) * 100;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{count} products</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Value Products */}
          <Card>
              <CardHeader>
                <CardTitle>Top Value Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topValueProducts.map((product) => {
                  const productValue = (Number(product.quantity) || 0) * (Number(product.price) || 0);
                  return (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-200">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.quantity} units × ₱{Number(product.price).toLocaleString()}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">₱{productValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recently Updated */}
        <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              Recently Updated Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentlyUpdated.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-200 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-200">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900 dark:text-gray-200">{product.quantity} units</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.lastUpdated}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
  );
}
