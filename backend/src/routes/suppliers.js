import { Router } from 'express';
import { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/suppliers.js';

const router = Router();

router.get('/', listSuppliers);
router.get('/:id', getSupplier);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
