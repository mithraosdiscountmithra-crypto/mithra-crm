import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPayrollCalculation,
  getRBACMatrix,
  updateRBACRole
} from '../controllers/hrPillarController.js';

const router = Router();
router.use(requireAuth);

router.get('/payroll-calculation', getPayrollCalculation);
router.get('/rbac', getRBACMatrix);
router.put('/rbac/:id', updateRBACRole);

export default router;
