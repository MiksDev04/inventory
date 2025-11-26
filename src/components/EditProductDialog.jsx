import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from "./ui/select";

export function EditProductDialog({ product, isOpen, onClose, onUpdate, categories = [], suppliers = [] }) {
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
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Form submitted!', formData);
    console.log('Product ID:', product.id, 'Type:', typeof product.id);
    
    // Determine status based on quantity and minQuantity
    let status = "in-stock";
    if (formData.quantity === 0) {
      status = "out-of-stock";
    } else if (formData.quantity <= formData.minQuantity) {
      status = "low-stock";
    }

    // Only send the fields we want to update
    const updateData = {
      id: String(product.id), // Ensure ID is a string
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      supplier: formData.supplier,
      quantity: Number(formData.quantity),
      minQuantity: Number(formData.minQuantity),
      price: Number(formData.price),
      status
    };
    
    console.log('Calling onUpdate with:', updateData);
    onUpdate(updateData);
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Product</h2>
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
                  Product Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter product name"
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
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800">
                    {/* If the product's current category isn't in the categories list, show it first for transparency */}
                    {formData.category && !categories.find(c => c.name === formData.category) && (
                      <SelectProduct key={`current-${formData.category}`} value={formData.category} className="text-gray-900 dark:text-gray-100">
                        {formData.category}
                      </SelectProduct>
                    )}
                    {categories.map((c) => (
                      <SelectProduct key={c.id} value={c.name} className="text-gray-900 dark:text-gray-100">
                        {c.name}
                      </SelectProduct>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supplier *
                </label>
                <Select value={formData.supplier} onValueChange={(value) => handleChange("supplier", value)}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800">
                    {/* If the product's current supplier isn't in the suppliers list, show it first for transparency */}
                    {formData.supplier && !suppliers.find(s => s.name === formData.supplier) && (
                      <SelectProduct key={`current-sup-${formData.supplier}`} value={formData.supplier} className="text-gray-900 dark:text-gray-100">
                        {formData.supplier}
                      </SelectProduct>
                    )}
                    {suppliers.map((s) => (
                      <SelectProduct key={s.id} value={s.name} className="text-gray-900 dark:text-gray-100">
                        {s.name}
                      </SelectProduct>
                    ))}
                  </SelectContent>
                </Select>
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
              Update Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
