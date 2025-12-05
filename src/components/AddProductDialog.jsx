import React, { useState, useEffect } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from "./ui/select";
import * as api from '../lib/api';

export function AddProductDialog({ isOpen, onClose, onAdd, categories, suppliers = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: "",
    minQuantity: "",
    price: "",
    supplier: "",
    brand: "",
    description: "",
    status: "in-stock",
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [defaultMinQuantity, setDefaultMinQuantity] = useState(20);

  // Load system settings to get default low stock threshold
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSettings();
        const threshold = settings.system?.lowStockThreshold || 20;
        setDefaultMinQuantity(threshold);
      } catch (e) {
        console.error('Failed to load system settings', e);
      }
    };
    loadSettings();
  }, []);

  // Auto-generate SKU when dialog opens
  useEffect(() => {
    if (isOpen) {
      const generatedSku = `SKU-${Date.now()}`;
      setFormData(prev => ({ ...prev, sku: generatedSku, minQuantity: defaultMinQuantity }));
      setImagePreviews([]);
    }
  }, [isOpen, defaultMinQuantity]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

    // Create previews
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

      setImagePreviews(prev => {
      const updated = [...prev, ...previews];
          return updated;
    });
    setFormData(prev => {
      const updated = { ...prev, images: [...prev.images, ...files] };
          return updated;
    });
  };

  const handleRemoveImage = (index) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.name || !formData.category || !formData.supplier || !formData.brand || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate at least one image
    if (!formData.images || formData.images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }
    
          console.log('Is array?', Array.isArray(formData.images));
      
    // Determine status based on quantity and minQuantity
    let status = "in-stock";
    if (formData.quantity === 0) {
      status = "out-of-stock";
    } else if (formData.quantity <= formData.minQuantity) {
      status = "low-stock";
    }

    const dataToSend = { ...formData, status };
      onAdd(dataToSend);
    
    // Clean up preview URLs
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    
    // Reset form
    setFormData({
      name: "",
      sku: "",
      category: "",
      quantity: "",
      minQuantity: "",
      price: "",
      supplier: "",
      brand: "",
      description: "",
      status: "in-stock",
      images: []
    });
    setImagePreviews([]);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
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
                  SKU (Auto-generated)
                </label>
                <Input
                  value={formData.sku}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-900 dark:text-gray-100"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category *
                </label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectProduct key={category.id} value={category.name}>
                        {category.name}
                      </SelectProduct>
                    ))}
                    <SelectProduct value="Other">Other</SelectProduct>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supplier *
                </label>
                <Select value={formData.supplier} onValueChange={(value) => handleChange("supplier", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.status === 'active').map((s) => (
                      <SelectProduct key={s.id} value={s.name}>
                        {s.name}
                      </SelectProduct>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand *
              </label>
              <Input
                required
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Enter product brand"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <Textarea
                required
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
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
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
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
                  onChange={(e) => handleChange("minQuantity", e.target.value === "" ? "" : parseInt(e.target.value) || "")}
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                  placeholder={defaultMinQuantity.toString()}
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
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Images *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="product-images"
                />
                <label
                  htmlFor="product-images"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload images (multiple allowed)
                  </span>
                </label>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
