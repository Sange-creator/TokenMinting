import express from 'express';
import { createMetadata } from '../controllers/metadataController.js';
import { createMintWithMetadata } from '../controllers/mintController.js';

const router = express.Router();

// Create metadata for an existing token
router.post('/metadata', createMetadata);

// Create new token with metadata
router.post('/mint-with-metadata', createMintWithMetadata);

export { router };