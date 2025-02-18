import { createTokenMint } from '../services/createMint.js';
import { createTokenMetadata } from '../services/createMetadata.js';
import Token from '../models/Token.js';

let isLocalnetSetup = false;

export const createMint = async (req, res) => {
  try {
    const { mintAddress, explorerLink } = await createTokenMint();
    res.json({ success: true, mintAddress, explorerLink });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const mintSupply = async (req, res) => {
  try {
    const { mintTokens } = await import('../services/mintTokens.js');
    const txSignature = await mintTokens();
    res.json({ success: true, txSignature });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createMintWithMetadata = async (req, res) => {
  try {
    const { name, symbol, description, creatorName, uri } = req.body;

    // Enhanced validation
    if (!name || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Name and symbol are required'
      });
    }

    if (name.length > 32) {
      return res.status(400).json({
        success: false,
        error: 'Name must be 32 characters or less'
      });
    }

    if (symbol.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Symbol must be 10 characters or less'
      });
    }

    try {
      // First create the mint
      const { mintAddress, explorerLink } = await createTokenMint();
      console.log('Created mint:', mintAddress);

      // Create metadata URI if not provided
      const metadataURI = uri || `${process.env.API_URL}/metadata/${mintAddress}`;

      // Create metadata immediately after mint
      const metadataResult = await createTokenMetadata({
        name,
        symbol,
        uri: metadataURI,
        mintAddress,
        sellerFeeBasisPoints: 0,
        creators: null, // Will use default creator (token owner)
        isMutable: true
      });

      console.log('Created metadata:', metadataResult);

      // Save token information to database
      const newToken = new Token({
        name,
        symbol,
        description: description || `${name} token for voting system`,
        creatorName,
        mintAddress,
        metadataURI,
        txSignature: metadataResult.txSignature || metadataResult
      });

      await newToken.save();

      res.json({
        success: true,
        message: 'Token created with metadata successfully',
        data: {
          mintAddress,
          explorerLink,
          metadataURI,
          metadataTxSignature: metadataResult.txSignature || metadataResult,
          token: newToken
        }
      });

    } catch (error) {
      // Handle specific errors
      if (error.message.includes('Blockhash not found')) {
        return res.status(500).json({
          success: false,
          error: 'Transaction timed out, please try again'
        });
      }

      if (error.message.includes('insufficient funds')) {
        return res.status(500).json({
          success: false,
          error: 'Insufficient funds for transaction'
        });
      }

      throw error; // Re-throw other errors to be caught by outer catch
    }

  } catch (error) {
    console.error('Token creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create token with metadata'
    });
  }
};