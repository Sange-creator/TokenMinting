import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';

const app = express();

// Verify required environment variables
if (!process.env.TOKEN_METADATA_PROGRAM_ID) {
  console.error('TOKEN_METADATA_PROGRAM_ID not found in environment');
  console.log('Please run: npm run deploy:programs');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3001', // React app's default port
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import { router as workflowRoutes } from './routes/workflowRoutes.js';
import { router as mintRoutes } from './routes/mintRoutes.js';
import { router as metadataRoutes } from './routes/metadataRoutes.js';
import { router as transferRoutes } from './routes/transferRoutes.js';
import tokenDistributionRoutes from './routes/tokenDistributionRoutes.js';

// Mount routes
app.use('/api/workflow', workflowRoutes);
app.use('/api/mint', mintRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/tokens', tokenDistributionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));