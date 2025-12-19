import express from 'express';
import { generateInsights, chatWithAI } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/insights/:patientId', protect, generateInsights);
router.post('/chat/:patientId', protect, chatWithAI);

export default router;
