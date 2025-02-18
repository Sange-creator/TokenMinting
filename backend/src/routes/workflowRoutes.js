import express from 'express';
import {
  createMint,
  mintSupply,
  createMetadata,
  transferTokens
} from '../controllers/workflowController.js';

const router = express.Router();

// Add explicit route for mint-token
router.post('/mint-token', createMint);
router.post('/add-metadata', createMetadata);
router.post('/mint-supply', mintSupply);
router.post('/transfer-tokens', transferTokens);

export { router }; 