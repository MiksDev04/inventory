import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export function AddSupplierDialog({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    description: '',
    status: 'active',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      description: '',
      status: 'active',
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      description: '',
      status: 'active',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='text-gray-900 dark:text-white'>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name' className='text-gray-700 dark:text-gray-300'>Supplier Name</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g., TechSupply Co.'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='email' className='text-gray-700 dark:text-gray-300'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder='contact@supplier.com'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='phone' className='text-gray-700 dark:text-gray-300'>Phone Number</Label>
              <Input
                id='phone'
                type='tel'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder='+1 (555) 123-4567'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='location' className='text-gray-700 dark:text-gray-300'>Location</Label>
              <Input
                id='location'
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder='City, State/Country'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='description' className='text-gray-700 dark:text-gray-300'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Brief description of the supplier...'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose}>
              Cancel
            </Button>
            <Button type='submit'>Add Supplier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
