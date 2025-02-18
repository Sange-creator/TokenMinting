import { transfer, getAssociatedTokenAddress, createAssociatedTokenAccount, getMint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { getSolanaConnection } from "../utils/solanaConnection.js";
import Voter from '../models/Voter.js';
import mongoose from 'mongoose';

const TOKENS_PER_VOTER = 1;
const DECIMALS = 2;

export async function distributeTokensToAllVoters() {
    try {
        // Ensure MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // 1. Get total number of voters who haven't received tokens
        const unprocessedVoters = await Voter.find(
            { $or: [{ tokensReceived: 0 }, { tokensReceived: { $exists: false } }] }
        ).lean();

        console.log('First voter data:', JSON.stringify(unprocessedVoters[0], null, 2));
        
        const voterCount = unprocessedVoters.length;
        console.log(`Found ${voterCount} voters who haven't received tokens yet`);
        
        if (voterCount === 0) {
            console.log('No new voters to distribute tokens to');
            return { success: true, message: 'No new voters to process' };
        }

        // 2. Setup connection and accounts
        const connection = getSolanaConnection();
        const admin = getKeypairFromEnvironment("SECRET_KEY");
        const tokenMint = new PublicKey(process.env.TOKEN_MINT_ADDRESS);

        // 3. Verify admin has enough tokens
        const adminATA = await getAssociatedTokenAddress(tokenMint, admin.publicKey);
        const mintInfo = await getMint(connection, tokenMint);
        const adminTokenAccount = await connection.getTokenAccountBalance(adminATA);
        const requiredTokens = voterCount * TOKENS_PER_VOTER;

        if (Number(adminTokenAccount.value.amount) < requiredTokens * Math.pow(10, DECIMALS)) {
            throw new Error(`Admin doesn't have enough tokens. Has: ${adminTokenAccount.value.amount}, Needs: ${requiredTokens * Math.pow(10, DECIMALS)}`);
        }

        // 4. Transfer tokens to each voter
        const results = {
            successful: [],
            failed: []
        };

        for (const voter of unprocessedVoters) {
            try {
                // Use ATA field for voter's public key
                if (!voter.ATA) {
                    console.log(`Skipping voter ${voter.fullName} - No wallet address assigned`);
                    results.failed.push({
                        voter: voter.fullName,
                        error: 'No wallet address assigned'
                    });
                    continue;
                }

                const voterPublicKey = new PublicKey(voter.ATA);
                console.log(`Processing voter ${voter.fullName} with wallet ${voterPublicKey.toBase58()}`);
                
                // Get or create voter's Associated Token Account
                const voterATA = await getAssociatedTokenAddress(tokenMint, voterPublicKey);
                const ataInfo = await connection.getAccountInfo(voterATA);
                
                if (!ataInfo) {
                    console.log(`Creating ATA for voter ${voter.fullName}`);
                    await createAssociatedTokenAccount(
                        connection,
                        admin,
                        tokenMint,
                        voterPublicKey
                    );
                }

                // Transfer 1 token to voter
                const amount = TOKENS_PER_VOTER * Math.pow(10, DECIMALS);
                
                const signature = await transfer(
                    connection,
                    admin,
                    adminATA,
                    voterATA,
                    admin,
                    amount
                );

                // Update voter record
                await Voter.findByIdAndUpdate(voter._id, { 
                    tokensReceived: TOKENS_PER_VOTER
                });

                results.successful.push({
                    voter: voter.fullName,
                    signature,
                    address: voterPublicKey.toBase58()
                });

                console.log(`Successfully transferred token to ${voter.fullName} (${voterPublicKey.toBase58()})`);

            } catch (error) {
                console.error(`Failed to transfer tokens to voter ${voter.fullName}:`, error);
                results.failed.push({
                    voter: voter.fullName,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            totalVoters: voterCount,
            successfulTransfers: results.successful.length,
            failedTransfers: results.failed.length,
            details: results
        };

    } catch (error) {
        console.error('Error in distributeTokensToAllVoters:', error);
        throw error;
    }
} 