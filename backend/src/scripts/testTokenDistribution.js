import 'dotenv/config';
import { mintTokens } from '../services/mintTokens.js';
import { distributeTokensToAllVoters } from '../services/distributeTokens.js';
import mongoose from 'mongoose';
import { getMint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "../utils/solanaConnection.js";

async function testTokenDistribution() {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 2. Get initial token supply
        const connection = getSolanaConnection();
        const tokenMint = new PublicKey(process.env.TOKEN_MINT_ADDRESS);
        const initialMintInfo = await getMint(connection, tokenMint);
        console.log(`Initial token supply: ${Number(initialMintInfo.supply) / Math.pow(10, initialMintInfo.decimals)}`);

        // 3. Mint tokens
        console.log('\nMinting tokens...');
        const mintResult = await mintTokens();
        console.log('Mint result:', mintResult);

        // 4. Get updated token supply
        const updatedMintInfo = await getMint(connection, tokenMint);
        console.log(`Updated token supply: ${Number(updatedMintInfo.supply) / Math.pow(10, updatedMintInfo.decimals)}`);

        // 5. Distribute tokens
        console.log('\nDistributing tokens...');
        const distributionResult = await distributeTokensToAllVoters();
        console.log('Distribution result:', distributionResult);

    } catch (error) {
        console.error('Error in test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the test
testTokenDistribution(); 