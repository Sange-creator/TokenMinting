import { transferTokensToVoters } from '../services/transferTokens.js';
import mongoose from 'mongoose';

export const transferTokens = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const votersCollection = db.collection('voter-wallls');
    
    // Get all voters
    const voters = await votersCollection.find().toArray();
    if (voters.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No voters found in database'
      });
    }

    // Execute transfer
    const result = await transferTokensToVoters(voters);

    res.json({
      success: true,
      message: `Transferred tokens to ${result.successCount} voters`,
      details: result
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};