import Voter from '../models/Voter.js';

// Get total count of eligible voters
export async function getTotalEligibleVoters() {
  try {
    // Get exact count of voters with wallet details
    const voters = await Voter.find({
      registrationStatus: { $in: ['wallet', 'completed'] },
      'walletDetails.publicKey': { $exists: true, $ne: null }
    });
    
    // Filter out any invalid public keys
    const validVoters = voters.filter(voter => {
      try {
        return voter.walletDetails && 
               voter.walletDetails.publicKey && 
               voter.walletDetails.publicKey.length > 0;
      } catch (e) {
        console.log(`Invalid wallet details for voter ${voter._id}`);
        return false;
      }
    });

    const count = validVoters.length;
    
    console.log(`Found exactly ${count} eligible voters with valid wallet details`);
    console.log('Voter public keys:', validVoters.map(v => v.walletDetails.publicKey));
    
    if (count === 0) {
      console.log('Warning: No eligible voters found. Please ensure voters have:');
      console.log('1. Registration status of "wallet" or "completed"');
      console.log('2. Valid wallet details with public key');
    }

    return count;
  } catch (error) {
    console.error('Error getting total eligible voters:', error);
    throw new Error('Failed to get total eligible voters count: ' + error.message);
  }
}

// Get all voter public keys from the database
export async function getVoterPublicKeys() {
  try {
    // Get voters with wallet registration and wallet details
    const voters = await Voter.find(
      { 
        registrationStatus: { $in: ['wallet', 'completed'] },
        'walletDetails.publicKey': { $exists: true, $ne: null }
      }, 
      'walletDetails.publicKey'
    );
    
    console.log(`Found ${voters.length} voters with valid public keys`);
    return voters.map(voter => voter.walletDetails.publicKey);
  } catch (error) {
    console.error('Error fetching voter public keys:', error);
    throw new Error('Failed to fetch voter public keys');
  }
}

// Add a new voter to the database with all required fields
export async function addVoter({
  name,
  dateOfBirth,
  nationalId,
  email,
  address,
  phoneNumber,
  publicKey,
  ATA
}) {
  try {
    const voter = new Voter({
      name,
      dateOfBirth,
      nationalId,
      email,
      address,
      phoneNumber,
      ATA,
      registrationStatus: 'basic-details',
      walletDetails: publicKey ? {
        publicKey,
        // Note: encrypted private key, iv, and encryption key should be handled securely
        // and passed separately through a secure channel
      } : undefined,
      hasReceivedToken: false,
      tokensReceived: 0
    });
    await voter.save();
    return voter;
  } catch (error) {
    console.error('Error adding voter:', error);
    throw new Error('Failed to add voter');
  }
}

// Update voter token status and ATA
export async function updateVoterTokenStatus(publicKey, ATA) {
  try {
    await Voter.findOneAndUpdate(
      { 'walletDetails.publicKey': publicKey },
      { 
        $inc: { tokensReceived: 1 },
        hasReceivedToken: true,
        ATA,
        $set: { 'walletDetails.publicKey': publicKey }
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating voter token status:', error);
    throw new Error('Failed to update voter token status');
  }
}

// Update voter's wallet details
export async function updateVoterWallet(
  nationalId, 
  { publicKey, encryptedPrivateKey, iv, encryptionKey, encryptionMethod = 'NACL_SECRETBOX' }
) {
  try {
    const voter = await Voter.findOneAndUpdate(
      { nationalId },
      {
        walletDetails: {
          publicKey,
          encryptedPrivateKey,
          iv,
          encryptionKey,
          encryptionMethod
        },
        registrationStatus: 'wallet'
      },
      { new: true }
    );
    return voter;
  } catch (error) {
    console.error('Error updating voter wallet:', error);
    throw new Error('Failed to update voter wallet');
  }
}

// Update voter's biometric data
export async function updateVoterBiometric(nationalId, { fingerprintHash, fingerprintTemplate }) {
  try {
    const voter = await Voter.findOneAndUpdate(
      { nationalId },
      {
        fingerprintData: {
          hash: fingerprintHash,
          template: fingerprintTemplate
        },
        registrationStatus: 'biometric'
      },
      { new: true }
    );
    return voter;
  } catch (error) {
    console.error('Error updating voter biometric:', error);
    throw new Error('Failed to update voter biometric');
  }
}

// Complete voter registration
export async function completeVoterRegistration(nationalId) {
  try {
    const voter = await Voter.findOne({ nationalId });
    
    // Check if all required data is present
    if (!voter.fingerprintData || !voter.walletDetails.publicKey) {
      throw new Error('Biometric data and wallet details are required to complete registration');
    }
    
    voter.registrationStatus = 'completed';
    await voter.save();
    return voter;
  } catch (error) {
    console.error('Error completing voter registration:', error);
    throw new Error('Failed to complete voter registration');
  }
} 