import { mintTo, createAssociatedTokenAccount, getMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "../utils/solanaConnection.js";
import Voter from '../models/Voter.js';
import { getActiveMintAddress } from './mintAddressManager.js';

const DECIMALS = 0;
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, DECIMALS);

async function mintTotalSupply() {
  try {
    // Get the current active mint address
    const mintAddressStr = await getActiveMintAddress();
    if (!mintAddressStr) {
      throw new Error('No active mint address found');
    }

    // Create PublicKey from the mint address string
    const tokenMint = new PublicKey(mintAddressStr);

    const connection = getSolanaConnection();
    const user = getKeypairFromEnvironment("SECRET_KEY");
    
    // Get total number of eligible voters
    const totalVoters = await Voter.countDocuments({
      registrationStatus: 'completed',
      'walletDetails.publicKey': { $exists: true }
    });
    
    console.log(`Total eligible voters found: ${totalVoters}`);
    
    if (totalVoters === 0) {
      throw new Error("No eligible voters found in the database");
    }

    // Check current supply
    const mintInfo = await getMint(connection, tokenMint);
    const currentSupply = Number(mintInfo.supply);
    const desiredSupply = totalVoters; // Exactly one token per voter

    if (currentSupply >= desiredSupply) {
      console.log(`Sufficient supply exists - Current: ${currentSupply}, Needed: ${totalVoters}`);
      return {
        success: true,
        message: "Sufficient supply already exists",
        currentSupply,
        totalVoters
      };
    }

    // Calculate amount to mint
    const mintAmount = desiredSupply - currentSupply;

    // Get or create admin's ATA
    const adminATA = await getAssociatedTokenAddress(tokenMint, user.publicKey);
    const ataInfo = await connection.getAccountInfo(adminATA);
    
    if (!ataInfo) {
      console.log("Creating admin's associated token account...");
      await createAssociatedTokenAccount(
        connection,
        user,
        tokenMint,
        user.publicKey
      );
    }

    // Mint exact number of tokens
    console.log(`Minting ${mintAmount} tokens to match ${totalVoters} voters`);
    const txSignature = await mintTo(
      connection,
      user,
      tokenMint,
      adminATA,
      user,
      mintAmount
    );

    // Verify final supply
    const updatedMintInfo = await getMint(connection, tokenMint);
    console.log(`New total supply: ${Number(updatedMintInfo.supply)}`);

    return {
      success: true,
      signature: txSignature,
      totalSupply: Number(updatedMintInfo.supply),
      totalVoters
    };

  } catch (error) {
    console.error("Error in mintTotalSupply:", error);
    throw error;
  }
}

export { mintTotalSupply };