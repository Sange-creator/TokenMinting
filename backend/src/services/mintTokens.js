import { mintTo, createAssociatedTokenAccount, getMint, getAssociatedTokenAddress } from "@solana/spl-token";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "../utils/solanaConnection.js";
import Voter from '../models/Voter.js';

const DECIMALS = 2;
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, DECIMALS);

async function mintTotalSupply() {
  try {
    const connection = getSolanaConnection();
    const user = getKeypairFromEnvironment("SECRET_KEY");
    
    // Use token mint from environment variable
    if (!process.env.TOKEN_MINT_ADDRESS) {
      throw new Error("TOKEN_MINT_ADDRESS not set in environment variables");
    }
    const tokenMint = new PublicKey(process.env.TOKEN_MINT_ADDRESS);

    // 1. Get total number of voters (including those without ATA)
    const totalVoters = await Voter.countDocuments({}, { allowDiskUse: true });
    console.log(`Total voters found in database: ${totalVoters}`);
    
    if (totalVoters === 0) {
      throw new Error("No voters found in the database. Please add voters first.");
    }

    // 2. Check current supply
    const mintInfo = await getMint(connection, tokenMint);
    const currentSupply = Number(mintInfo.supply);
    const desiredSupply = totalVoters * MINOR_UNITS_PER_MAJOR_UNITS;

    if (currentSupply >= desiredSupply) {
      console.log(`Sufficient supply exists - Current: ${currentSupply/MINOR_UNITS_PER_MAJOR_UNITS}, Needed: ${totalVoters}`);
      return {
        success: true,
        message: "Sufficient supply already exists",
        currentSupply: currentSupply/MINOR_UNITS_PER_MAJOR_UNITS,
        totalVoters
      };
    }

    // 3. Calculate amount to mint
    const mintAmount = desiredSupply - currentSupply;

    // 4. Get or create admin's ATA
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

    // 5. Mint tokens to admin's ATA
    console.log(`Minting ${mintAmount/MINOR_UNITS_PER_MAJOR_UNITS} tokens to match ${totalVoters} voters`);
    const txSignature = await mintTo(
      connection,
      user,
      tokenMint,
      adminATA,
      user,
      mintAmount
    );

    // 6. Verify final supply
    const updatedMintInfo = await getMint(connection, tokenMint);
    console.log(`New total supply: ${Number(updatedMintInfo.supply)/MINOR_UNITS_PER_MAJOR_UNITS}`);

    return {
      success: true,
      signature: txSignature,
      totalSupply: Number(updatedMintInfo.supply)/MINOR_UNITS_PER_MAJOR_UNITS,
      totalVoters
    };

  } catch (error) {
    console.error("Error in mintTotalSupply:", error);
    throw error;
  }
}

export const mintTokens = mintTotalSupply;