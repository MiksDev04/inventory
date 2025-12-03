import { useState, useEffect } from "react";
import { MoreVertical, Pencil, Trash2, Package, Image, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { getImageUrl } from "../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuProduct, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { EditProductDialog } from "./EditProductDialog";
import { ViewProductDialog } from "./ViewProductDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

export function InventoryTable({ products = [], onUpdate, onDelete, categories = [], suppliers = [] }) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState({});

  // Load image URLs when products change
  useEffect(() => {
    const loadImages = async () => {
      const urls = {};
      for (const product of products) {
        if (product.images && Array.isArray(product.images)) {
          urls[product.id] = [];
          for (const imagePath of product.images) {
            const url = await getImageUrl(imagePath);
            urls[product.id].push(url);
          }
        }
      }
      setImageUrls(urls);
    };
    loadImages();
  }, [products]);

  // Calculate status based on quantity and minQuantity
  const calculateStatus = (product) => {
    const qty = Number(product.quantity) || 0;
    const minQty = Number(product.minQuantity || product.min_quantity) || 0;
    
    if (qty === 0) {
      return "out-of-stock";
    } else if (qty <= minQty) {
      return "low-stock";
    }
    return "in-stock";
  };

  const getStatusBadge = (status) => {
    const variants = {
      "in-stock": "success",
      "low-stock": "warning",
      "out-of-stock": "danger"
    };

    const labels = {
      "in-stock": "In Stock",
      "low-stock": "Low Stock",
      "out-of-stock": "Out of Stock"
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleDelete = () => {
    if (deletingProduct) {
      onDelete(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Products ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Images</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden xl:table-cell">Brand</TableHead>
                  <TableHead className="hidden lg:table-cell">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead >Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const productImageUrls = imageUrls[product.id] || [];
                    const hasImages = productImageUrls.length > 0;
                    
                    return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {hasImages ? (
                          <div className="flex items-center gap-1">
                            <img
                              src={productImageUrls[0]}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80"
                              onClick={() => {
                                setImagePreview({ images: productImageUrls, name: product.name });
                                setCurrentImageIndex(0);
                              }}
                            />
                            {productImageUrls.length > 1 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">+{productImageUrls.length - 1}</span>
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <Image className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-gray-900 dark:text-gray-100">{product.sku}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{product.name}</TableCell>
                      <TableCell className="hidden xl:table-cell text-gray-900 dark:text-gray-100">
                        {product.brand || <span className="text-gray-400 dark:text-gray-500 italic">No brand</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-gray-600 dark:text-gray-400" title={product.description}>
                        {product.description ? (
                          product.description.length > 10 
                            ? `${product.description.substring(0, 10)}...` 
                            : product.description
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{product.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-gray-100">{Number(product.quantity) || 0}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Min: {Number(product.minQuantity) || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">₱{(Number(product.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{product.supplier}</TableCell>
                      <TableCell>{getStatusBadge(calculateStatus(product))}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{product.lastUpdated}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuProduct onClick={() => setViewingProduct(product)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuProduct>
                            <DropdownMenuProduct onClick={() => setEditingProduct(product)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuProduct>
                            <DropdownMenuProduct 
                              onClick={() => setDeletingProduct(product)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuProduct>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={(updatedProduct) => {
            onUpdate(updatedProduct.id, updatedProduct);
            setEditingProduct(null);
          }}
          categories={categories}
          suppliers={suppliers}
        />
      )}

      {/* View Dialog */}
      {viewingProduct && (
        <ViewProductDialog
          product={viewingProduct}
          isOpen={!!viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingProduct?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inventory product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProduct(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setImagePreview(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Product Name */}
            <div className="absolute -top-12 left-0 text-white font-medium">
              {imagePreview.name}
            </div>

            {/* Main Image */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={imagePreview.images[currentImageIndex]}
                alt={`${imagePreview.name} - ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            {/* Navigation & Counter */}
            {imagePreview.images.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === 0 ? imagePreview.images.length - 1 : prev - 1
                  )}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === imagePreview.images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                  {currentImageIndex + 1} / {imagePreview.images.length}
                </div>

                {/* Thumbnail Strip */}
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {imagePreview.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all ${
                        idx === currentImageIndex 
                          ? 'border-blue-500 scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
