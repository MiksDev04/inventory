import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/profile.js';

const router = express.Router();

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);

export default router;
