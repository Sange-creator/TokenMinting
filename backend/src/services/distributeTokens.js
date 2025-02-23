import { transfer, getAssociatedTokenAddress, createAssociatedTokenAccount, getMint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { getSolanaConnection } from "../utils/solanaConnection.js";
import Voter from '../models/Voter.js';
import mongoose from 'mongoose';
import { getActiveMintAddress } from './mintAddressManager.js';

const TOKENS_PER_VOTER = 1;
const DECIMALS = 2;

export async function distributeTokensToAllVoters() {
    try {
        // Get the current active mint address
        const mintAddressStr = await getActiveMintAddress();
        if (!mintAddressStr) {
            throw new Error('No active mint address found');
        }

        // Create PublicKey from the mint address string
        const tokenMint = new PublicKey(mintAddressStr);

        // Ensure MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // Get eligible voters
        const eligibleVoters = await Voter.find({
            registrationStatus: 'completed',
            'walletDetails.publicKey': { $exists: true },
            tokensReceived: { $lt: 1 } // Only get voters who haven't received tokens
        });

        console.log(`Found ${eligibleVoters.length} eligible voters without tokens`);

        if (eligibleVoters.length === 0) {
            return { success: true, message: 'No new voters to process' };
        }

        const connection = getSolanaConnection();
        const admin = getKeypairFromEnvironment("SECRET_KEY");
        const adminATA = await getAssociatedTokenAddress(tokenMint, admin.publicKey);

        // Verify admin has enough tokens
        const adminBalance = (await connection.getTokenAccountBalance(adminATA)).value.amount;
        if (Number(adminBalance) < eligibleVoters.length) {
            throw new Error(`Insufficient tokens. Have: ${adminBalance}, Need: ${eligibleVoters.length}`);
        }

        const results = [];
        for (const voter of eligibleVoters) {
            try {
                const voterPublicKey = new PublicKey(voter.walletDetails.publicKey);
                const voterATA = await getAssociatedTokenAddress(tokenMint, voterPublicKey);

                // Create voter's ATA if it doesn't exist
                const ataInfo = await connection.getAccountInfo(voterATA);
                if (!ataInfo) {
                    await createAssociatedTokenAccount(
                        connection,
                        admin,
                        tokenMint,
                        voterPublicKey
                    );
                }

                // Transfer exactly 1 token
                const signature = await transfer(
                    connection,
                    admin,
                    adminATA,
                    voterATA,
                    admin,
                    TOKENS_PER_VOTER
                );

                // Update voter record
                await Voter.findByIdAndUpdate(voter._id, {
                    tokensReceived: 1,
                    hasReceivedToken: true,
                    ATA: voterATA.toString()
                });

                results.push({
                    voter: voter.walletDetails.publicKey,
                    success: true,
                    signature
                });

            } catch (error) {
                console.error(`Error distributing to voter ${voter.walletDetails.publicKey}:`, error);
                results.push({
                    voter: voter.walletDetails.publicKey,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            totalProcessed: eligibleVoters.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            details: results
        };

    } catch (error) {
        console.error('Distribution error:', error);
        throw error;
    }
} 