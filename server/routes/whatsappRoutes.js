import { Router } from 'express';
import {
  getCampaigns,
  createCampaign,
  getAudienceList
} from '../controllers/whatsappController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.get('/audience', getAudienceList);

export default router;
