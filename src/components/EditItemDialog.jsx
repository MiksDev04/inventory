import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function EditItemDialog({ item, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    minQuantity: 0,
    price: 0,
    supplier: "",
    status: "in-stock"
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Determine status based on quantity and minQuantity
    let status = "in-stock";
    if (formData.quantity === 0) {
      status = "out-of-stock";
    } else if (formData.quantity <= formData.minQuantity) {
      status = "low-stock";
    }

    onUpdate({ ...formData, status });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Item Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter item name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SKU *
                </label>
                <Input
                  required
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="Enter SKU"
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category *
                </label>
                <Input
                  required
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  placeholder="Enter category"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supplier *
                </label>
                <Input
                  required
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity *
                </label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Min Quantity *
                </label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => handleChange("minQuantity", parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (₱) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
