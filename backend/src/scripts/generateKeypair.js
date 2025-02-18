import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

function generateNewKeypair() {
    // Generate a new random keypair
    const keypair = Keypair.generate();
    
    console.log('\nNew Keypair Generated:');
    console.log('---------------------');
    console.log('Public Key:', keypair.publicKey.toString());
    console.log('\nSecret Key Formats:');
    console.log('Base58:', bs58.encode(keypair.secretKey));
    console.log('Array:', Array.from(keypair.secretKey));
    console.log('\nDevnet Explorer Link:');
    console.log(`https://explorer.solana.com/address/${keypair.publicKey.toString()}?cluster=devnet`);
    console.log('\nTo use this keypair, update your .env file with the Base58 secret key.');
}

generateNewKeypair(); 