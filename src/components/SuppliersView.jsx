import { useEffect, useState } from "react";
import { Users, Plus, Mail, Phone, MapPin, Pencil, Trash2, Search, Download, Building2, ShoppingCart, ExternalLink, Tag, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

export function SuppliersView({ suppliers: initialSuppliers, products, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers || []);
  const [loading, setLoading] = useState(!initialSuppliers);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [editingWarehouse, setEditingWarehouse] = useState(false);
  const [warehouseData, setWarehouseData] = useState({
    name: 'San Pablo Warehouse',
    email: 'warehouse@sanpablo.ph',
    phone: '+63 949 123 4567',
    location: 'San Pablo City, Laguna, Philippines',
    description: 'Main distribution warehouse for inventory supplies and products.',
    status: 'active',
    orderingUrl: 'https://warehouse-management-system-taupe.vercel.app/'
  });

  useEffect(() => {
    setSuppliers(initialSuppliers || []);
    if (initialSuppliers) {
      setLoading(false);
    }
  }, [initialSuppliers]);

  const filteredSuppliers = (suppliers || []).filter(supplier =>
    (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.location && supplier.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSupplierStats = (supplierName) => {
    const supplierProducts = (products || []).filter(product => product.supplier === supplierName);
    const productCount = supplierProducts.length;
    const totalValue = supplierProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0);
    const categories = Array.from(new Set(supplierProducts.map(product => product.category)));
    return { productCount, totalValue, categories };
  };

  const handleAdd = async (newSupplier) => {
    try {
      await onAddSupplier(newSupplier);
      setIsAddDialogOpen(false);
    } catch (e) {
      setError('Failed to add supplier');
      console.error(e);
    }
  };

  const handleUpdate = async (updatedSupplier) => {
    try {
      await onUpdateSupplier(editingSupplier.id, updatedSupplier, editingSupplier.name);
      setEditingSupplier(null);
    } catch (e) {
      setError('Failed to update supplier');
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    try {
      await onDeleteSupplier(deletingSupplier.id);
      setDeletingSupplier(null);
    } catch (e) {
      setError('Failed to delete supplier');
      console.error(e);
    }
  };

  const activeSuppliers = (suppliers || []).filter(s => s.status === "active");
  const totalProducts = (products || []).length;
  const avgProductsPerSupplier = suppliers.length > 0 ? (totalProducts / suppliers.length).toFixed(1) : 0;

  const handleExport = () => {
    // Summary Stats
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = [
      ['Total Suppliers', suppliers.length],
      ['Active Suppliers', activeSuppliers.length],
      ['Total Products', totalProducts],
      ['Average Products Per Supplier', avgProductsPerSupplier]
    ];

    // Supplier Details
    const detailHeaders = ['Name', 'Contact Person', 'Email', 'Phone', 'Location', 'Status', 'Description', 'Product Count', 'Categories', 'Total Value'];
    const detailRows = filteredSuppliers.map(s => {
      const stats = getSupplierStats(s.name);
      return [
        s.name || '',
        s.contactPerson || '',
        s.email || '',
        s.phone || '',
        s.location || '',
        s.status || '',
        (s.description || '').replace(/[\n\r"/]/g, ' '),
        stats.productCount,
        stats.categories.join('; '),
        `₱${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];
    });

    // Combine all sections
    const csvContent = [
      '=== SUPPLIER SUMMARY ===',
      summaryHeaders.join(','),
      ...summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== SUPPLIER DETAILS ===',
      detailHeaders.join(','),
      ...detailRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `suppliers_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="w-10 h-10 bg-teal-600 dark:bg-teal-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-white">Suppliers</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage your supplier relationships</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleExport()}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Supplier</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-900 dark:text-gray-100">Total Suppliers</CardTitle>
            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{suppliers.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activeSuppliers.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-900 dark:text-gray-100">Total Products</CardTitle>
            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalProducts}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">From all suppliers</p>
          </CardContent>
        </Card>

       
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search suppliers by name, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      {loading && (
        <Card className="mb-6"><CardContent className="pt-6">Loading suppliers...</CardContent></Card>
      )}
      {!!error && (
        <Card className="mb-6"><CardContent className="pt-6 text-red-600">{error}</CardContent></Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Supplier Card */}
        <Card className="hover:shadow-lg transition-shadow lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl text-gray-900 dark:text-white">{warehouseData.name}</CardTitle>
                    <Badge variant={warehouseData.status === "active" ? "default" : "secondary"}>
                      {warehouseData.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    3 products supplied
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {warehouseData.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300">{warehouseData.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300">{warehouseData.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm md:col-span-2">
                <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300">{warehouseData.location}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t dark:border-gray-800">
              {warehouseData.orderingUrl && (
                <Button
                  onClick={() => window.open(warehouseData.orderingUrl, '_blank')}
                  className="gap-2 flex-1"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Order from {warehouseData.name}
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setEditingWarehouse(true)}
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            </div>
            {warehouseData.orderingUrl && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Opens external ordering system in a new window
              </p>
            )}
          </CardContent>
        </Card>

        {filteredSuppliers.map((supplier) => {
          const stats = getSupplierStats(supplier.name);
          
          return (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-gray-900 dark:text-white">{supplier.name}</CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.productCount} product{stats.productCount !== 1 ? 's' : ''} supplied
                      </p>
                    </div>
                  </div>
                  <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                    {supplier.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{supplier.location}</span>
                  </div>
                  
                  {supplier.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 pt-2">
                      {supplier.description}
                    </p>
                  )}

                  {stats.categories.length > 0 && (
                    <div className="pt-3 border-t dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">₱{stats.totalValue.toLocaleString()}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setEditingSupplier(supplier)}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setDeletingSupplier(supplier)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && !loading && (
        <Card className="p-12">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No suppliers found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? "Try adjusting your search" : "Get started by adding your first supplier"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Supplier
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Add Supplier Dialog */}
      <AddSupplierDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAdd}
      />

      {/* Edit Supplier Dialog */}
      {editingSupplier && (
        <EditSupplierDialog
          isOpen={!!editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onUpdate={handleUpdate}
          supplier={editingSupplier}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingSupplier && (
        <AlertDialog open={!!deletingSupplier} onOpenChange={() => setDeletingSupplier(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 dark:text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                This will permanently delete the supplier "{deletingSupplier?.name}".
                This action cannot be undone.
                {getSupplierStats(deletingSupplier.name).productCount > 0 && (
                  <span className="block mt-2 text-orange-600 dark:text-orange-500">
                    Warning: This supplier has {getSupplierStats(deletingSupplier.name).productCount} product(s) associated with it.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Edit Warehouse Dialog */}
      {editingWarehouse && (
        <Dialog open={editingWarehouse} onOpenChange={setEditingWarehouse}>
          <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='text-gray-900 dark:text-white'>Edit Warehouse Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              setEditingWarehouse(false);
            }}>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='warehouse-name' className='text-gray-700 dark:text-gray-300'>Warehouse Name</Label>
                  <Input
                    id='warehouse-name'
                    value={warehouseData.name}
                    onChange={(e) => setWarehouseData({ ...warehouseData, name: e.target.value })}
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='warehouse-email' className='text-gray-700 dark:text-gray-300'>Email</Label>
                  <Input
                    id='warehouse-email'
                    type='email'
                    value={warehouseData.email}
                    onChange={(e) => setWarehouseData({ ...warehouseData, email: e.target.value })}
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='warehouse-phone' className='text-gray-700 dark:text-gray-300'>Phone Number</Label>
                  <Input
                    id='warehouse-phone'
                    type='tel'
                    value={warehouseData.phone}
                    onChange={(e) => setWarehouseData({ ...warehouseData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='warehouse-location' className='text-gray-700 dark:text-gray-300'>Location</Label>
                  <Input
                    id='warehouse-location'
                    value={warehouseData.location}
                    onChange={(e) => setWarehouseData({ ...warehouseData, location: e.target.value })}
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='warehouse-description' className='text-gray-700 dark:text-gray-300'>Description</Label>
                  <Textarea
                    id='warehouse-description'
                    value={warehouseData.description}
                    onChange={(e) => setWarehouseData({ ...warehouseData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='warehouse-url' className='text-gray-700 dark:text-gray-300'>Ordering System URL</Label>
                  <Input
                    id='warehouse-url'
                    type='url'
                    value={warehouseData.orderingUrl}
                    onChange={(e) => setWarehouseData({ ...warehouseData, orderingUrl: e.target.value })}
                    placeholder='https://warehouse-management-system-taupe.vercel.app'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='warehouse-status' className='text-gray-700 dark:text-gray-300'>Status</Label>
                  <Select value={warehouseData.status} onValueChange={(value) => setWarehouseData({ ...warehouseData, status: value })}>
                    <SelectTrigger id='warehouse-status'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectProduct value='active'>Active</SelectProduct>
                      <SelectProduct value='inactive'>Inactive</SelectProduct>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setEditingWarehouse(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Update Warehouse</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
