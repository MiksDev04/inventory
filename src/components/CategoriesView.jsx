import { useEffect, useState } from "react";
import { FolderOpen, Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

import { getCategories, getItems, createCategory as apiCreateCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory } from "../lib/api";

export function CategoriesView({ items }) {
  const [categories, setCategories] = useState([]);
  const [remoteItems, setRemoteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cats, its] = await Promise.all([getCategories(), getItems()]);
        if (!mounted) return;
        setCategories(cats);
        setRemoteItems(its);
      } catch (e) {
        if (mounted) setError("Failed to load categories");
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryItemCount = (categoryName) => {
    const list = (items && items.length ? items : remoteItems);
    return list.filter(item => item.category === categoryName).length;
  };

  const handleAddCategory = async (newCategory) => {
    try {
      const created = await apiCreateCategory(newCategory);
      setCategories(prev => [...prev, created]);
    } catch (e) {
      setError('Failed to add category');
      console.error(e);
    }
  };

  const handleUpdateCategory = async (updatedCategory) => {
    try {
      const saved = await apiUpdateCategory(updatedCategory.id, updatedCategory);
      setCategories(prev => prev.map(cat => cat.id === saved.id ? saved : cat));
      setSelectedCategory(null);
    } catch (e) {
      setError('Failed to update category');
      console.error(e);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      await apiDeleteCategory(selectedCategory.id);
      setCategories(prev => prev.filter(cat => cat.id !== selectedCategory.id));
      setSelectedCategory(null);
      setIsDeleteDialogOpen(false);
    } catch (e) {
      setError('Failed to delete category');
      console.error(e);
    }
  };

  const openEditDialog = (category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1>Categories</h1>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Organize and manage your inventory categories</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Categories</CardTitle>
            <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{categories.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Items</CardTitle>
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{(items && items.length ? items : remoteItems).length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Average Items</CardTitle>
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">
              {categories.length > 0 ? Math.round(((items && items.length ? items : remoteItems).length) / categories.length) : 0}
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
          const itemCount = getCategoryItemCount(category.name);
          return (
            <Card key={category.id} className={`border-2 ${getBorderColorClass(category.color)} hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${getColorClass(category.color)} flex items-center justify-center text-2xl shrink-0`}>
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-1">{category.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
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
                  <span>Created: {new Date(category.createdDate).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => openEditDialog(category)}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => openDeleteDialog(category)}
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
      {filteredCategories.length === 0 && (
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
        onAdd={handleAddCategory}
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedCategory(null);
        }}
        onUpdate={handleUpdateCategory}
        category={selectedCategory}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.name}". 
              This action cannot be undone.
              {selectedCategory && getCategoryItemCount(selectedCategory.name) > 0 && (
                <span className="block mt-2 text-orange-600 dark:text-orange-500">
                  Warning: This category has {getCategoryItemCount(selectedCategory.name)} item(s) associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setSelectedCategory(null); setIsDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
