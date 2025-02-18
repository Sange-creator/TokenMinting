import { createTokenMetadata } from '../services/createMetadata.js';
import Token from '../models/Token.js';

export const createMetadata = async (req, res) => {
  try {
    const { name, symbol, purpose, creatorName, mintAddress } = req.body;
    
    // Validate mint address format
    if (!mintAddress || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mintAddress)) {
      throw new Error('Invalid mint address format');
    }

    // Create metadata URI before on-chain metadata
    const metadataURI = `${process.env.API_URL}/metadata/${mintAddress}`;
    
    // Save to database first
    const newToken = new Token({
      name,
      symbol,
      description: purpose,
      logo: req.file ? req.file.path : '',
      mintAddress,
      metadataURI,
      txSignature: 'pending'
    });

    await newToken.save();

    // Create on-chain metadata
    const txSignature = await createTokenMetadata({
      name,
      symbol,
      uri: metadataURI,
      mintAddress
    });

    // Update transaction signature
    newToken.txSignature = txSignature;
    await newToken.save();

    res.json({
      success: true,
      message: 'Metadata created successfully',
      txSignature,
      metadataURI
    });

  } catch (error) {
    console.error('Metadata creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create metadata'
    });
  }
};