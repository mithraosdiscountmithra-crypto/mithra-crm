import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getFeedback,
  submitFeedback,
  getExperiments,
  createExperiment,
  updateExperimentStatus,
  getBetaLogs,
  submitBetaLog,
  updateBetaLogStatus
} from '../controllers/rdController.js';

const router = Router();
router.use(requireAuth);

router.get('/feedback', getFeedback);
router.post('/feedback', submitFeedback);
router.get('/experiments', getExperiments);
router.post('/experiments', createExperiment);
router.put('/experiments/:id/status', updateExperimentStatus);
router.get('/beta-logs', getBetaLogs);
router.post('/beta-logs', submitBetaLog);
router.put('/beta-logs/:id/status', updateBetaLogStatus);

export default router;
