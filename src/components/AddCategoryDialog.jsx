import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from "./ui/select";


const colorOptions = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
];

const iconOptions = [
  { value: "📦", label: "📦 Box" },
  { value: "💻", label: "💻 Computer" },
  { value: "🔧", label: "🔧 Tools" },
  { value: "📱", label: "📱 Phone" },
  { value: "🪑", label: "🪑 Furniture" },
  { value: "📝", label: "📝 Stationery" },
  { value: "🎨", label: "🎨 Art" },
  { value: "⚡", label: "⚡ Electronics" },
  { value: "🏠", label: "🏠 Home" },
  { value: "🎮", label: "🎮 Gaming" },
  { value: "🍕", label: "🍕 Foods" },
  { value: "🧴", label: "🧴 Personal Care" },
];

export function AddCategoryDialog({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "blue",
    icon: "📦",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: "", description: "", color: "blue", icon: "📦" });
    onClose();
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", color: "blue", icon: "📦" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Electronics, Furniture"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectProduct key={option.value} value={option.value}>
                        {option.label}
                      </SelectProduct>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger id="color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectProduct key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${option.class}`} />
                          {option.label}
                        </div>
                      </SelectProduct>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl bg-${formData.color}-500`}>
                {formData.icon}
              </div>
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100">Preview</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">This is how your category will appear</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add Category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
