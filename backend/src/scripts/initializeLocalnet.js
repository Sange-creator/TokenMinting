import { execSync } from 'child_process';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeLocalnet() {
  try {
    // Set Solana config to local
    execSync('solana config set --url http://127.0.0.1:8899');
    console.log('Solana config set to localnet');

    // Create connection
    const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

    // Get or create keypair
    const keyPath = path.join(__dirname, '../../test-ledger/validator-keypair.json');
    let keypair;

    if (fs.existsSync(keyPath)) {
      const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
      keypair = Keypair.fromSecretKey(new Uint8Array(keyData));
    } else {
      keypair = Keypair.generate();
      fs.writeFileSync(keyPath, JSON.stringify(Array.from(keypair.secretKey)));
    }

    console.log('Using keypair:', keypair.publicKey.toString());

    // Request airdrop
    const signature = await connection.requestAirdrop(
      keypair.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    console.log('Airdropped 10 SOL to keypair');

    // Update .env with keypair
    const envPath = path.join(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Update SECRET_KEY
    const secretKeyLine = `SECRET_KEY=[${Array.from(keypair.secretKey)}]`;
    if (envContent.includes('SECRET_KEY=')) {
      envContent = envContent.replace(/SECRET_KEY=.*/, secretKeyLine);
    } else {
      envContent += `\n${secretKeyLine}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env with keypair');

    return keypair;
  } catch (error) {
    console.error('Failed to initialize localnet:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeLocalnet()
    .then(() => {
      console.log('Localnet initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Localnet initialization failed:', error);
      process.exit(1);
    });
} 