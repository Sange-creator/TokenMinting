import express from 'express';
import { createMint, mintSupply } from '../controllers/mintController.js';

const router = express.Router();

router.post('/create', createMint);
router.post('/mint-supply', mintSupply);

export { router };