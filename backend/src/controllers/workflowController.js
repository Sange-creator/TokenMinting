import { createTokenMint } from '../services/createMint.js';
import { createTokenMetadata } from '../services/createMetadata.js';
import { transferTokensToVoters } from '../services/transferTokens.js';
import Token from '../models/Token.js';
import Voter from '../models/Voter.js';

export const createMint = async (req, res) => {
  try {
    const { mintAddress, explorerLink } = await createTokenMint();
    
    if (!mintAddress) {
      throw new Error('Failed to create mint address');
    }
    
    res.json({ 
      success: true, 
      mintAddress,
      explorerLink 
    });
  } catch (error) {
    console.error('Mint creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create mint'
    });
  }
};

export const createMetadata = async (req, res) => {
  try {
    const { name, symbol, description, mintAddress, creatorName } = req.body;
    
    if (!mintAddress) {
      throw new Error('Mint address is required');
    }
    
    const tokenMetadata = await createTokenMetadata({
      name,
      symbol,
      uri: `${process.env.API_URL}/metadata/${mintAddress}`,
      mintAddress
    });

    const newToken = new Token({
      name,
      symbol,
      description,
      mintAddress,
      creatorName,
      metadataURI: `${process.env.API_URL}/metadata/${mintAddress}`,
      txSignature: tokenMetadata.txSignature
    });

    await newToken.save();

    res.json({
      success: true,
      message: 'Metadata added successfully',
      mintAddress,
      txSignature: tokenMetadata.txSignature
    });
  } catch (error) {
    console.error('Metadata creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create metadata'
    });
  }
};

export const mintSupply = async (req, res) => {
  try {
    const voterCount = await Voter.countDocuments();
    const { mintTokens } = await import('../services/mintTokens.js');
    const txSignature = await mintTokens(voterCount);
    res.json({ success: true, txSignature, tokensMinted: voterCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const transferTokens = async (req, res) => {
  try {
    const voters = await Voter.find();
    const result = await transferTokensToVoters(voters);
    res.json({
      success: true,
      message: `Transferred tokens to ${result.successCount} voters`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 