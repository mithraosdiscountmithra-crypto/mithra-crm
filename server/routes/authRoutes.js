import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateMerchant, getProfile);
router.put('/profile', authenticateMerchant, updateProfile);

export default router;
