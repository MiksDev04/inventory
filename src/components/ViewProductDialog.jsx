import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getImageUrl } from "../lib/api";

export function ViewProductDialog({ product, isOpen, onClose }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadImages = async () => {
      if (product?.images && Array.isArray(product.images)) {
        const urls = [];
        for (const imagePath of product.images) {
          const url = await getImageUrl(imagePath);
          urls.push(url);
        }
        setImageUrls(urls);
      } else {
        setImageUrls([]);
      }
      setCurrentImageIndex(0);
    };
    
    if (isOpen && product) {
      loadImages();
    }
  }, [product, isOpen]);

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

  if (!isOpen || !product) return null;

  const hasImages = imageUrls.length > 0;
  const status = calculateStatus(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Image Section */}
            {hasImages ? (
              <div className="relative">
                <img
                  src={imageUrls[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-64 object-contain rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {imageUrls.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                <ImageIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {/* Product Information Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Name</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{product.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</label>
                <p className="text-base font-mono text-gray-900 dark:text-white mt-1">{product.sku}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{product.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{product.supplier}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{product.brand || <span className="italic text-gray-400 dark:text-gray-500">No brand</span>}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">
                  {Number(product.quantity) || 0}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (Min: {Number(product.minQuantity) || 0})
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">
                  ₱{(Number(product.price) || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  {getStatusBadge(status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{product.lastUpdated || 'N/A'}</p>
              </div>
            </div>

            {/* Description Section */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                  {product.description || <span className="italic text-gray-400 dark:text-gray-500">No description provided</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
