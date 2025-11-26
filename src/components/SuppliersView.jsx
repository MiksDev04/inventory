import { useEffect, useState } from "react";
import { Users, Plus, Mail, Phone, MapPin, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Manage your supplier relationships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-900 dark:text-gray-100">Average Products/Supplier</CardTitle>
            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {suppliers.length > 0 ? Math.round(totalProducts / suppliers.length) : 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Products per supplier</p>
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
    </div>
  );
}
