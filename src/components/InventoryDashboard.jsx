import { useEffect, useState } from "react";
import { Package, Plus, Search, Filter, Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { PesoIcon } from "./icons/PesoIcon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { InventoryTable } from "./InventoryTable";
import { AddItemDialog } from "./AddItemDialog";
import { Badge } from "./ui/badge";
import { getItems, getCategories, getSuppliers, createItem as apiCreateItem, updateItem as apiUpdateItem, deleteItem as apiDeleteItem } from "../lib/api";

export function InventoryDashboard() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
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
        const itemsRes = await getItems({ page, perPage });
        if (!mounted) return;
        // itemsRes is { data, total, page, perPage }
        setItems(itemsRes.data);
        setTotalItemsCount(itemsRes.total || 0);
        setCategoriesList(cats.map(c => c.name));
        setSuppliersList(sups.map(s => s.name));
      } catch (e) {
        if (mounted) setError("Failed to load items");
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPage();
    return () => { mounted = false };
  }, [page, perPage]);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = categoriesList.length ? categoriesList : Array.from(new Set(items.map(item => item.category)));

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = items.filter(item => item.status === "low-stock").length;
  const outOfStockCount = items.filter(item => item.status === "out-of-stock").length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const fetchItemsPage = async (p = page, per = perPage) => {
    try {
      setLoading(true);
      const itemsRes = await getItems({ page: p, perPage: per });
      setItems(itemsRes.data);
      setTotalItemsCount(itemsRes.total || 0);
    } catch (e) {
      setError('Failed to load items');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (newItem) => {
    try {
      await apiCreateItem({
        sku: newItem.sku,
        name: newItem.name,
        category: newItem.category,
        supplier: newItem.supplier,
        quantity: newItem.quantity,
        minQuantity: newItem.minQuantity,
        price: newItem.price,
      });
      // refresh current page
      fetchItemsPage();
    } catch (e) {
      setError('Failed to add item');
      console.error(e);
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      await apiUpdateItem(updatedItem.id, {
        sku: updatedItem.sku,
        name: updatedItem.name,
        category: updatedItem.category,
        supplier: updatedItem.supplier,
        quantity: updatedItem.quantity,
        minQuantity: updatedItem.minQuantity,
        price: updatedItem.price,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
      // refresh current page to keep consistency
      fetchItemsPage();
    } catch (e) {
      setError('Failed to update item');
      console.error(e);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await apiDeleteItem(id);
      // refresh current page
      fetchItemsPage();
    } catch (e) {
      setError('Failed to delete item');
      console.error(e);
    }
  };

  // computed when rendering; no need for a separate variable

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <h1>Inventory Management</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Manage and track your inventory items</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Items</CardTitle>
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{totalItems}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Across {items.length} products</p>
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
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Items need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Out of Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{outOfStockCount}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Items unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, SKU, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      {loading && (
        <Card className="mb-6"><CardContent className="pt-6">Loading items...</CardContent></Card>
      )}
      {!!error && (
        <Card className="mb-6"><CardContent className="pt-6 text-red-600">{error}</CardContent></Card>
      )}
      <InventoryTable 
        items={filteredItems} 
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
        categories={categories}
        suppliers={suppliersList}
      />

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <div>Page {page} of {Math.max(1, Math.ceil((totalItemsCount || 0) / perPage))}</div>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.max(1, Math.ceil((totalItemsCount || 0) / perPage))}>Next</Button>
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

      {/* Add Item Dialog */}
      <AddItemDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddItem}
        categories={categories}
        suppliers={suppliersList}
      />
    </div>
  );
}
