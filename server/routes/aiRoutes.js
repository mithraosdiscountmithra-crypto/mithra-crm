import express from 'express';
import { chatWithAICopilot } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/chat - Ask AI Copilot
router.post('/chat', chatWithAICopilot);

export default router;
