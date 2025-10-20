import { useState } from "react";
import { MoreVertical, Pencil, Trash2, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { EditItemDialog } from "./EditItemDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

export function InventoryTable({ items, onUpdate, onDelete, categories = [], suppliers = [] }) {
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-gray-900 dark:text-gray-100">{item.sku}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{item.name}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{item.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-gray-100">{item.quantity}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Min: {item.minQuantity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">₱{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{item.supplier}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{item.lastUpdated}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingItem(item)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingId(item.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={(updatedItem) => {
            onUpdate(updatedItem);
            setEditingItem(null);
          }}
          categories={categories}
          suppliers={suppliers}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inventory item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
