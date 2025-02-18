import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import 'dotenv/config';

function showKeypairInfo() {
    try {
        // Decode the secret key from base58
        const secretKey = bs58.decode(process.env.SECRET_KEY);
        const keypair = Keypair.fromSecretKey(secretKey);

        console.log('\nKeypair Information:');
        console.log('-------------------');
        console.log('Public Key:', keypair.publicKey.toString());
        console.log('Secret Key (base58):', process.env.SECRET_KEY);
        console.log('Secret Key (array):', Array.from(secretKey));
        console.log('\nYou can use this public key to check your balance on Solana Explorer:');
        console.log(`https://explorer.solana.com/address/${keypair.publicKey.toString()}?cluster=devnet`);
    } catch (error) {
        console.error('Error decoding keypair:', error.message);
    }
}

showKeypairInfo(); 