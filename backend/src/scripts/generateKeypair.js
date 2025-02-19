import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Generate a new keypair
const keypair = Keypair.generate();

// Get the secret key in different formats
const secretKeyArray = Array.from(keypair.secretKey);
const secretKeyBase58 = bs58.encode(keypair.secretKey);

console.log('Public Key:', keypair.publicKey.toBase58());
console.log('\nSecret Key (Base58 format):');
console.log(secretKeyBase58);
console.log('\nSecret Key (JSON Array format):');
console.log(JSON.stringify(secretKeyArray));

console.log('\nDevnet Explorer Link:');
console.log(`https://explorer.solana.com/address/${keypair.publicKey.toString()}?cluster=devnet`);
console.log('\nTo use this keypair, update your .env file with the Base58 secret key.'); 