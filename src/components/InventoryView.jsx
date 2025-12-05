import { useState } from "react";
import { Package, Plus, Search, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { InventoryTable } from "./InventoryTable";
import { AddProductDialog } from "./AddProductDialog";

export function InventoryView({ products, onAddProduct, onUpdateProduct, onDeleteProduct, categories = [], suppliers = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = 
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0;

    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle numeric columns
    if (sortColumn === 'quantity' || sortColumn === 'price') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      // Handle string columns
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
      if (sortColumn === column) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddProduct = (newProduct) => {
    onAddProduct(newProduct);
    setIsAddDialogOpen(false);
  };

  const handleExport = () => {
    // Prepare CSV data
    const headers = ['SKU', 'Name', 'Brand', 'Category', 'Supplier', 'Quantity', 'Min Quantity', 'Price', 'Status', 'Description'];
    const rows = sortedProducts.map(p => [
      p.sku || '',
      p.name || '',
      p.brand || '',
      p.category || '',
      p.supplier || '',
      p.quantity || 0,
      p.minQuantity || 0,
      p.price || 0,
      p.status || '',
      (p.description || '').replace(/[\n\r"/]/g, ' ')
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-white">Inventory</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">View and manage all inventory products</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
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
                <SelectProduct value="all">All Categories</SelectProduct>
                {categories.map(category => (
                  <SelectProduct key={category.id} value={category.name}>{category.name}</SelectProduct>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <InventoryTable 
        products={sortedProducts} 
        onUpdate={onUpdateProduct}
        onDelete={onDeleteProduct}
        categories={categories}
        suppliers={suppliers}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
      />

      {/* Add Product Dialog */}
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddProduct}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}
