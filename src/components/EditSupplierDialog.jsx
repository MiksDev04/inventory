import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from './ui/select';

export function EditSupplierDialog({ isOpen, onClose, onUpdate, supplier }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        location: supplier.location,
        description: supplier.description,
        status: supplier.status,
      });
    }
  }, [supplier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (supplier) {
      onUpdate({
        ...supplier,
        ...formData,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='text-gray-900 dark:text-white'>Edit Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-name' className='text-gray-700 dark:text-gray-300'>Supplier Name</Label>
              <Input
                id='edit-name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g., TechSupply Co.'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-email' className='text-gray-700 dark:text-gray-300'>Email</Label>
              <Input
                id='edit-email'
                type='email'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder='contact@supplier.com'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-phone' className='text-gray-700 dark:text-gray-300'>Phone Number</Label>
              <Input
                id='edit-phone'
                type='tel'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder='+1 (555) 123-4567'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-location' className='text-gray-700 dark:text-gray-300'>Location</Label>
              <Input
                id='edit-location'
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder='City, State/Country'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-description' className='text-gray-700 dark:text-gray-300'>Description</Label>
              <Textarea
                id='edit-description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Brief description of the supplier...'
                rows={3}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-status' className='text-gray-700 dark:text-gray-300'>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id='edit-status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectProduct value='active'>Active</SelectProduct>
                  <SelectProduct value='inactive'>Inactive</SelectProduct>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Update Supplier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
