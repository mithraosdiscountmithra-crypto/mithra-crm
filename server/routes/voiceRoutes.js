import express from 'express';
import { 
  handleVoiceWebhook, 
  triggerAICall, 
  getScheduledCallbacks, 
  getCallLogs 
} from '../controllers/voiceController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = express.Router();

// Webhook for incoming voice agent call results (no JWT required for telephony providers)
router.post('/webhook/call-response', handleVoiceWebhook);

// Authenticated voice endpoints
router.post('/trigger-call', authenticateMerchant, triggerAICall);
router.get('/scheduled-callbacks', authenticateMerchant, getScheduledCallbacks);
router.get('/call-logs', authenticateMerchant, getCallLogs);

export default router;
