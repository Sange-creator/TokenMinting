import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Connection } from '@solana/web3.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function waitForValidator(maxAttempts = 30) {
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await connection.getVersion();
      console.log('Validator is ready!');
      return true;
    } catch (error) {
      console.log(`Waiting for validator to start... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Validator failed to start');
}

export async function setupLocalnet() {
  try {
    console.log('Setting up localnet environment...');

    // 1. Kill any existing validator
    try {
      execSync('pkill solana-test-validator');
      console.log('Stopped existing validator');
      // Give it a moment to fully shut down
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Ignore error if no validator was running
    }

    // 2. Start the validator with the Token Metadata Program from devnet
    console.log('Starting validator with Token Metadata Program...');
    
    const validatorProcess = require('child_process').spawn('solana-test-validator', [
      '--reset',
      '--clone', 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
      '--url', 'https://api.devnet.solana.com',
      '--quiet'
    ], {
      detached: true,
      stdio: 'ignore'
    });

    validatorProcess.unref();

    // 3. Wait for validator to start
    await waitForValidator();

    // 4. Configure Solana CLI to use localnet
    execSync('solana config set --url http://127.0.0.1:8899');
    console.log('Solana CLI configured to use localnet');

    // 5. Airdrop SOL to the wallet
    execSync('solana airdrop 2');
    console.log('Airdropped 2 SOL to wallet');

    console.log('Localnet setup completed successfully!');
    console.log('The validator is running in the background.');
    console.log('You can now start your application.');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupLocalnet()
    .then(() => {
      console.log('Setup completed successfully!');
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
} 