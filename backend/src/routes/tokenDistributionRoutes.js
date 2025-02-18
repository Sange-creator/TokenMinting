import express from 'express';
import { distributeTokens } from '../controllers/tokenDistributionController.js';

const router = express.Router();

// POST /api/tokens/distribute - Distribute tokens to all voters
router.post('/distribute', distributeTokens);

export default router; 