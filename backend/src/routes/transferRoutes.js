import express from 'express';
import { router as transferTokens } from '../services/transferTokens.js';

const router = express.Router();

router.use('/', transferTokens);

export { router };