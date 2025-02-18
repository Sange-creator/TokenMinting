import { Connection } from '@solana/web3.js';

export function getSolanaConnection() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    
    const connection = new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: false
    });

    console.log(`Connected to Solana devnet at ${rpcUrl}`);
    return connection;
} 