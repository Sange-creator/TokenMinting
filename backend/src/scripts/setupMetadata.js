import { Connection, Keypair } from '@solana/web3.js';
import { execSync } from 'child_process';
import { PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

export async function setupMetadataProgram() {
  try {
    console.log('Setting up Token Metadata Program...');
    
    // Stop any running validator
    try {
      console.log('Stopping any running validator...');
      execSync('pkill solana-test-validator');
      // Wait for the validator to fully stop
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Ignore error if no validator was running
    }

    // Start the validator
    console.log('\nStarting Solana test validator...');
    const validatorCmd = 'solana-test-validator --reset';
    console.log(`Running command: ${validatorCmd}`);
    
    // Start validator in the background
    const child = spawn('solana-test-validator', ['--reset'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Detach the child process
    child.unref();
    
    // Wait for the validator to start
    console.log('Waiting for validator to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\nSetup completed successfully!');
    console.log(`Token Metadata Program ID: ${PROGRAM_ID.toBase58()}`);
    console.log('Solana test validator is running in the background.');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupMetadataProgram()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupMetadataProgram }; 