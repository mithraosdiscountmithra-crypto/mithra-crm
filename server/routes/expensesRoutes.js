import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getProfitLossSummary
} from '../controllers/expensesController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

// P&L summary must come before :id
router.get('/pnl', getProfitLossSummary);

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
