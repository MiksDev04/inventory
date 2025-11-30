import { useEffect, useState } from "react";
import { Package, Plus, Search, Filter, Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { PesoIcon } from "./icons/PesoIcon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { InventoryTable } from "./InventoryTable";
import { AddProductDialog } from "./AddProductDialog";
import { Badge } from "./ui/badge";
import { getProducts, getCategories, getSuppliers, createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct } from "../lib/api";

export function InventoryDashboard() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPage = async () => {
      try {
        setLoading(true);
        const [cats, sups] = await Promise.all([getCategories(), getSuppliers()]);
        const productsRes = await getProducts({ page, perPage });
        if (!mounted) return;
        // productsRes is { data, total, page, perPage }
        setProducts(productsRes.data);
        setTotalProductsCount(productsRes.total || 0);
        setCategoriesList(cats);
        setSuppliersList(sups);
      } catch (e) {
        if (mounted) setError("Failed to load products");
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPage();
    return () => { mounted = false };
  }, [page, perPage]);

  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = categoriesList.length ? categoriesList : Array.from(new Set((products || []).map(product => product.category))).map(name => ({ id: name, name }));

  const totalProducts = (products || []).reduce((sum, product) => sum + product.quantity, 0);
  const lowStockCount = (products || []).filter(product => product.status === "low-stock").length;
  const outOfStockCount = (products || []).filter(product => product.status === "out-of-stock").length;
  const totalValue = (products || []).reduce((sum, product) => sum + (product.quantity * product.price), 0);

  const fetchProductsPage = async (p = page, per = perPage) => {
    try {
      setLoading(true);
      const productsRes = await getProducts({ page: p, perPage: per });
      setProducts(productsRes.data);
      setTotalProductsCount(productsRes.total || 0);
    } catch (e) {
      setError('Failed to load products');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (newProduct) => {
    try {
      await apiCreateProduct({
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        supplier: newProduct.supplier,
        quantity: newProduct.quantity,
        minQuantity: newProduct.minQuantity,
        price: newProduct.price,
      });
      // refresh current page
      fetchProductsPage();
    } catch (e) {
      setError('Failed to add product');
      console.error(e);
    }
  };

  const handleUpdateProduct = async (updatedProduct) => {
    console.log('handleUpdateProduct received:', updatedProduct);
    try {
      await apiUpdateProduct(updatedProduct.id, updatedProduct);
      console.log('API call successful, refreshing...');
      fetchProductsPage();
    } catch (e) {
      setError('Failed to update product');
      console.error('Update error:', e);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await apiDeleteProduct(id);
      // refresh current page
      fetchProductsPage();
    } catch (e) {
      setError('Failed to delete product');
      console.error(e);
    }
  };

  // computed when rendering; no need for a separate variable

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <h1 className="text-xl md:text-2xl lg:text-3xl">Inventory Management</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage and track your inventory products</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{totalProducts}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Across {products.length} products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
            <PesoIcon className="w-4 h-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">₱{totalValue.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Inventory worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Low Stock</CardTitle>
            <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{lowStockCount}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Products need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Out of Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{outOfStockCount}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Products unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, SKU, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectProduct value="all">All Categories</SelectProduct>
                  {categories.map(category => (
                    <SelectProduct key={category} value={category}>{category}</SelectProduct>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectProduct value="all">All Status</SelectProduct>
                  <SelectProduct value="in-stock">In Stock</SelectProduct>
                  <SelectProduct value="low-stock">Low Stock</SelectProduct>
                  <SelectProduct value="out-of-stock">Out of Stock</SelectProduct>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      {loading && (
        <Card className="mb-6"><CardContent className="pt-6">Loading products...</CardContent></Card>
      )}
      {!!error && (
        <Card className="mb-6"><CardContent className="pt-6 text-red-600">{error}</CardContent></Card>
      )}
      <InventoryTable 
        products={filteredProducts} 
        onUpdate={handleUpdateProduct}
        onDelete={handleDeleteProduct}
        categories={categories}
        suppliers={suppliersList}
      />

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <div>Page {page} of {Math.max(1, Math.ceil((totalProductsCount || 0) / perPage))}</div>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.max(1, Math.ceil((totalProductsCount || 0) / perPage))}>Next</Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">Per page:</div>
          <select value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(1); }} className="border rounded px-2 py-1">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Add Product Dialog */}
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddProduct}
        categories={categories}
        suppliers={suppliersList}
      />
    </div>
  );
}
