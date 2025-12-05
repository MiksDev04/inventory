import { useEffect, useState } from "react";
import { FolderOpen, Plus, Search, Pencil, Trash2, Package, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

export function CategoriesView({ products, categories: initialCategories, onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [categories, setCategories] = useState(initialCategories || []);
  const [loading, setLoading] = useState(!initialCategories);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  useEffect(() => {
    setCategories(initialCategories || []);
    if (initialCategories) {
      setLoading(false);
    }
  }, [initialCategories]);

  const filteredCategories = (categories || []).filter(category => 
    (category && category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (category && category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryProductCount = (categoryName) => {
    if (!products || !Array.isArray(products)) return 0;
    return products.filter(product => product.category === categoryName).length;
  };

  const handleAdd = async (newCategory) => {
    try {
      await onAddCategory(newCategory);
      setIsAddDialogOpen(false);
    } catch (e) {
      setError('Failed to add category');
      console.error(e);
    }
  };

  const handleUpdate = async (updatedCategory) => {
    try {
      await onUpdateCategory(editingCategory.id, updatedCategory, editingCategory.name);
      setEditingCategory(null);
    } catch (e) {
      setError('Failed to update category');
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (e) {
      setError('Failed to delete category');
      console.error(e);
    }
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
      pink: "bg-pink-500",
      yellow: "bg-yellow-500",
      indigo: "bg-indigo-500",
    };
    return colorMap[color] || "bg-gray-500";
  };

  const getBorderColorClass = (color) => {
    const colorMap = {
      blue: "border-blue-200 dark:border-blue-800",
      green: "border-green-200 dark:border-green-800",
      purple: "border-purple-200 dark:border-purple-800",
      orange: "border-orange-200 dark:border-orange-800",
      red: "border-red-200 dark:border-red-800",
      pink: "border-pink-200 dark:border-pink-800",
      yellow: "border-yellow-200 dark:border-yellow-800",
      indigo: "border-indigo-200 dark:border-indigo-800",
    };
    return colorMap[color] || "border-gray-200 dark:border-gray-800";
  };

  const handleExport = () => {
    // Calculate stats
    const totalCategories = categories.length;
    const totalProducts = products.length;
    const avgProductsPerCategory = totalCategories > 0 ? (totalProducts / totalCategories).toFixed(1) : 0;

    // Summary Stats
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = [
      ['Total Categories', totalCategories],
      ['Total Products', totalProducts],
      ['Average Products Per Category', avgProductsPerCategory]
    ];

    // Category Details
    const categoryHeaders = ['Name', 'Icon/Color', 'Description', 'Product Count', 'Created Date'];
    const categoryRows = filteredCategories.map(c => [
      c.name || '',
      c.color || '',
      (c.description || '').replace(/[\n\r"/]/g, ' '),
      getCategoryProductCount(c.name),
      c.createdAt || c.created_at ? new Date(c.createdAt || c.created_at).toLocaleDateString() : 'N/A'
    ]);

    // Combine all sections
    const csvContent = [
      '=== CATEGORY SUMMARY ===',
      summaryHeaders.join(','),
      ...summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== CATEGORY DETAILS ===',
      categoryHeaders.join(','),
      ...categoryRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-white">Categories</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Organize and manage your inventory categories</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleExport()}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Categories</CardTitle>
            <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{(categories || []).length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{(products || []).length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Average Products</CardTitle>
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">
              {(categories || []).length > 0 ? Math.round(((products || []).length) / (categories || []).length) : 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Per category</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      {loading && (
        <Card className="mb-6"><CardContent className="pt-6">Loading categories...</CardContent></Card>
      )}
      {!!error && (
        <Card className="mb-6"><CardContent className="pt-6 text-red-600">{error}</CardContent></Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredCategories.map((category) => {
          const productCount = getCategoryProductCount(category.name);
          return (
            <Card key={category.id} className={`border-2 ${getBorderColorClass(category.color)} hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${getColorClass(category.color)} flex items-center justify-center text-2xl shrink-0 text-white`}>
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-1">{category.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {productCount} {productCount === 1 ? 'product' : 'products'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 min-h-[40px]">
                  {category.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span>Created: {category.createdAt || category.created_at ? new Date(category.createdAt || category.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => setDeletingCategory(category)}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && filteredCategories.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="mb-2">No categories found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? "Try adjusting your search" : "Get started by creating your first category"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Add Category Dialog */}
      <AddCategoryDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAdd}
      />

      {/* Edit Category Dialog */}
      {editingCategory && (
        <EditCategoryDialog
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdate={handleUpdate}
          category={editingCategory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCategory && (
        <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the category "{deletingCategory?.name}". 
                This action cannot be undone.
                {getCategoryProductCount(deletingCategory.name) > 0 && (
                  <span className="block mt-2 text-orange-600 dark:text-orange-500">
                    Warning: This category has {getCategoryProductCount(deletingCategory.name)} product(s) associated with it.
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