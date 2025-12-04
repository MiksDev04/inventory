import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Plus, Minus } from "lucide-react";
import { getImageUrl } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
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
    brand: "",
    description: "",
    status: "in-stock",
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [existingImagePaths, setExistingImagePaths] = useState([]);
  const [quantityAdjustment, setQuantityAdjustment] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("add"); // "add" or "subtract"
  const [originalQuantity, setOriginalQuantity] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      if (product) {
        console.log('[EditProductDialog] Product loaded:', product);
        console.log('[EditProductDialog] Product images:', product.images);
        
        setFormData({
          name: product.name || "",
          sku: product.sku || "",
          category: product.category || "",
          quantity: product.quantity || 0,
          minQuantity: product.minQuantity || "",
          price: product.price || "",
          supplier: product.supplier || "",
          brand: product.brand || "",
          description: product.description || "",
          status: product.status || "in-stock",
          images: product.images || []
        });
        setOriginalQuantity(product.quantity || 0);
        setQuantityAdjustment("");
        setAdjustmentType("add");
        // Set existing image previews (from stored paths)
        if (product.images && Array.isArray(product.images)) {
          console.log('[EditProductDialog] Loading existing images:', product.images.length);
          setExistingImagePaths(product.images);
          
          const previews = [];
          for (let idx = 0; idx < product.images.length; idx++) {
            const path = product.images[idx];
            // Get image URL using helper (async)
            const imageUrl = await getImageUrl(path);
            console.log(`[EditProductDialog] Image ${idx}: path="${path}", url="${imageUrl}"`);
            
            previews.push({ 
              url: imageUrl || path, 
              originalPath: path,
              isExisting: true,
              index: idx
            });
          }
          
          console.log('[EditProductDialog] Previews created:', previews.length);
          setImagePreviews(previews);
        } else {
          console.log('[EditProductDialog] No existing images');
          setExistingImagePaths([]);
          setImagePreviews([]);
        }
        setNewImages([]);
      }
    };
    
    loadProduct();
  }, [product]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    console.log('[EditProductDialog] Files selected:', files.length, files);
    if (files.length === 0) return;

    // Create previews for new images
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      isExisting: false
    }));

    console.log('[EditProductDialog] Previews created:', previews.length);
    setImagePreviews(prev => {
      const updated = [...prev, ...previews];
      console.log('[EditProductDialog] Image previews updated to:', updated.length);
      return updated;
    });
    setNewImages(prev => {
      const updated = [...prev, ...files];
      console.log('[EditProductDialog] New images updated to:', updated.length);
      return updated;
    });
  };

  const handleRemoveImage = (index) => {
    const preview = imagePreviews[index];
    
    if (preview.isExisting) {
      // Remove from existing paths
      setExistingImagePaths(prev => prev.filter(path => path !== preview.originalPath));
    } else {
      // Revoke blob URL and remove from new images
      URL.revokeObjectURL(preview.url);
      const newImageIndex = imagePreviews.slice(0, index).filter(p => !p.isExisting).length;
      setNewImages(prev => {
        const newArr = [...prev];
        newArr.splice(newImageIndex, 1);
        return newArr;
      });
    }
    
    // Remove from previews
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.name || !formData.category || !formData.supplier || !formData.brand || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate at least one image (existing or new)
    if ((!existingImagePaths || existingImagePaths.length === 0) && (!newImages || newImages.length === 0)) {
      alert('Please upload at least one product image');
      return;
    }
    
    // Calculate final quantity based on adjustment
    const finalQuantity = adjustmentType === "add" 
      ? originalQuantity + (parseInt(quantityAdjustment) || 0)
      : Math.max(0, originalQuantity - (parseInt(quantityAdjustment) || 0));
    
    console.log('[EditProductDialog] Form submitted!');
    console.log('[EditProductDialog] Original quantity:', originalQuantity);
    console.log('[EditProductDialog] Adjustment type:', adjustmentType);
    console.log('[EditProductDialog] Adjustment amount:', quantityAdjustment);
    console.log('[EditProductDialog] Final quantity:', finalQuantity);
    console.log('[EditProductDialog] formData:', formData);
    console.log('[EditProductDialog] existingImagePaths:', existingImagePaths);
    console.log('[EditProductDialog] newImages:', newImages);
    console.log('[EditProductDialog] Product ID:', product.id, 'Type:', typeof product.id);
    
    // Determine status based on quantity and minQuantity
    let status = "in-stock";
    if (finalQuantity === 0) {
      status = "out-of-stock";
    } else if (finalQuantity <= formData.minQuantity) {
      status = "low-stock";
    }

    // Only send the fields we want to update
    const updateData = {
      id: String(product.id), // Ensure ID is a string
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      supplier: formData.supplier,
      brand: formData.brand,
      description: formData.description,
      quantity: finalQuantity,
      minQuantity: Number(formData.minQuantity),
      price: Number(formData.price),
      status,
      // Keep existing images (original paths) + add new ones
      existingImages: existingImagePaths,
      newImages: newImages
    };
    
    console.log('[EditProductDialog] Calling onUpdate with:', updateData);
    console.log('[EditProductDialog] existingImages count:', updateData.existingImages?.length);
    console.log('[EditProductDialog] newImages count:', updateData.newImages?.length);
    onUpdate(updateData);
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Product</h2>
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
                  placeholder={product?.name || "Enter product name"}
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
                  placeholder={product?.sku || "Enter SKU"}
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand *
              </label>
              <Input
                required
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder={product?.brand || "Enter product brand"}
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
                placeholder={product?.description || "Enter product description"}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Quantity
                </label>
                <Input
                  type="number"
                  value={originalQuantity}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adjust Quantity
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("add")}
                    className={`flex-1 px-3 py-2 rounded border transition-colors ${
                      adjustmentType === "add"
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900"
                    }`}
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("subtract")}
                    className={`flex-1 px-3 py-2 rounded border transition-colors ${
                      adjustmentType === "subtract"
                        ? "bg-red-500 text-white border-red-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900"
                    }`}
                  >
                    <Minus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={quantityAdjustment}
                  onChange={(e) => setQuantityAdjustment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                  className="mt-2"
                />
                <div className={`text-sm font-medium ${
                  adjustmentType === "add" ? "text-green-600" : "text-red-600"
                }`}>
                  {adjustmentType === "add" ? "+" : "-"}{quantityAdjustment || 0} units
                  {" → New: "}
                  {adjustmentType === "add" 
                    ? originalQuantity + (parseInt(quantityAdjustment) || 0)
                    : Math.max(0, originalQuantity - (parseInt(quantityAdjustment) || 0))
                  }
                </div>
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
                  onChange={(e) => handleChange("price", parseFloat(e.target.value) || "")}
                  placeholder={product?.price ? product.price.toString() : "0.00"}
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Min Quantity *
                </label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => handleChange("minQuantity", parseInt(e.target.value) || "")}
                  placeholder={product?.minQuantity ? product.minQuantity.toString() : "0"}
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Images
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="edit-product-images"
                />
                <label
                  htmlFor="edit-product-images"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload more images
                  </span>
                </label>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview.url}
                          alt={preview.name || `Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {preview.isExisting && (
                          <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Saved
                          </span>
                        )}
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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
