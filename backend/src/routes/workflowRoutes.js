import { Router } from 'express';
import { 
  createMintAccount,
  createMetadataAccount,
  mintTokenSupply,
  distributeTokens,
  requestAirdrop
} from '../controllers/tokenController.js';
import { 
  getVoterPublicKeys,
  getTotalEligibleVoters 
} from '../controllers/voterController.js';

const router = Router();

// Request Airdrop
router.post('/request-airdrop', async (req, res) => {
  try {
    const result = await requestAirdrop();
    res.json(result);
  } catch (error) {
    console.error('Error in airdrop route:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 1. Create Mint Account
router.post('/mint-token', async (req, res) => {
  try {
    const result = await createMintAccount();
    
    // Extract just the mint address string
    const { mintAddress } = result;
    
    res.json({ 
      success: true, 
      mintAddress: mintAddress,  // Ensure we're sending just the string
      message: 'Mint account created successfully',
      explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`
    });
  } catch (error) {
    console.error('Error creating mint token:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 2. Add Metadata
router.post('/add-metadata', async (req, res) => {
  try {
    const { mintAddress, name, symbol, description, creatorName } = req.body;

    // Validate required fields
    if (!mintAddress || typeof mintAddress !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid mint address. Must be a string.' 
      });
    }

    if (!name || !symbol) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name and symbol are required' 
      });
    }

    // Validate field lengths
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

    console.log('Creating metadata with params:', {
      mintAddress,
      name,
      symbol,
      description,
      creatorName
    });

    const result = await createMetadataAccount(mintAddress, { 
      name, 
      symbol, 
      description, 
      creatorName,
      uri: `${process.env.API_URL}/metadata/${mintAddress}`
    });

    res.json({ 
      success: true, 
      message: 'Metadata added successfully',
      ...result
    });
  } catch (error) {
    console.error('Metadata creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create metadata',
      details: error.logs || null
    });
  }
});

// 3. Mint Supply
router.post('/mint-supply', async (req, res) => {
  try {
    // Get total number of eligible voters
    const totalVoters = await getTotalEligibleVoters();
    
    if (totalVoters === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No eligible voters found in the database. Voters must have completed registration and have a wallet.' 
      });
    }

    console.log(`Found ${totalVoters} eligible voters, proceeding to mint supply...`);

    // Mint exactly one token per voter
    const totalSupply = totalVoters;  // Remove buffer, mint exactly one per voter

    console.log(`Minting exactly ${totalSupply} tokens for ${totalVoters} voters`);

    // Mint tokens
    const result = await mintTokenSupply(totalSupply);

    res.json({ 
      success: true, 
      message: `Successfully minted ${totalSupply} tokens for ${totalVoters} voters`,
      eligibleVoters: totalVoters,
      totalSupply,
      ...result
    });
  } catch (error) {
    console.error('Supply minting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to mint token supply',
      details: error.logs || null
    });
  }
});

// 4. Distribute Tokens
router.post('/transfer-tokens', async (req, res) => {
  try {
    const voters = await getVoterPublicKeys();
    await distributeTokens(voters);
    res.json({ 
      success: true, 
      message: `Tokens distributed to ${voters.length} voters successfully` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update voter registration status (for testing)
router.post('/update-voter-status/:nationalId', async (req, res) => {
  try {
    const { nationalId } = req.params;
    const updatedVoter = await updateVoterRegistrationStatus(nationalId);
    
    res.json({ 
      success: true, 
      message: 'Voter registration status updated successfully',
      voter: updatedVoter
    });
  } catch (error) {
    console.error('Error updating voter status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export { router }; 