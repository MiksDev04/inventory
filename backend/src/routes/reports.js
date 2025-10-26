import { Router } from 'express';
import { listReports, getReport, createReport, deleteReport } from '../controllers/reports.js';


const router = Router();

router.get('/', listReports);
router.get('/:id', getReport);
router.post('/', createReport);
router.delete('/:id', deleteReport);

export default router;
