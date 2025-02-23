import mongoose from 'mongoose';
import { Keypair } from '@solana/web3.js';
import 'dotenv/config';
import Voter from '../models/Voter.js';
import crypto from 'crypto';

async function addTestVoters() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create test voters
        const testVoters = [];
        for (let i = 1; i <= 5; i++) {
            // Generate a Solana keypair for each voter
            const keypair = Keypair.generate();
            
            // Generate mock fingerprint data
            const mockFingerprint = crypto.randomBytes(256);
            const mockHash = crypto.createHash('sha256').update(mockFingerprint).digest();

            const voter = {
                fullName: `Test Voter ${i}`,
                dateOfBirth: new Date(1990, 0, i), // Different dates for each voter
                nationalId: `ID${i}${Date.now()}`, // Unique IDs
                email: `voter${i}${Date.now()}@test.com`, // Unique emails
                address: `${i} Test Street, Test City`,
                phoneNumber: `+1234567890${i}`,
                ATA: keypair.publicKey.toBase58(), // Use the public key as ATA
                registrationStatus: 'completed',
                fingerprintData: {
                    template: mockFingerprint,
                    hash: mockHash
                },
                walletDetails: {
                    publicKey: keypair.publicKey.toBase58(),
                    encryptedPrivateKey: 'test_encrypted',
                    iv: 'test_iv',
                    encryptionKey: 'test_key',
                    encryptionMethod: 'NACL_SECRETBOX'
                }
            };
            testVoters.push(voter);
        }

        // Insert the test voters
        const result = await Voter.insertMany(testVoters);
        console.log(`Successfully added ${result.length} test voters`);
        console.log('Test voters:', result.map(v => ({ 
            name: v.fullName, 
            wallet: v.ATA 
        })));

    } catch (error) {
        console.error('Error adding test voters:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the function
addTestVoters(); 