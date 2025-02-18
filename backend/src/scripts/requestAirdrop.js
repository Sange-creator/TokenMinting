import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import 'dotenv/config';

async function requestAirdrop() {
    try {
        // Connect to devnet
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Get keypair from environment
        const secretKey = bs58.decode(process.env.SECRET_KEY);
        const keypair = Keypair.fromSecretKey(secretKey);
        
        console.log('\nRequesting Airdrop...');
        console.log('-------------------');
        console.log('Public Key:', keypair.publicKey.toString());
        
        // Check initial balance
        const initialBalance = await connection.getBalance(keypair.publicKey);
        console.log(`Initial balance: ${initialBalance / LAMPORTS_PER_SOL} SOL`);
        
        // Request airdrop of 2 SOL
        const signature = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
        
        // Confirm transaction
        await connection.confirmTransaction(signature);
        
        // Check new balance
        const newBalance = await connection.getBalance(keypair.publicKey);
        console.log(`\nAirdrop successful!`);
        console.log(`New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
        console.log('\nView your account on Solana Explorer:');
        console.log(`https://explorer.solana.com/address/${keypair.publicKey.toString()}?cluster=devnet`);
        
    } catch (error) {
        console.error('Error requesting airdrop:', error.message);
    }
}

requestAirdrop(); 