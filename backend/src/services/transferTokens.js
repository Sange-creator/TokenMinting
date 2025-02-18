import { MongoClient } from 'mongodb';
import { PublicKey, Keypair } from '@solana/web3.js';
import { transfer, getAssociatedTokenAddress, createAssociatedTokenAccount } from '@solana/spl-token';
import express from 'express';
import { getSolanaConnection } from '../utils/solanaConnection.js';
import bs58 from 'bs58';

const router = express.Router();

// Database connection
const client = new MongoClient(process.env.MONGODB_URI);
let db;

// Solana config
const DECIMALS = 2;
const TOKEN_MINT = new PublicKey("8PYDnSmKKdPgADR2NmV1TPmAHy4UQZ53b41JAvEfCz9C");
const connection = getSolanaConnection();

// Connect to MongoDB
async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db('test');
        console.log('Connected to MongoDB from transfer service');
    }
    return db;
}
async function transferTokensToVoters(voters) {
    try {
        // Create keypair from secret key
        let keypair;
        try {
            const secretKey = bs58.decode(process.env.SECRET_KEY);
            keypair = Keypair.fromSecretKey(secretKey);
        } catch (error) {
            console.error('Error creating keypair:', error);
            throw new Error('Invalid secret key format. Please ensure your SECRET_KEY is in the correct format.');
        }

        const amountPerVoter = 1 * Math.pow(10, DECIMALS);
        const authorityATA = await getAssociatedTokenAddress(TOKEN_MINT, keypair.publicKey);
        
        let transferredCount = 0;
        const errors = [];

        for (const voter of voters) {
            try {
                const voterAddress = new PublicKey(voter.mintAddress);
                const voterATA = await getAssociatedTokenAddress(TOKEN_MINT, voterAddress);
                
                // Create ATA if needed
                const ataInfo = await connection.getAccountInfo(voterATA);
                if (!ataInfo) {
                    await createAssociatedTokenAccount(
                        connection,
                        keypair,
                        TOKEN_MINT,
                        voterAddress
                    );
                }

                // Transfer tokens
                await transfer(
                    connection,
                    keypair,
                    authorityATA,
                    voterATA,
                    keypair.publicKey,
                    amountPerVoter
                );

                transferredCount++;
            } catch (error) {
                errors.push({
                    voter: voter.name,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            transferredCount,
            errors
        };
    } catch (error) {
        console.error('Transfer error:', error);
        throw error;
    }
}

// Export the router and functions using ES module syntax
export { router, connectDB, transferTokensToVoters };