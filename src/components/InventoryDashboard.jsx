import { useState } from "react";
import { Package, Plus, Search, Filter, Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { PesoIcon } from "./icons/PesoIcon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { InventoryTable } from "./InventoryTable";
import { AddItemDialog } from "./AddItemDialog";
import { Badge } from "./ui/badge";
import { mockInventoryData } from "../data/mockInventoryData";

export function InventoryDashboard() {
  const [items, setItems] = useState(mockInventoryData);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(items.map(item => item.category)));

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = items.filter(item => item.status === "low-stock").length;
  const outOfStockCount = items.filter(item => item.status === "out-of-stock").length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const handleAddItem = (newItem) => {
    const item = {
      ...newItem,
      id: String(items.length + 1),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setItems([...items, item]);
  };

  const handleUpdateItem = (updatedItem) => {
    setItems(items.map(item => 
      item.id === updatedItem.id ? { ...updatedItem, lastUpdated: new Date().toISOString().split('T')[0] } : item
    ));
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

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
      <InventoryTable 
        items={filteredItems} 
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteItem}
      />

      {/* Add Item Dialog */}
      <AddItemDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddItem}
        categories={categories}
      />
    </div>
  );
}
