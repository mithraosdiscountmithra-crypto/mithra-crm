import { Router } from 'express';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAttendance,
  markAttendance
} from '../controllers/staffController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

// Attendance routes must come before :id
router.get('/attendance', getAttendance);
router.post('/attendance', markAttendance);

router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;
