import { useState } from "react";
import { Users, Plus, Mail, Phone, MapPin, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

const mockSuppliers = [
  {
    id: "1",
    name: "TechSupply Co.",
    email: "contact@techsupply.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    description: "Leading supplier of electronic components and devices",
    status: "active",
    createdDate: "2025-01-10",
  },
  {
    id: "2",
    name: "Cable World",
    email: "sales@cableworld.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    description: "Specialized in cables and connectivity solutions",
    status: "active",
    createdDate: "2025-01-12",
  },
  {
    id: "3",
    name: "Office Plus",
    email: "info@officeplus.com",
    phone: "+1 (555) 345-6789",
    location: "Chicago, IL",
    description: "Complete office furniture and equipment provider",
    status: "active",
    createdDate: "2025-01-14",
  },
  {
    id: "4",
    name: "Display Masters",
    email: "orders@displaymasters.com",
    phone: "+1 (555) 456-7890",
    location: "Austin, TX",
    description: "Premium display and monitor solutions",
    status: "active",
    createdDate: "2025-01-15",
  },
  {
    id: "5",
    name: "Light & Home",
    email: "hello@lighthome.com",
    phone: "+1 (555) 567-8901",
    location: "Seattle, WA",
    description: "Lighting and home office accessories",
    status: "active",
    createdDate: "2025-01-16",
  },
  {
    id: "6",
    name: "Paper Co.",
    email: "contact@paperco.com",
    phone: "+1 (555) 678-9012",
    location: "Boston, MA",
    description: "Stationery and office supply specialist",
    status: "active",
    createdDate: "2025-01-18",
  },
];

export function SuppliersView({ items }) {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSupplierStats = (supplierName) => {
    const supplierItems = items.filter(item => item.supplier === supplierName);
    const itemCount = supplierItems.length;
    const totalValue = supplierItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const categories = Array.from(new Set(supplierItems.map(item => item.category)));
    return { itemCount, totalValue, categories };
  };

  const handleAddSupplier = (newSupplier) => {
    const supplier = {
      ...newSupplier,
      id: String(suppliers.length + 1),
      createdDate: new Date().toISOString().split('T')[0],
    };
    setSuppliers([...suppliers, supplier]);
  };

  const handleUpdateSupplier = (updatedSupplier) => {
    setSuppliers(suppliers.map(sup =>
      sup.id === updatedSupplier.id ? updatedSupplier : sup
    ));
    setSelectedSupplier(null);
  };

  const handleDeleteSupplier = () => {
    if (selectedSupplier) {
      setSuppliers(suppliers.filter(sup => sup.id !== selectedSupplier.id));
      setSelectedSupplier(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const activeSuppliers = suppliers.filter(s => s.status === "active");
  const totalProducts = suppliers.reduce((sum, supplier) => {
    return sum + getSupplierStats(supplier.name).itemCount;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto p-8">
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
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Products supplied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-gray-900 dark:text-gray-100">Average Items/Supplier</CardTitle>
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
                        {stats.itemCount} product{stats.itemCount !== 1 ? 's' : ''} supplied
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
                      onClick={() => openEditDialog(supplier)}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => openDeleteDialog(supplier)}
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
      {filteredSuppliers.length === 0 && (
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
        onAdd={handleAddSupplier}
      />

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedSupplier(null);
        }}
        onUpdate={handleUpdateSupplier}
        supplier={selectedSupplier}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              This will permanently delete the supplier "{selectedSupplier?.name}".
              This action cannot be undone.
              {selectedSupplier && getSupplierStats(selectedSupplier.name).itemCount > 0 && (
                <span className="block mt-2 text-orange-600 dark:text-orange-500">
                  Warning: This supplier has {getSupplierStats(selectedSupplier.name).itemCount} product(s) associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSupplier(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
