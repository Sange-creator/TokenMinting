import mongoose from 'mongoose';
import 'dotenv/config';
import Voter from '../models/Voter.js';

async function checkVoters() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all voters
        const voters = await Voter.find({});
        console.log(`Total voters in database: ${voters.length}`);

        // Print details of each voter
        voters.forEach((voter, index) => {
            console.log(`\nVoter ${index + 1}:`);
            console.log('Full Name:', voter.fullName);
            console.log('Email:', voter.email);
            console.log('ATA:', voter.ATA);
            console.log('Wallet Public Key:', voter.walletDetails?.publicKey);
            console.log('Tokens Received:', voter.tokensReceived);
            console.log('Registration Status:', voter.registrationStatus);
        });

    } catch (error) {
        console.error('Error checking voters:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the check
checkVoters(); 